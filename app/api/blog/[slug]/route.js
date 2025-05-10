/**
 * 单个博客API路由处理模块
 * 处理特定博客的HTTP请求
 * 
 * 路由功能：
 * - GET: 获取指定slug的博客内容
 * - PUT: 更新指定slug的博客内容
 * - DELETE: 删除指定slug的博客
 */

import { NextResponse } from 'next/server';
import { getBlogBySlug, updateBlog, deleteBlog } from '@/lib/db/blog-service';

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const blog = await getBlogBySlug(slug);
    
    if (!blog) {
      return NextResponse.json(
        { error: '博客不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(blog);
  } catch (error) {
    console.error('获取博客失败:', error);
    return NextResponse.json(
      { error: '获取博客失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { slug } = params;
    const data = await request.json();
    
    // 检查博客是否存在
    const existing = await getBlogBySlug(slug);
    if (!existing) {
      return NextResponse.json(
        { error: '博客不存在' },
        { status: 404 }
      );
    }
    
    const updatedBlog = await updateBlog(slug, data);
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('更新博客失败:', error);
    return NextResponse.json(
      { error: '更新博客失败', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = params;
    
    // 检查博客是否存在
    const existing = await getBlogBySlug(slug);
    if (!existing) {
      return NextResponse.json(
        { error: '博客不存在' },
        { status: 404 }
      );
    }
    
    await deleteBlog(slug);
    return NextResponse.json({ message: '博客已删除' });
  } catch (error) {
    console.error('删除博客失败:', error);
    return NextResponse.json(
      { error: '删除博客失败' },
      { status: 500 }
    );
  }
} 