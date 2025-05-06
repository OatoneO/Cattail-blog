'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteBlogDialog({ isOpen, onClose, blog }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !blog) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/blog/${blog.slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error('删除博客时出错:', error);
      alert('删除博客时出错');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">确认删除</h3>
        <p className="mb-6">
          确定要删除博客 &quot;{blog.title}&quot; 吗？此操作无法撤销。
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
          >
            {isDeleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  );
} 