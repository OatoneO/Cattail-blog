'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CreateBlogButton() {
  return (
    <Link
      href="/admin/blog/new"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span>新建博客</span>
    </Link>
  );
} 