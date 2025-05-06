import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminBlogItem from "@/components/blog/AdminBlogItem";
import { getAllBlogs } from "@/lib/db/blog-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBlogsPage() {
  const blogs = await getAllBlogs();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">博客管理</h1>
        <Link href="/admin/blogs/new">
          <Button className="gap-1">
            <PlusCircle className="w-4 h-4" />
            <span>新建博客</span>
          </Button>
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">暂无博客文章</p>
          <Link href="/admin/blogs/new">
            <Button size="sm" variant="outline">
              创建第一篇博客
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <AdminBlogItem key={blog.slug} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
} 