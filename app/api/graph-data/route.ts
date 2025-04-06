import { NextResponse } from 'next/server';
import { getGraphData } from '@/lib/neo4j-service';

export async function GET() {
  console.log('收到获取图谱数据的 API 请求');
  
  try {
    console.log('开始从 Neo4j 获取数据...');
    const data = await getGraphData();
    console.log('成功获取图谱数据:', data);
    console.log(`返回 ${data.nodes.length} 个节点和 ${data.relationships.length} 个关系`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取图谱数据失败:', error);
    return NextResponse.json(
      { error: '获取图谱数据失败' },
      { status: 500 }
    );
  }
} 