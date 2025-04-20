import { NextResponse } from 'next/server';
import { getGraphData } from '@/lib/neo4j-service';

export async function GET(request: Request) {
  try {
    // 从URL参数中获取图谱类型
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'css' | 'html' || 'css';

    const data = await getGraphData(type);
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取图谱数据失败:', error);
    return NextResponse.json(
      { error: '获取图谱数据失败' },
      { status: 500 }
    );
  }
} 