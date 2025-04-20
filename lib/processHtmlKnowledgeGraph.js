import { readFileSync, writeFileSync } from 'fs';

// 读取原始数据
const rawData = JSON.parse(readFileSync('mdn_html_docs.json', 'utf8'));

// 处理文档数据
const nodes = rawData.documents.map(doc => {
    return {
        id: doc.slug,
        type: 'html_concept',
        properties: {
            title: doc.title,
            url: doc.url,
            summary: doc.summary,
            category: doc.category,
            popularity: doc.popularity
        }
    };
});

// 创建关系
const relationships = [];
const categoryMap = {};

// 按类别分组
nodes.forEach(node => {
    const category = node.properties.category;
    if (!categoryMap[category]) {
        categoryMap[category] = [];
    }
    categoryMap[category].push(node.id);
});

// 创建同类别内的关系
Object.values(categoryMap).forEach(categoryNodes => {
    for (let i = 0; i < categoryNodes.length; i++) {
        for (let j = i + 1; j < categoryNodes.length; j++) {
            relationships.push({
                source: categoryNodes[i],
                target: categoryNodes[j],
                type: 'RELATED_TO'
            });
        }
    }
});

// 创建知识图谱数据对象
const knowledgeGraph = {
    nodes: nodes,
    relationships: relationships,
    meta: {
        source: 'MDN HTML Documentation',
        timestamp: rawData.meta.timestamp,
        total_nodes: nodes.length,
        total_relationships: relationships.length
    }
};

// 将处理后的数据写入新文件
writeFileSync(
    'mdn-knowledge-graph/html_knowledge_graph.json',
    JSON.stringify(knowledgeGraph, null, 2),
    'utf8'
);

console.log(`处理完成！共生成 ${nodes.length} 个节点和 ${relationships.length} 个关系`); 