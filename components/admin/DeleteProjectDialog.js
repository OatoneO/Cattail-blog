'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteProjectDialog({ isOpen, onClose, project }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error('删除项目时出错:', error);
      alert('删除项目失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">确认删除</h3>
        <p className="text-gray-300 mb-6">
          您确定要删除项目 "{project.title}" 吗？此操作无法撤销。
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={isDeleting}
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  );
} 