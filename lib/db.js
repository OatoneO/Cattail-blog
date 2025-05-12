import { PrismaClient } from "@prisma/client";

/**
 * 创建并返回PrismaClient实例的函数
 * 该函数确保每次调用时都返回一个新的PrismaClient实例
 * @returns {PrismaClient} 新的PrismaClient实例
 */
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// 在全局对象上定义prismaGlobal，确保在整个应用中只有一个PrismaClient实例
globalThis.prismaGlobal = globalThis.prismaGlobal || prismaClientSingleton();

// 定义prisma变量，指向全局的PrismaClient实例
const prisma = globalThis.prismaGlobal;

// 在非生产环境中，确保prisma变量指向全局的PrismaClient实例
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// 导出prisma实例，供其他模块导入使用
export default prisma;