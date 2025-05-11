# Cattail.me - 个人博客系统

## 项目简介

Cattail.me 是一个现代化的个人博客系统，采用 Next.js 14 构建，集成了知识图谱、标签云等创新功能，为用户提供丰富的博客阅读和写作体验。

## 运行环境要求

- Node.js 18.0.0 或更高版本
- PostgreSQL 数据库
- Neo4j 图数据库
- npm 或 yarn 包管理器

## 系统开发环境

### 前端技术栈

1. **Next.js 14**
   - 使用 App Router 架构
   - 支持服务端渲染(SSR)和静态站点生成(SSG)
   - 内置 API 路由功能
   - 优点：提供优秀的开发体验和性能优化

2. **React 18**
   - 使用最新的 React 特性
   - 支持并发渲染
   - 优点：提供更好的性能和用户体验

3. **Tailwind CSS**
   - 原子化 CSS 框架
   - 自定义主题配置
   - 优点：快速开发，高度可定制

4. **D3.js**
   - 用于构建交互式知识图谱
   - 支持力导向图布局
   - 优点：强大的数据可视化能力

### 后端技术栈

1. **Prisma ORM**
   - 类型安全的数据库访问
   - 自动生成的类型定义
   - 优点：提供类型安全和开发效率

2. **Neo4j 图数据库**
   - 存储知识图谱数据
   - 支持复杂的关系查询
   - 优点：高效处理图数据结构

3. **PostgreSQL**
   - 主数据库
   - 存储博客内容、用户数据等
   - 优点：可靠性和性能

### 认证与安全

1. **Clerk**
   - 用户认证和授权
   - 社交登录集成
   - 优点：简化认证流程，提供安全保障

### 部署与监控

1. **Vercel**
   - 自动部署
   - 性能监控
   - 优点：无缝集成，优秀的性能

## 系统功能特点

1. **知识图谱**
   - 可视化展示博客内容关联
   - 交互式探索
   - 支持按标签筛选

2. **标签云**
   - 动态展示内容标签
   - 交互式动画效果
   - 支持标签筛选

3. **响应式设计**
   - 适配各种设备尺寸
   - 优化的移动端体验

4. **暗色模式**
   - 支持系统主题切换
   - 自定义主题配置

## 开发指南

1. 克隆项目
```bash
git clone https://github.com/yourusername/Cattail.me.git
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息
```

4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

## 部署说明

1. 构建项目
```bash
npm run build
# 或
yarn build
```

2. 启动生产服务器
```bash
npm run start
# 或
yarn start
```

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License

## 博客管理

### 导入博客

项目提供了批量导入MDX格式博客的工具，支持以下功能：

- 批量导入content/blog目录下的所有MDX文件
- 导入时自动处理知识图谱数据
- 支持指定特定文件导入
- 支持更新已存在的博客

使用方法：

```bash
# 导入所有博客
node scripts/import-blogs.js

# 只导入特定文件
node scripts/import-blogs.js -f html5-semantic-elements.mdx

# 导入时不更新已存在的博客
node scripts/import-blogs.js --no-update

# 查看更多选项
node scripts/import-blogs.js --help
```

### 知识图谱处理

导入博客时会自动处理知识图谱数据，你也可以单独触发知识图谱处理：

```bash
# 处理单篇博客的知识图谱
curl -X POST http://localhost:3000/api/process-blog -H "Content-Type: application/json" -d '{"slug":"blog-slug"}'

# 处理所有博客的知识图谱
curl http://localhost:3000/api/process-blog
```