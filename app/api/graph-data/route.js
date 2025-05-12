import { NextResponse } from 'next/server';
import * as neo4jService from '@/lib/neo4j-service';

/**
 * 获取知识图谱数据
 * 
 * 请求参数:
 * - tag: 可选，按标签筛选
 * - all: 可选，如果为true，返回所有数据
 */
export async function GET(request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const all = searchParams.get('all') === 'true';
    
    console.log(`处理知识图谱数据请求: tag=${tag}, all=${all}`);
    
    let graphData;
    
    // 根据参数获取不同的数据
    if (all) {
      console.log('获取所有知识图谱数据');
      graphData = await neo4jService.getAllGraphData();
    } else if (tag) {
      console.log(`按标签获取知识图谱数据: ${tag}`);
      graphData = await neo4jService.getGraphDataByTag(tag);
    } else {
      // 默认返回所有数据
      console.log('未指定参数，返回所有数据');
      graphData = await neo4jService.getAllGraphData();
    }
    
    // 确保所有节点的类型为'blog'或'entity'
    if (graphData && graphData.nodes) {
      graphData.nodes = graphData.nodes.map(node => {
        // 如果节点类型不是blog，则设置为entity
        if (node.type !== 'blog') {
          return { ...node, type: 'entity' };
        }
        return node;
      });
    }
    
    console.log(`返回知识图谱数据: ${graphData.nodes.length} 个节点, ${graphData.relationships.length} 个关系`);
    
    return NextResponse.json(graphData);
  } catch (error) {
    console.error('获取知识图谱数据失败:', error);
    return NextResponse.json(
      { error: '获取知识图谱数据失败', details: error.message },
      { status: 500 }
    );
  }
} 