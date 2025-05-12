/**
 * 认证中间件
 * 处理路由访问权限控制
 * 
 * 功能：
 * - 定义需要认证的路由
 * - 定义公开访问的路由
 * - 处理认证状态
 */

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 