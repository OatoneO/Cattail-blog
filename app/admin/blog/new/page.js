import BlogForm from '@/components/admin/BlogForm';

export default function NewBlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">新建博客</h1>
      <BlogForm />
    </div>
  );
} 