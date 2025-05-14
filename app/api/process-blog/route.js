/**
 * 博客知识图谱处理API
 * 
 * 该API负责处理博客内容并生成知识图谱数据，主要功能包括：
 * 1. 接收博客内容数据
 * 2. 调用知识图谱处理器提取实体和关系
 * 3. 将处理结果存储到Neo4j数据库
 * 4. 返回处理结果和状态信息
 * 
 * 技术特点：
 * - 使用Next.js API路由处理HTTP请求
 * - 实现了请求参数验证
 * - 支持异步处理和错误处理
 * - 提供了详细的处理状态和错误信息
 */

import { NextResponse } from 'next/server';
import { getBlogBySlug, getAllBlogs } from '@/lib/db/blog-service';
// 使用命名导入
import { processBlogContent } from '@/lib/blog-knowledge-processor';
import * as neo4jService from '@/lib/neo4j-service';
import neo4j from 'neo4j-driver';

/**
 * Neo4j数据库连接配置
 */
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

/**
 * 创建Neo4j数据库连接
 * @returns {neo4j.Driver} Neo4j驱动实例
 */
function createDriver() {
  return neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
}

/**
 * 存储知识图谱数据到Neo4j
 * @param {Object} graphData - 知识图谱数据
 * @returns {Promise<void>}
 */
async function storeGraphData(graphData) {
  const driver = createDriver();
  const session = driver.session();
  
  try {
    const tx = session.beginTransaction();
    
    // 存储节点
    for (const node of graphData.nodes) {
      await tx.run(
        `MERGE (n:${node.type} {id: $id})
         SET n += $properties`,
        { id: node.id, properties: node.properties }
      );
    }
    
    // 存储关系
    for (const rel of graphData.relationships) {
      await tx.run(
        `MATCH (source {id: $sourceId})
         MATCH (target {id: $targetId})
         MERGE (source)-[r:${rel.type}]->(target)`,
        { sourceId: rel.source, targetId: rel.target }
      );
    }
    
    await tx.commit();
  } finally {
    await session.close();
    await driver.close();
  }
}

/**
 * POST请求处理函数
 * 处理博客内容并生成知识图谱数据
 * 
 * @param {Request} request - HTTP请求对象
 * @returns {Promise<NextResponse>} 处理结果响应
 */
export async function POST(request) {
  try {
    // 解析请求体
    const blogData = await request.json();
    
    // 验证请求数据
    if (!blogData || !blogData.title || !blogData.content) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // 处理博客内容
    const graphData = await processBlogContent(blogData);
    
    // 存储到Neo4j
    await storeGraphData(graphData);
    
    // 返回处理结果
    return NextResponse.json({
      success: true,
      message: 'Blog processed successfully',
      data: graphData
    });
    
  } catch (error) {
    console.error('Error processing blog:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
        await storeGraphData(graphData);
        
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
    
    // 直接使用博客标签作为节点标签
    const nodeLabel = tag;
    
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
    console.log(`开始存储 ${nodes.length} 个节点到 Neo4j (标签: ${nodeLabel})...`);
    
    for (const node of nodes) {
      console.log(`处理节点: ${node.id}, 类型: ${node.type}`);
      
      // 处理缺失的属性以避免Neo4j错误
      const properties = node.properties || {};
      const nodeProps = {
        id: node.id,
        type: node.type,
        title: properties.title || '',
        url: properties.url || '',
        summary: properties.summary || '',
        category: properties.category || ''
      };
      
      // 日志记录完整的节点属性
      console.log('节点属性:', JSON.stringify(nodeProps));
      
      // 使用MERGE操作以避免重复
      try {
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
          nodeProps
        );
        console.log(`节点 ${node.id} 成功存储`);
      } catch (error) {
        console.error(`存储节点 ${node.id} 失败:`, error);
        // 继续处理其他节点
      }
    }
    
    console.log('所有节点存储完成');
  } finally {
    await session.close();
  }
}

// 存储关系到Neo4j
async function storeNeo4jRelationships(relationships) {
  const session = neo4jService.getSession();
  
  try {
    console.log(`开始存储 ${relationships.length} 个关系到 Neo4j...`);
    
    for (const rel of relationships) {
      console.log(`处理关系: ${rel.source} -> ${rel.target} [${rel.type}]`);
      
      try {
        await session.run(
          `MATCH (a {id: $sourceId}), (b {id: $targetId})
           MERGE (a)-[r:${rel.type}]->(b)
           ${rel.properties ? 'ON CREATE SET r += $properties' : ''}`,
          {
            sourceId: rel.source,
            targetId: rel.target,
            properties: rel.properties || {}
          }
        );
        console.log(`关系 ${rel.source} -> ${rel.target} 成功存储`);
      } catch (error) {
        console.error(`存储关系 ${rel.source} -> ${rel.target} 失败:`, error);
        // 继续处理其他关系
      }
    }
    
    console.log('所有关系存储完成');
  } finally {
    await session.close();
  }
} 