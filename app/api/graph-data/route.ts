import { NextResponse } from 'next/server';
import { getGraphData, getGraphDataByTag, getAllTags, getAllGraphData } from '@/lib/neo4j-service';

export async function GET(request: Request) {
  try {
    // 从URL参数中获取图谱类型或标签
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const all = searchParams.get('all'); // 新增参数，获取所有节点
    
    // 如果请求所有数据，不进行类型或标签筛选
    if (all === 'true') {
      const data = await getAllGraphData();
      return NextResponse.json(data);
    }
    
    // 如果指定了标签，从标签获取数据
    if (tag) {
      const data = await getGraphDataByTag(tag);
      return NextResponse.json(data);
    }
    
    // 如果请求获取所有标签
    if (type === 'tags') {
      const tags = await getAllTags();
      return NextResponse.json({ tags });
    }
    
    // 否则按原有方式获取数据
    const data = await getGraphData(type as 'css' | 'html' || 'css');
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取图谱数据失败:', error);
    return NextResponse.json(
      { error: '获取图谱数据失败' },
      { status: 500 }
    );
  }
} 