'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2 } from 'lucide-react';
import DeleteBlogDialog from './DeleteBlogDialog';

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN");
}

export default function BlogList({ blogs }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const handleDeleteClick = (blog) => {
    setSelectedBlog(blog);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-2 text-left">标题</th>
            <th className="px-4 py-2 text-left">作者</th>
            <th className="px-4 py-2 text-left">发布日期</th>
            <th className="px-4 py-2 text-left">标签</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {blogs.map((blog) => (
            <tr key={blog.id} className="border-b border-gray-700 hover:bg-gray-800/50">
              <td className="px-4 py-2">{blog.title}</td>
              <td className="px-4 py-2">{blog.author}</td>
              <td className="px-4 py-2">
                {formatDate(blog.publishedAt)}
              </td>
              <td className="px-4 py-2">{blog.tag}</td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/blogs/edit/${blog.slug}`}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(blog)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DeleteBlogDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        blog={selectedBlog}
      />
    </div>
  );
} 