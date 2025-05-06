# Cattail Blog

一个基于 Next.js 的个人博客系统，集成了知识图谱、项目管理等功能。

## 功能特点

- 📝 博客文章管理
- 📊 知识图谱可视化
- 🎯 项目管理
- 💬 留言系统
- 🌙 深色模式支持
- 🔐 用户认证

## 技术栈

- Next.js 14
- Prisma
- Tailwind CSS
- TypeScript
- Clerk (认证)

## 开始使用

1. 克隆项目
```bash
git clone https://github.com/yourusername/Cattail-blog.git
cd Cattail-blog
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 到 `.env` 并填写必要的环境变量

4. 初始化数据库
```bash
npx prisma db push
```

5. 启动开发服务器
```bash
npm run dev
```

## 项目结构

```
├── app/                # Next.js 应用目录
│   ├── api/           # API 路由
│   ├── blog/          # 博客相关页面
│   └── projects/      # 项目相关页面
├── components/        # React 组件
│   ├── layout/       # 布局组件
│   ├── blog/         # 博客相关组件
│   ├── project/      # 项目相关组件
│   ├── admin/        # 管理界面组件
│   ├── ui/           # UI 组件
│   └── common/       # 通用组件
├── lib/              # 工具函数和共享代码
├── prisma/           # Prisma schema 和迁移
└── public/           # 静态资源
```

## 开发指南

- 使用 `npm run dev` 启动开发服务器
- 使用 `npm run build` 构建生产版本
- 使用 `npm run lint` 运行代码检查
- 使用 `npx prisma studio` 管理数据库

## 贡献指南

欢迎提交 Pull Request 或创建 Issue。

## 许可证

MIT