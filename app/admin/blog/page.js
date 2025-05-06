import { getAllBlogs } from "@/lib/db/blog-service";
import BlogList from "@/components/admin/BlogList";
import CreateBlogButton from "@/components/admin/CreateBlogButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBlogPage() {
  const blogs = await getAllBlogs();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">博客管理</h1>
        <CreateBlogButton />
      </div>
      <BlogList blogs={blogs} />
    </div>
  );
} 