// @ts-check
// 添加类型:"module"以支持ES模块导入
// 使用neo4j-driver直接连接Neo4j数据库
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function clearDatabase() {
  // 创建Neo4j连接
  const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'Boge1010!'
    )
  );
  
  // 测试连接
  try {
    console.log('正在连接到Neo4j数据库...');
    const session = driver.session();
    
    // 检查连接是否正常
    const testResult = await session.run('RETURN 1 as test');
    console.log('连接成功，数据库状态正常');
    
    // 执行清空数据库操作
    console.log('开始清空Neo4j数据库中的所有数据...');
    const result = await session.run('MATCH (n) DETACH DELETE n');
    console.log('数据库已清空。所有节点和关系已被删除。');
    
    // 关闭会话和连接
    await session.close();
    await driver.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('操作过程中发生错误:', error);
    if (driver) {
      await driver.close();
    }
  }
}

// 执行清空操作
clearDatabase(); 