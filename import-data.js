import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importData() {
  try {
    // 读取JSON文件
    const data = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'mdn-knowledge-graph', 'css_knowledge_graph.json'),
        'utf8'
      )
    );

    console.log('准备导入数据...');
    console.log('数据包含:', data.nodes.length, '个节点');
    
    // 发送数据到导入API
    const response = await fetch('http://localhost:3001/api/import-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }

    const result = await response.json();
    console.log('导入结果:', result);
  } catch (error) {
    console.error('导入失败:', error);
  }
}

importData(); 