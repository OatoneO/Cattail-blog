import MotionDivWrapper from "@/components/MotionDivWrapper";
import Blogs from "@/components/Blogs";
import { getAllBlogs } from "@/lib/db/blog-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BlogPage() {
  const blogs = await getAllBlogs();
  
  // 转换数据格式以匹配现有的组件期望
  const formattedBlogs = blogs.map(blog => ({
    ...blog,
    metadata: {
      title: blog.title,
      summary: blog.summary,
      publishedAt: blog.publishedAt,
      author: blog.author,
      tag: blog.tag,
      readTime: blog.readTime,
      image: blog.images[0]?.url || '/images/loading.jpg'
    }
  }));
  
  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">博客文章</h1>
        <Blogs blogs={formattedBlogs} />
      </div>
    </MotionDivWrapper>
  );
}
