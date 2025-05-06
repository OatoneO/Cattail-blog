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
    const blog = await updateBlog(slug, data);
    return NextResponse.json(blog);
  } catch (error) {
    console.error('更新博客失败:', error);
    return NextResponse.json(
      { error: '更新博客失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = params;
    await deleteBlog(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除博客失败:', error);
    return NextResponse.json(
      { error: '删除博客失败' },
      { status: 500 }
    );
  }
} 