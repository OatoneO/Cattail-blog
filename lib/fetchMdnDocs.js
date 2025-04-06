import fetch from 'node-fetch';
import fs from 'fs/promises';

const MDN_API_BASE_URL = 'https://developer.mozilla.org/api/v1';
const TARGET_CATEGORY = 'CSS';
const SEARCH_KEYWORDS = ['CSS', 'Style', 'Layout', 'Selector', 'Flexbox', 'Grid'];
const CSS_KEYWORDS = [ // 新增特征库
    'css', 'flexbox', 'grid', 'selector', 'animation', 
    'media query', 'pseudo-class', 'box model'
];

const headers = {
    'Accept': 'application/json',
    'User-Agent': 'MDN-CSS-Collector/1.0'
};

async function fetchCssDocs() {
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

        // 去重并过滤到 CSS 分类
        const uniqueDocs = Array.from(new Map(allResults.map(doc => [doc.slug, doc])).values());
        // const cssDocs = uniqueDocs.filter(doc => 
        //     doc.slug.startsWith('Web/CSS') || // 根据路径判断
        //     doc.summary.includes('层叠样式表') // 中文摘要特征
        // );
        const cssDocs = uniqueDocs.filter(doc => {
            const targetText = `${doc.title} ${doc.summary}`.toLowerCase();
            return (
                doc.slug.includes('/CSS') || 
                CSS_KEYWORDS.some(keyword => targetText.includes(keyword))
            );
        });

        console.log(`去重后总文档数: ${uniqueDocs.length}`);
        console.log(`属于 ${TARGET_CATEGORY} 分类的文档数: ${cssDocs.length}`);

        // 结构化输出
        const output = {
            meta: {
                category: TARGET_CATEGORY,
                keywords: SEARCH_KEYWORDS,
                timestamp: new Date().toISOString()
            },
            documents: cssDocs.map(doc => ({
                title: doc.title,
                slug: doc.slug,
                url: `https://developer.mozilla.org/zh-CN/docs/${doc.slug}`,
                summary: doc.summary.replace(/\n/g, ' '), // 简化摘要
                category: doc.slug.split('/')[2], // 提取子分类如 CSS、HTML
                popularity: doc.popularity,
                lastModified: doc.modified
            }))
        };

        // 按子分类排序
        output.documents.sort((a, b) => a.category.localeCompare(b.category));

        await fs.writeFile(
            `mdn_css_docs.json`,
            JSON.stringify(output, null, 2),
            'utf-8'
        );

        console.log(`数据已保存到 mdn_css_docs.json`);

    } catch (error) {
        console.error('操作失败:', error.message);
        if (error.stack) console.error('错误堆栈:', error.stack);
    }
}

// 执行函数
fetchCssDocs();