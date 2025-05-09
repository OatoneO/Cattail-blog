/**
 * 认证中间件
 * 处理路由访问权限控制
 * 
 * 功能：
 * - 定义需要认证的路由
 * - 定义公开访问的路由
 * - 处理认证状态
 */

import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // 公开路由，不需要认证
  publicRoutes: [
    "/",
    "/blog(.*)",
    "/api/blog(.*)",
    "/api/projects(.*)",
    "/api/graph-data(.*)",
    "/api/import-data(.*)",
    "/api/admin/upload",
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 