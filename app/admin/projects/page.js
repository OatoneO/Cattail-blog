import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminProjectItem from "@/components/AdminProjectItem";
import { mockProjects } from "@/lib/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminProjectsPage() {
  const projects = mockProjects;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <Link href="/admin/projects/new">
          <Button className="gap-1">
            <PlusCircle className="w-4 h-4" />
            <span>新建项目</span>
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">暂无项目</p>
          <Link href="/admin/projects/new">
            <Button size="sm" variant="outline">
              创建第一个项目
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <AdminProjectItem key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
} 