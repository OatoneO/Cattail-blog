/**
 * 知识图谱数据导入工具
 * 
 * 该模块负责将各种格式的知识图谱数据导入到系统中，主要功能包括：
 * 1. 读取MDN知识图谱JSON文件
 * 2. 验证和规范化节点类型
 * 3. 批量导入知识图谱数据
 * 4. 支持多种数据源的处理
 * 5. 提供导入过程的日志记录
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importData() {
  try {
    // 获取mdn-knowledge-graph目录下的所有JSON文件
    const knowledgeGraphDir = path.join(__dirname, 'mdn-knowledge-graph');
    const files = fs.readdirSync(knowledgeGraphDir)
      .filter(file => file.endsWith('.json'));
    
    console.log(`找到 ${files.length} 个JSON文件需要导入`);
    
    // 遍历所有JSON文件并导入
    for (const file of files) {
      console.log(`正在处理文件: ${file}`);
      
      // 从文件名推断类型 (例如: css_knowledge_graph.json -> css)
      const type = file.split('_')[0];
      
      // 读取JSON文件
      const data = JSON.parse(
        fs.readFileSync(
          path.join(knowledgeGraphDir, file),
          'utf8'
        )
      );

      console.log(`准备导入${type}数据...`);
      console.log(`数据包含: ${data.nodes.length} 个节点`);
      
      // 检查节点类型是否正确
      const expectedType = `${type}_concept`;
      let hasTypeIssue = false;
      
      // 验证节点类型并规范化
      data.nodes.forEach(node => {
        console.log(`节点ID: ${node.id}, 节点类型: ${node.type}`);
        if (node.type !== expectedType) {
          console.log(`节点 ${node.id} 类型不匹配，预期: ${expectedType}, 实际: ${node.type}`);
          node.type = expectedType;
          hasTypeIssue = true;
        }
      });
      
      if (hasTypeIssue) {
        console.log(`检测到节点类型问题，已修正为 ${expectedType}`);
      }
      
      // 发送数据到导入API
      const response = await fetch('http://localhost:3000/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nodes: data.nodes, 
          relationships: data.relationships || [], 
          type 
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }

      const result = await response.json();
      console.log(`${type}数据导入结果:`, result);
    }
    
    console.log('所有数据导入完成');
  } catch (error) {
    console.error('导入失败:', error);
  }
}

// 执行导入
importData();