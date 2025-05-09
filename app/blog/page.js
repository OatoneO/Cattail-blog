/**
 * 博客列表页面
 * 展示所有博客文章的列表
 * 
 * 功能：
 * - 获取并展示所有博客文章
 * - 支持动画过渡效果
 * - 响应式布局设计
 */

import MotionDivWrapper from "@/components/common/MotionDivWrapper";
import Blogs from "@/components/blog/Blogs";
import { getAllBlogs } from "@/lib/db/blog-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BlogPage() {
  const blogs = await getAllBlogs();
  
  // 转换数据格式以匹配现有的组件期望
  const formattedBlogs = blogs.map(blog => ({
    ...blog,
    image: blog.images?.[0]?.url || '/images/loading.jpg'
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
