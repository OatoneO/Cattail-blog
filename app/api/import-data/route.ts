import { NextResponse } from 'next/server';
import { importData } from '@/lib/neo4j-service';

export async function POST(request: Request) {
  console.log('收到POST请求');
  try {
    const data = await request.json();
    console.log('收到导入请求:', data.nodes.length, '个节点');
    console.log('数据类型:', data.type);
    
    // 检查并修正节点类型
    if (data.type === 'html' || data.type === 'css') {
      const expectedType = `${data.type}_concept`;
      let processedCount = 0;
      
      // 确保所有节点都有正确的类型
      data.nodes.forEach((node: any) => {
        if (node.type !== expectedType) {
          console.log(`修正节点类型 - 节点ID: ${node.id}, 原类型: ${node.type}, 新类型: ${expectedType}`);
          node.type = expectedType;
          processedCount++;
        }
      });
      
      if (processedCount > 0) {
        console.log(`已修正 ${processedCount} 个节点的类型为 ${expectedType}`);
      }
    }
    
    const result = await importData(data, data.type);
    console.log('导入成功:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('导入数据失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入数据失败' },
      { status: 500 }
    );
  }
} 