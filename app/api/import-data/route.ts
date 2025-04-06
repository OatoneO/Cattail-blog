import { NextResponse } from 'next/server';
import { importData } from '@/lib/neo4j-service';

export async function POST(request: Request) {
  console.log('收到POST请求');
  try {
    const data = await request.json();
    console.log('收到导入请求:', data.nodes.length, '个节点');
    const result = await importData(data);
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