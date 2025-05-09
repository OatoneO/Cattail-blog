/**
 * 博客API路由处理模块
 * 处理博客相关的HTTP请求
 * 
 * 路由功能：
 * - GET: 获取所有博客列表
 * - POST: 创建新博客
 */

import { NextResponse } from 'next/server';
import { createBlog, getAllBlogs } from '@/lib/db/blog-service';

export async function GET() {
  try {
    const blogs = await getAllBlogs();
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('获取博客列表失败:', error);
    return NextResponse.json(
      { error: '获取博客列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const blog = await createBlog(data);
    return NextResponse.json(blog);
  } catch (error) {
    console.error('创建博客失败:', error);
    return NextResponse.json(
      { error: '创建博客失败' },
      { status: 500 }
    );
  }
} 