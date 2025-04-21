import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/project">
            <Button variant="ghost" className="mb-4">
              ← 返回项目列表
            </Button>
          </Link>
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-5 w-1/3 mb-4" />
          <div className="flex flex-wrap gap-2 mb-6">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>

        <Skeleton className="w-full aspect-video mb-8 rounded-lg" />

        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
} 