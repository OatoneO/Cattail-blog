import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 创建测试项目
  const projects = [
    {
      title: "个人博客系统",
      description: "使用 Next.js 和 Prisma 构建的现代化博客系统",
      link: "https://github.com/yourusername/blog",
      imageUrl: "https://avatars.githubusercontent.com/u/14985020?s=200&v=4",
      technologies: JSON.stringify(["Next.js", "React", "Prisma", "TailwindCSS"])
    },
    {
      title: "在线笔记应用",
      description: "一个简单而强大的在线笔记应用",
      link: "https://github.com/yourusername/notes",
      imageUrl: "https://avatars.githubusercontent.com/u/14985020?s=200&v=4",
      technologies: JSON.stringify(["React", "Node.js", "MongoDB", "Express"])
    },
    {
      title: "任务管理系统",
      description: "帮助团队协作的任务管理工具",
      link: "https://github.com/yourusername/tasks",
      imageUrl: "https://avatars.githubusercontent.com/u/14985020?s=200&v=4",
      technologies: JSON.stringify(["Vue.js", "Firebase", "TailwindCSS"])
    }
  ];

  // 先清空现有数据
  await prisma.project.deleteMany();

  // 添加新数据
  for (const project of projects) {
    await prisma.project.create({
      data: project
    });
  }

  console.log('测试数据已添加');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 