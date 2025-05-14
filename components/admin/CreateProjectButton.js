'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CreateProjectButton() {
  return (
    <Link href="/admin/projects/new">
      <Button className="gap-1">
        <PlusCircle className="w-4 h-4" />
        <span>新建项目</span>
      </Button>
    </Link>
  );
} 