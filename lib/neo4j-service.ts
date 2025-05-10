import neo4j, { Record, Driver } from 'neo4j-driver';

interface Node {
  id: string;
  type: string;
  properties: {
    title: string;
    url: string;
    summary: string;
    category?: string;
    popularity?: number;
  };
}

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

// 用于 API 返回的节点类型
interface ApiNode {
  id: string;
  label: string;
  type: string;
  properties: {
    url: string;
    summary: string;
    category: string;
  };
}

// 用于 API 返回的关系类型
interface ApiRelationship {
  source: string;
  target: string;
  type: string;
}

// 用于 API 返回的图谱数据类型
interface ApiGraphData {
  nodes: ApiNode[];
  relationships: ApiRelationship[];
}

// 防止客户端导入时创建多个连接
let driver: Driver | null = null;

// 获取或创建 Neo4j 驱动
export function getDriver(): Driver | null {
  // 如果已经存在驱动，直接返回
  if (driver) {
    return driver;
  }
  
  // 只在服务器端创建连接
  if (typeof window === 'undefined') {
    driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'Boge1010!'
      )
    );
    return driver;
  }
  
  return null;
}

// 获取会话方法
export function getSession() {
  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  return driver.session();
}

// 测试数据库连接
async function testConnection() {
  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 as n');
    console.log('数据库连接成功:', result.records[0].get('n').toNumber());
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  } finally {
    await session.close();
  }
}

