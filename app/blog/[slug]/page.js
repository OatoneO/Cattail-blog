/**
 * 博客详情页面
 * 展示单篇博客文章的详细内容
 * 
 * 功能：
 * - 根据slug获取并展示博客内容
 * - 支持MDX格式的内容渲染
 * - 展示博客元数据（标题、作者、日期等）
 * - 支持返回列表页
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getBlogBySlug, getAllBlogs } from "@/lib/db/blog-service";

export default async function Blog({ params }) {
  const { slug } = params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const { title, content, summary, author, publishedAt, tag, images } = blog;
  const image = images[0]?.url || '/images/loading.jpg';

  return (
    <section className="flex pr-8 mx-auto">
      <aside className="relative hidden pt-14 2xl:block">
        <Link
          href="/blog"
          className="sticky flex items-center gap-1 py-2 pl-4 pr-5 rounded-full top-10  text-foreground font-semibold bg-[#f2f2f21a] "
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
      </aside>

      <article className="w-full max-w-3xl mx-auto mt-16">
        <header>
          {image && (
            <div className="relative w-full flex justify-center items-center mb-10 overflow-hidden rounded-lg aspect-[240/135]">
              <Image
                src={image}
                alt={title || ""}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          <p className="mb-2 text-sm text-muted-foreground">
            {publishedAt} | {tag}
          </p>

          <h1 className="mb-2 text-4xl font-bold">{title}</h1>

          <p className="mb-6 text-muted-foreground">{author}</p>

          <p className="">{summary}</p>
        </header>

        <main className="mt-16 prose max-w-none prose-invert prose-p:text-foreground prose-h1:text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-h4:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-strong:font-bold prose-a:text-blue-400 prose-a:opacity-80 prose-code:text-foreground prose-img:opacity-90 prose-p:tracking-tight prose-p:text-sm prose-li:text-sm">
          <MDXRemote source={content} />
        </main>
      </article>
    </section>
  );
}

export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}
