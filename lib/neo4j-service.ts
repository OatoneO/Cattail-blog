import neo4j from 'neo4j-driver';

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

// Neo4j连接配置
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'Boge1010!'
  )
);

// 测试数据库连接
async function testConnection() {
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
    
    const nodes: ApiNode[] = result.records.map(record => {
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
    result.records.forEach(record => {
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
  driver.close();
} 