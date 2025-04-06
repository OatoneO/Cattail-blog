import { readFileSync } from 'fs';
import { importData, getGraphData, closeConnection } from './lib/neo4j-service.js';

async function main() {
    try {
        // 读取知识图谱数据
        const data = JSON.parse(readFileSync('mdn-knowledge-graph/css_knowledge_graph.json', 'utf8'));
        
        // 尝试导入数据
        console.log('开始导入数据...');
        const result = await importData(data);
        console.log('导入结果:', result);
        
        // 验证数据是否导入成功
        console.log('验证数据...');
        const graphData = await getGraphData();
        console.log(`成功获取 ${graphData.nodes.length} 个节点和 ${graphData.relationships.length} 个关系`);
        
    } catch (error) {
        console.error('操作失败:', error);
    } finally {
        closeConnection();
    }
}

main(); 