export async function importData(data: GraphData, type: 'css' | 'html' = 'css') {
  console.log(`正在测试数据库连接... (导入类型: ${type})`);
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('无法连接到数据库');
  }

  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  
  const session = driver.session();
  try {
    // 确定正确的节点标签
    // HTML节点类型在JSON中可能是html_concept，但我们在Neo4j中将其规范化为HTMLConcept
    const nodeLabel = type.toUpperCase() + 'Concept';
    
    console.log(`清除现有${nodeLabel}数据...`);
    // 清除现有数据
    await session.run(`MATCH (n:${nodeLabel}) DETACH DELETE n`);
    
    console.log(`创建${nodeLabel}节点...`);
    // 创建节点
    for (const node of data.nodes) {
      // 检查节点类型是否与预期相符
      console.log(`节点类型: ${node.type}, 预期类型: ${type}_concept`);
      
      await session.run(
        `CREATE (n:${nodeLabel} {
          id: $id,
          type: $type,
          title: $title,
          url: $url,
          summary: $summary,
          category: $category
        })`,
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
    
    console.log(`创建${nodeLabel}关系...`);
    // 创建关系（基于类别）
    await session.run(`
      MATCH (a:${nodeLabel}), (b:${nodeLabel})
      WHERE a.category = b.category AND a.id <> b.id
      CREATE (a)-[r:RELATED_TO]->(b)
    `);
    
    return { message: `${nodeLabel}数据导入成功` };
  } catch (error) {
    console.error(`导入${type.toUpperCase()}数据错误:`, error);
    throw new Error(`导入${type.toUpperCase()}数据失败`);
  } finally {
    await session.close();
  }
}

export async function getGraphData(type: 'css' | 'html' = 'css'): Promise<ApiGraphData> {
  console.log(`Neo4j 服务: 开始获取${type.toUpperCase()}图谱数据`);
  
  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  
  const session = driver.session();
  try {
    // 确定正确的节点标签
    const nodeLabel = type.toUpperCase() + 'Concept';
    
    console.log(`执行 Neo4j 查询 (节点标签: ${nodeLabel})...`);
    const result = await session.run(`
      MATCH (n:${nodeLabel})
      OPTIONAL MATCH (n)-[r]->(m:${nodeLabel})
      RETURN n, collect(DISTINCT { type: type(r), target: m.id }) as relationships
    `);
    
    console.log(`查询返回 ${result.records.length} 条记录`);
    
    const nodes: ApiNode[] = result.records.map((record: Record) => {
      const node = record.get('n').properties;
      return {
        id: node.id,
        label: node.title,
        type: node.type,
        properties: {
          url: node.url,
          summary: node.summary,
          category: node.category
        }
      };
    });
    
    const relationships: ApiRelationship[] = [];
    result.records.forEach((record: Record) => {
      const sourceId = record.get('n').properties.id;
      const rels = record.get('relationships');
      rels.forEach((rel: { type: string; target: string }) => {
        if (rel.target) {
          relationships.push({
            source: sourceId,
            target: rel.target,
            type: rel.type
          });
        }
      });
    });
    
    console.log(`处理完成: ${nodes.length} 个节点, ${relationships.length} 个关系`);
    return { nodes, relationships };
  } catch (error) {
    console.error('Neo4j 查询错误:', error);
    throw new Error('获取数据失败');
  } finally {
    console.log('关闭 Neo4j 会话');
    await session.close();
  }
}

// 获取所有标签
export async function getAllTags(): Promise<string[]> {
  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  
  const session = driver.session();
  try {
    // 查询所有节点的类别
    const result = await session.run(`
      MATCH (n) 
      WHERE n.category IS NOT NULL
      RETURN DISTINCT n.category as tag
    `);
    
    // 提取所有唯一的标签值
    const tags = result.records.map((record: Record) => record.get('tag').toString());
    return tags;
  } catch (error) {
    console.error('获取标签列表失败:', error);
    throw new Error('获取标签列表失败');
  } finally {
    await session.close();
  }
}

// 根据标签获取知识图谱数据
export async function getGraphDataByTag(tag: string): Promise<ApiGraphData> {
  console.log(`Neo4j 服务: 开始获取标签 ${tag} 的图谱数据`);
  
  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  
  const session = driver.session();
  try {
    console.log(`执行 Neo4j 查询 (标签: ${tag})...`);
    const result = await session.run(`
      MATCH (n)
      WHERE n.category = $tag
      OPTIONAL MATCH (n)-[r]->(m)
      WHERE m.category = $tag
      RETURN n, collect(DISTINCT { type: type(r), target: m.id }) as relationships
    `, { tag });
    
    console.log(`查询返回 ${result.records.length} 条记录`);
    
    const nodes: ApiNode[] = result.records.map((record: Record) => {
      const node = record.get('n').properties;
      return {
        id: node.id,
        label: node.title,
        type: node.type,
        properties: {
          url: node.url,
          summary: node.summary,
          category: node.category
        }
      };
    });
    
    const relationships: ApiRelationship[] = [];
    result.records.forEach((record: Record) => {
      const sourceId = record.get('n').properties.id;
      const rels = record.get('relationships');
      rels.forEach((rel: { type: string; target: string }) => {
        if (rel.target) {
          relationships.push({
            source: sourceId,
            target: rel.target,
            type: rel.type
          });
        }
      });
    });
    
    console.log(`处理完成: ${nodes.length} 个节点, ${relationships.length} 个关系`);
    return { nodes, relationships };
  } catch (error) {
    console.error('Neo4j 查询错误:', error);
    throw new Error('获取数据失败');
  } finally {
    console.log('关闭 Neo4j 会话');
    await session.close();
  }
}

// 获取所有图谱数据，不按标签或类型筛选
export async function getAllGraphData(): Promise<ApiGraphData> {
  console.log('Neo4j 服务: 开始获取所有图谱数据');
  
  const driver = getDriver();
  if (!driver) {
    throw new Error('Neo4j driver not initialized or running on client side');
  }
  
  const session = driver.session();
  try {
    console.log('执行 Neo4j 查询 (获取所有节点和关系)...');
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, collect(DISTINCT { type: type(r), target: m.id }) as relationships
    `);
    
    console.log(`查询返回 ${result.records.length} 条记录`);
    
    const nodes: ApiNode[] = result.records.map((record: Record) => {
      const node = record.get('n').properties;
      return {
        id: node.id,
        label: node.title,
        type: node.type,
        properties: {
          url: node.url,
          summary: node.summary,
          category: node.category
        }
      };
    });
    
    const relationships: ApiRelationship[] = [];
    result.records.forEach((record: Record) => {
      const sourceId = record.get('n').properties.id;
      const rels = record.get('relationships');
      rels.forEach((rel: { type: string; target: string }) => {
        if (rel.target) {
          relationships.push({
            source: sourceId,
            target: rel.target,
            type: rel.type
          });
        }
      });
    });
    
    console.log(`处理完成: ${nodes.length} 个节点, ${relationships.length} 个关系`);
    return { nodes, relationships };
  } catch (error) {
    console.error('Neo4j 查询错误:', error);
    throw new Error('获取数据失败');
  } finally {
    console.log('关闭 Neo4j 会话');
    await session.close();
  }
}

// 关闭数据库连接
export function closeConnection() {
  if (driver) {
    driver.close();
    driver = null;
  }
} 