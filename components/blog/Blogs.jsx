/**
 * 博客列表展示组件
 * 用于展示博客文章列表
 * 
 * 功能：
 * - 展示博客文章卡片
 * - 支持图片加载错误处理
 * - 响应式布局
 * - 日期格式化
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN");
}

export default function Blogs({ blogs }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (slug) => {
    setImageErrors(prev => ({
      ...prev,
      [slug]: true
    }));
  };

  return (
    <ul>
      {blogs.map((blog) => (
        <li key={blog.slug} className="mb-10">
          <Link href={`/blog/${blog.slug}`}>
            <div className="flex flex-col sm:flex-row w-full lg:w-4/5 items-stretch gap-6 rounded-2xl sm:shadow-[0_0px_1.2px_rgb(140,140,140)] shadow-[0_0px_2px_rgb(140,140,140)] hover:shadow-[0_0px_2px_rgb(140,140,140)] p-3 opacity-90 hover:opacity-100 hover:bg-muted">
              <div className="relative aspect-[48/27] w-full sm:w-80 rounded-2xl shrink-0">
                <Image
                  src={imageErrors[blog.slug] ? "/images/image_loading.jpeg" : blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(blog.slug)}
                />
              </div>

              <div className="flex flex-col justify-between flex-grow p-4">
                <div>
                  <h2 className="mb-2 font-bold">{blog.title}</h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(blog.publishedAt)} · {blog.readTime}
                  </p>
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {blog.tag}
                  </span>
                </div>
                <p className="text-sm">{blog.summary}</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
