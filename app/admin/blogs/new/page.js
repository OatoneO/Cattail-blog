import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BlogForm from "@/components/blog/BlogForm";

export default function NewBlogPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/blogs"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> 返回博客列表
        </Link>
        <h1 className="text-2xl font-bold mt-4">创建新博客</h1>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <BlogForm />
      </div>
    </div>
  );
} 