/**
 * 管理后台博客列表页面
 * 用于管理所有博客文章
 * 
 * 功能：
 * - 展示所有博客文章
 * - 支持创建新博客
 * - 支持编辑和删除操作
 * - 空状态处理
 */

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminBlogItem from "@/components/blog/AdminBlogItem";
import { getAllBlogs } from "@/lib/db/blog-service";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const blogs = await getAllBlogs();
  
  // 转换数据格式以匹配现有的组件期望
  const formattedBlogs = blogs.map(blog => ({
    ...blog,
    image: blog.images?.[0]?.url || '/images/loading.jpg'
  }));

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">博客管理</h1>
        <Link href="/admin/blogs/new">
          <Button className="gap-1">
            <PlusCircle className="w-4 h-4" />
            <span>新建博客</span>
          </Button>
        </Link>
      </div>

      {formattedBlogs.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">暂无博客文章</p>
          <Link href="/admin/blogs/new">
            <Button size="sm" variant="outline">
              创建第一篇博客
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {formattedBlogs.map((blog) => (
            <AdminBlogItem key={blog.slug} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
} 