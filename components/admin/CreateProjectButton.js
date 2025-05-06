'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CreateProjectButton() {
  return (
    <Link
      href="/admin/projects/create"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      <Plus className="w-4 h-4" />
      新建项目
    </Link>
  );
} 