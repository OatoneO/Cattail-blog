"use client";

import { Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN");
}

export default function RecentUpdate({ blogs }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (slug) => {
    setImageErrors(prev => ({
      ...prev,
      [slug]: true
    }));
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-start w-full gap-3 mb-10">
        <Newspaper />
        <span className="text-lg font-semibold">Recent Update</span>
      </div>
      <ul className="grid w-full grid-cols-1 gap-10">
        {blogs.map((blog) => (
          <li key={blog.slug}>
            <Link href={`/blog/${blog.slug}`}>
              <div className="relative rounded-2xl hover:shadow-[0_0px_2px_rgb(140,140,140)] shadow-[0_0px_1.2px_rgb(140,140,140)] opacity-70 hover:opacity-90">
                <div className="relative aspect-[240/135] w-full">
                  <Image
                    src={imageErrors[blog.slug] ? "/images/image_loading.jpeg" : blog.image}
                    alt={blog.title}
                    fill
                    className="object-contain rounded-2xl"
                    onError={() => handleImageError(blog.slug)}
                  />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 rounded-lg backdrop-blur-3xl">
                  <h2 className="mb-2 font-bold">{blog.title}</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {formatDate(blog.publishedAt)} | {blog.tag} · {blog.readTime}
                  </p>
                  <p className="text-sm text-transparent bg-gradient-to-l from-muted-foreground via-foreground to-muted-foreground bg-clip-text">
                    {blog.summary}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
