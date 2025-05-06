import { notFound } from 'next/navigation';
import BlogForm from '@/components/admin/BlogForm';
import { getBlogBySlug } from '@/lib/db/blog-service';

export default async function EditBlogPage({ params }) {
  const { slug } = params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">编辑博客</h1>
      <BlogForm blog={blog} isEdit />
    </div>
  );
} 