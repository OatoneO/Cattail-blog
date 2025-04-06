import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // if (!process.env.DATABASE_URL) {
  //   throw new Error("DATABASE_URL is not defined in environment variables");
  // }
  // return new PrismaClient();
};

globalThis.prismaGlobal = globalThis.prismaGlobal || prismaClientSingleton();

const prisma = globalThis.prismaGlobal;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
