import fetch from 'node-fetch';
import fs from 'fs/promises';

const MDN_API_BASE_URL = 'https://developer.mozilla.org/api/v1';
const TARGET_CATEGORY = 'HTML';
const SEARCH_KEYWORDS = ['HTML', 'Element', 'Tag', 'Attribute', 'Form', 'Input', 'Table', 'List'];
const HTML_KEYWORDS = [
    'html', 'element', 'tag', 'attribute', 'form', 'input', 'table', 'list',
    'semantic', 'accessibility', 'meta', 'head', 'body', 'div', 'span'
];

const headers = {
    'Accept': 'application/json',
    'User-Agent': 'MDN-HTML-Collector/1.0'
};

// 获取文档分类
function getDocumentCategory(slug) {
    const parts = slug.split('/');
    // 如果路径包含Web/HTML，返回HTML
    if (parts.includes('HTML')) {
        return 'HTML';
    }
    // 如果路径包含Web/API，返回API
    if (parts.includes('API')) {
        return 'API';
    }
    // 其他情况返回Other
    return 'Other';
}

async function fetchHtmlDocs() {
    try {
        console.log(`开始获取 ${TARGET_CATEGORY} 相关文档...`);

        // 合并搜索关键词和分类标识
        const allResults = [];
        for (const keyword of SEARCH_KEYWORDS) {
            const params = new URLSearchParams({
                q: keyword,
                locale: 'zh-CN',
                sort: 'relevance',
                size: 100  // 最大允许值
            });

            const response = await fetch(`${MDN_API_BASE_URL}/search?${params}`, { 
                method: 'GET',
                headers
            });

            if (!response.ok) {
                console.error(`关键词 "${keyword}" 请求失败: ${response.status}`);
                continue;
            }

            const data = await response.json();
            allResults.push(...data.documents);
            console.log(`关键词 "${keyword}" 找到 ${data.documents.length} 个文档`);
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // 避免速率限制
        }

        // 去重并过滤到 HTML 分类
        const uniqueDocs = Array.from(new Map(allResults.map(doc => [doc.slug, doc])).values());
        const htmlDocs = uniqueDocs.filter(doc => {
            const targetText = `${doc.title} ${doc.summary}`.toLowerCase();
            return (
                doc.slug.includes('/HTML') || 
                doc.slug.includes('/Web/HTML') ||
                HTML_KEYWORDS.some(keyword => targetText.includes(keyword))
            );
        });

        console.log(`去重后总文档数: ${uniqueDocs.length}`);
        console.log(`属于 ${TARGET_CATEGORY} 分类的文档数: ${htmlDocs.length}`);

        // 结构化输出
        const output = {
            meta: {
                category: TARGET_CATEGORY,
                keywords: SEARCH_KEYWORDS,
                timestamp: new Date().toISOString()
            },
            documents: htmlDocs.map(doc => ({
                title: doc.title,
                slug: doc.slug,
                url: `https://developer.mozilla.org/zh-CN/docs/${doc.slug}`,
                summary: doc.summary.replace(/\n/g, ' '), // 简化摘要
                category: getDocumentCategory(doc.slug), // 使用新的分类函数
                popularity: doc.popularity,
                lastModified: doc.modified
            }))
        };

        // 按子分类排序
        output.documents.sort((a, b) => {
            const categoryA = a.category || 'Other';
            const categoryB = b.category || 'Other';
            return categoryA.localeCompare(categoryB);
        });

        await fs.writeFile(
            `mdn_html_docs.json`,
            JSON.stringify(output, null, 2),
            'utf-8'
        );

        console.log(`数据已保存到 mdn_html_docs.json`);

    } catch (error) {
        console.error('操作失败:', error.message);
        if (error.stack) console.error('错误堆栈:', error.stack);
    }
}

// 执行函数
fetchHtmlDocs(); 