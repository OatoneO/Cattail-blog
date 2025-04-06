import { readFileSync, writeFileSync } from 'fs';

// 读取原始数据
const rawData = JSON.parse(readFileSync('mdn-knowledge-graph/css_knowledge_graph.json', 'utf8'));

// 处理文档数据
const nodes = rawData.nodes.map(doc => {
    return {
        id: doc.id,
        type: doc.type,
        properties: {
            title: doc.properties.title,
            url: doc.properties.url,
            summary: doc.properties.summary,
            category: doc.properties.category,
            popularity: doc.properties.popularity
        }
    };
});

// 创建知识图谱数据对象
const knowledgeGraph = {
    nodes: nodes,
    meta: {
        source: 'MDN CSS Documentation',
        timestamp: rawData.meta.timestamp,
        total_nodes: nodes.length
    }
};

// 将处理后的数据写入新文件
writeFileSync(
    'mdn-knowledge-graph/css_knowledge_graph.json',
    JSON.stringify(knowledgeGraph, null, 2),
    'utf8'
);

console.log(`处理完成！共生成 ${nodes.length} 个节点`); 