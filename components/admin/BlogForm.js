'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// 动态导入 MDX 编辑器，避免服务端渲染错误
const MDXEditor = dynamic(() => import('@mdxeditor/editor').then(mod => mod.MDXEditor), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">加载编辑器中...</div>
});

export default function BlogForm({ blog, isEdit = false }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    content: blog?.content || '',
    summary: blog?.summary || '',
    author: blog?.author || 'Cattail',
    tag: blog?.tag || 'General',
    readTime: blog?.readTime || '3 min read',
    images: blog?.images || []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      const url = isEdit ? `/api/blog/${blog.slug}` : '/api/blog';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(isEdit ? '更新失败' : '创建失败');
      }

      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      console.error('提交表单时出错:', error);
      alert('提交表单时出错');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          标题
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium mb-2">
          摘要
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          内容
        </label>
        <div className="min-h-[400px] border border-gray-600 rounded">
          <MDXEditor
            markdown={formData.content}
            onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
            className="h-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="author" className="block text-sm font-medium mb-2">
            作者
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="tag" className="block text-sm font-medium mb-2">
            标签
          </label>
          <input
            type="text"
            id="tag"
            name="tag"
            value={formData.tag}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="readTime" className="block text-sm font-medium mb-2">
          阅读时间
        </label>
        <input
          type="text"
          id="readTime"
          name="readTime"
          value={formData.readTime}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isEdit ? '保存中...' : '创建中...'}</span>
            </>
          ) : (
            <span>{isEdit ? '保存' : '创建'}</span>
          )}
        </button>
      </div>
    </form>
  );
} 