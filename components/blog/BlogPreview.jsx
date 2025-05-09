/**
 * 博客预览组件
 * 用于预览博客文章的最终效果
 * 
 * 功能：
 * - 展示博客文章的完整布局
 * - 支持MDX内容渲染
 * - 图片加载错误处理
 * - 响应式设计
 */

"use client";

import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { useState } from "react";

export default function BlogPreview({ metadata, content }) {
  const [imageError, setImageError] = useState(false);
  const { title, summary, image, author, publishedAt, tag } = metadata;

  return (
    <article className="max-w-3xl mx-auto mt-8 border border-border rounded-lg p-6">
      <header>
        {image && (
          <div className="relative w-full flex justify-center items-center mb-6 overflow-hidden rounded-lg aspect-[240/135]">
            <Image
              src={imageError ? "/images/image_loading.jpeg" : image}
              alt={title || ""}
              className="object-cover"
              fill
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <p className="mb-2 text-sm text-muted-foreground">
          {publishedAt ?? ""} | {tag}
        </p>

        <h1 className="mb-2 text-2xl font-bold">{title}</h1>

        <p className="mb-4 text-muted-foreground">{author}</p>

        <p className="mb-6">{summary}</p>
      </header>

      <div className="border-t border-border pt-6 mt-6">
        <h2 className="text-lg font-medium mb-4">内容预览</h2>
        <div className="prose max-w-none prose-invert prose-p:text-foreground prose-h1:text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-h4:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-strong:font-bold prose-a:text-blue-400 prose-a:opacity-80 prose-code:text-foreground prose-img:opacity-90 prose-p:tracking-tight prose-p:text-sm prose-li:text-sm">
          <MDXRemote source={content} />
        </div>
      </div>
    </article>
  );
} 