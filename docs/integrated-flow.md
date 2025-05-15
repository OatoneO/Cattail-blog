# Cattail.me 系统整合流程图

## 系统完整流程图
```mermaid
graph TB
    %% 系统入口
    Start((开始)) --> Role{用户角色}
    
    %% 用户角色分支
    Role -->|访客| Visitor[访客功能]
    Role -->|管理员| Admin[管理员功能]
    
    %% 前端层
    subgraph 前端层
        UI[用户界面]
        Next[Next.js应用]
        Tailwind[Tailwind CSS]
    end
    
    %% 后端层
    subgraph 后端层
        API[API路由]
        Auth[Clerk认证]
        Prisma[Prisma ORM]
        Neo4j[Neo4j图数据库]
    end
    
    %% 数据层
    subgraph 数据层
        SQLite[(SQLite数据库)]
        FileSystem[文件系统]
    end
    
    %% 访客功能模块
    subgraph 访客功能
        Visitor --> V1[浏览博客]
        Visitor --> V2[探索知识图谱]
        Visitor --> V3[使用留言板]
        Visitor --> V4[查看项目]
        Visitor --> V5[访问个人主页]
        
        V1 --> BlogProcess[博客处理]
        V2 --> GraphProcess[图谱处理]
        V3 --> MessageProcess[留言处理]
        V4 --> ProjectProcess[项目处理]
        V5 --> ProfileProcess[主页处理]
    end
    
    %% 管理员功能模块
    subgraph 管理员功能
        Admin --> A1[博客管理]
        Admin --> A2[知识图谱管理]
        Admin --> A3[文件管理]
        Admin --> A4[项目管理]
        
        A1 --> BlogManage[博客管理流程]
        A2 --> GraphManage[图谱管理流程]
        A3 --> FileManage[文件管理流程]
        A4 --> ProjectManage[项目管理流程]
    end
    
    %% 数据处理流程
    subgraph 数据处理
        BlogProcess --> ContentProcess[内容处理]
        GraphProcess --> NLP[自然语言处理]
        MessageProcess --> MessageDB[留言存储]
        ProjectProcess --> ProjectDB[项目存储]
        ProfileProcess --> ProfileDB[个人信息存储]
        
        ContentProcess --> SQLite
        NLP --> Neo4j
        MessageDB --> SQLite
        ProjectDB --> SQLite
        ProfileDB --> SQLite
    end
    
    %% 管理流程
    subgraph 管理流程
        BlogManage --> BlogEdit[博客编辑]
        GraphManage --> GraphEdit[图谱编辑]
        FileManage --> FileUpload[文件上传]
        ProjectManage --> ProjectEdit[项目编辑]
        
        BlogEdit --> FileSystem
        GraphEdit --> Neo4j
        FileUpload --> FileSystem
        ProjectEdit --> SQLite
    end
    
    %% 数据展示流程
    subgraph 数据展示
        SQLite --> BlogDisplay[博客展示]
        Neo4j --> GraphDisplay[图谱展示]
        SQLite --> TagCloud[标签云]
        SQLite --> ProjectDisplay[项目展示]
        SQLite --> ProfileDisplay[主页展示]
    end
    
    %% 系统状态
    subgraph 系统状态
        State1[未登录] --> State2[已登录]
        State2 --> State3[访客]
        State2 --> State4[管理员]
        State3 --> State4
        State4 --> State3
    end
    
    %% 连接关系
    UI --> Next
    Next --> API
    API --> Auth
    API --> Prisma
    API --> Neo4j
    Prisma --> SQLite
    Next --> FileSystem
    
    %% 结束节点
    BlogDisplay --> End((结束))
    GraphDisplay --> End
    TagCloud --> End
    ProjectDisplay --> End
    ProfileDisplay --> End
```

## 图例说明

1. **系统层级**
   - 前端层：负责用户界面展示
   - 后端层：处理业务逻辑和数据访问
   - 数据层：存储系统数据

2. **功能模块**
   - 访客功能：面向普通用户的功能
   - 管理员功能：面向管理员的功能
   - 数据处理：系统内部的数据处理流程
   - 管理流程：管理员操作的处理流程
   - 数据展示：最终的数据展示流程

3. **状态转换**
   - 未登录 -> 已登录：用户认证
   - 已登录 -> 访客/管理员：权限分配
   - 访客 <-> 管理员：权限变更

4. **数据流向**
   - 实线箭头：表示数据流向
   - 虚线箭头：表示控制流向
   - 双向箭头：表示双向交互
``` 