"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BlogPreview from "@/components/BlogPreview";

export default function PreviewBlogPage() {
  const searchParams = useSearchParams();
  
  // 从URL查询参数中解析博客数据
  const title = searchParams.get("title") || "博客标题";
  const summary = searchParams.get("summary") || "博客摘要";
  const image = searchParams.get("image") || "/images/default-blog.png";
  const author = searchParams.get("author") || "Cattail";
  const publishedAt = searchParams.get("publishedAt") || new Date().toISOString().split('T')[0];
  const tag = searchParams.get("tag") || "General";
  const content = searchParams.get("content") || "博客内容";

  const metadata = {
    title,
    summary,
    image,
    author,
    publishedAt,
    tag
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/blogs"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> 返回博客列表
        </Link>
        <h1 className="text-2xl font-bold mt-4">博客预览</h1>
      </div>

      <BlogPreview metadata={metadata} content={content} />
    </div>
  );
} 