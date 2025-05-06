import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

// 添加连接测试
async function testConnection() {
  try {
    await globalForPrisma.prisma.$connect();
    console.log('Prisma Client 连接成功');
  } catch (error) {
    console.error('Prisma Client 连接失败:', error);
    throw error;
  }
}

// 在开发环境中测试连接
if (process.env.NODE_ENV !== 'production') {
  testConnection().catch(console.error);
}

export default globalForPrisma.prisma; 