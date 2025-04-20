import MotionDivWrapper from "@/components/MotionDivWrapper";
import Blogs from "@/components/Blogs";
import { getBlogs } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BlogPage() {
  const blogs = await getBlogs();
  
  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">博客文章</h1>
        <Blogs blogs={blogs} />
      </div>
    </MotionDivWrapper>
  );
}
