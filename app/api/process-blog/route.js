/**
 * 博客知识图谱处理API路由
 * 处理博客内容，提取三元组数据，存储到Neo4j
 * 
 * 路由功能：
 * - POST: 处理单篇博客内容，并存储到Neo4j
 * - GET: 处理所有博客内容，重建知识图谱
 */

import { NextResponse } from 'next/server';
import { getBlogBySlug, getAllBlogs } from '@/lib/db/blog-service';
// 使用命名导入
import { processBlogContent } from '@/lib/blog-knowledge-processor';
import * as neo4jService from '@/lib/neo4j-service';

// 不再需要处理导入兼容性
// const blogProcessor = typeof processBlogContent === 'function' 
//   ? processBlogContent 
//   : processBlogContent.processBlogContent;

// 处理单篇博客
export async function POST(request) {
  try {
    const data = await request.json();
    const { slug } = data;
    
    if (!slug) {
      return NextResponse.json(
        { error: '缺少必要参数: slug' },
        { status: 400 }
      );
    }
    
    // 获取博客内容
    const blog = await getBlogBySlug(slug);
    if (!blog) {
      return NextResponse.json(
        { error: `未找到博客: ${slug}` },
        { status: 404 }
      );
    }
    
    // 使用命名导入的函数
    const graphData = await processBlogContent(blog);
    
    // 将数据存储到Neo4j
    await storeBlogGraphData(graphData, blog.tag || 'General');
    
    return NextResponse.json({
      message: '博客知识图谱处理成功',
      nodes: graphData.nodes.length,
      relationships: graphData.relationships.length,
    });
  } catch (error) {
    console.error('处理博客知识图谱失败:', error);
    return NextResponse.json(
      { error: '处理博客知识图谱失败', details: error.message },
      { status: 500 }
    );
  }
}

// 重建所有博客的知识图谱
export async function GET() {
  try {
    // 获取所有博客
    const blogs = await getAllBlogs();
    const results = [];
    
    // 逐个处理博客
    for (const blog of blogs) {
      try {
        const graphData = await processBlogContent(blog);
        await storeBlogGraphData(graphData, blog.tag || 'General');
        
        results.push({
          slug: blog.slug,
          status: 'success',
          nodes: graphData.nodes.length,
          relationships: graphData.relationships.length,
        });
      } catch (error) {
        console.error(`处理博客 ${blog.slug} 失败:`, error);
        results.push({
          slug: blog.slug,
          status: 'error',
          error: error.message,
        });
      }
    }
    
    return NextResponse.json({
      message: '博客知识图谱批量处理完成',
      results
    });
  } catch (error) {
    console.error('批量处理博客知识图谱失败:', error);
    return NextResponse.json(
      { error: '批量处理博客知识图谱失败', details: error.message },
      { status: 500 }
    );
  }
}

// 将博客知识图谱数据存储到Neo4j
async function storeBlogGraphData(graphData, tag) {
  try {
    const { nodes, relationships } = graphData;
    
    // 根据博客标签确定节点标签
    const nodeLabel = tag.toLowerCase().includes('html') ? 'HTMLConcept' : 
                     tag.toLowerCase().includes('css') ? 'CSSConcept' : 
                     'TechConcept';
    
    // 使用Neo4j服务存储节点
    await storeNeo4jNodes(nodes, nodeLabel);
    
    // 存储关系
    await storeNeo4jRelationships(relationships);
    
    return true;
  } catch (error) {
    console.error('存储博客知识图谱数据失败:', error);
    throw error;
  }
}

// 存储节点到Neo4j
async function storeNeo4jNodes(nodes, nodeLabel) {
  const session = neo4jService.getSession();
  
  try {
    for (const node of nodes) {
      // 使用MERGE操作以避免重复
      await session.run(
        `MERGE (n:${nodeLabel} {id: $id})
         ON CREATE SET 
           n.type = $type,
           n.title = $title,
           n.url = $url,
           n.summary = $summary,
           n.category = $category
         ON MATCH SET
           n.url = $url,
           n.summary = $summary,
           n.category = $category`,
        {
          id: node.id,
          type: node.type,
          title: node.properties.title,
          url: node.properties.url,
          summary: node.properties.summary,
          category: node.properties.category || ''
        }
      );
    }
  } finally {
    await session.close();
  }
}

// 存储关系到Neo4j
async function storeNeo4jRelationships(relationships) {
  const session = neo4jService.getSession();
  
  try {
    for (const rel of relationships) {
      await session.run(
        `MATCH (a {id: $sourceId}), (b {id: $targetId})
         MERGE (a)-[r:${rel.type}]->(b)`,
        {
          sourceId: rel.source,
          targetId: rel.target
        }
      );
    }
  } finally {
    await session.close();
  }
} 