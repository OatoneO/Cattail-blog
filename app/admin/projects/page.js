/**
 * 管理后台项目列表页面
 * 用于管理所有项目
 * 
 * 功能：
 * - 展示所有项目
 * - 支持创建新项目
 * - 支持编辑和删除操作
 * - 空状态处理
 */

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectList from "@/components/admin/ProjectList";
import { getAllProjects } from "@/lib/db/project-service";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">项目管理</h1>
        <Link href="/admin/projects/new">
          <Button className="gap-1">
            <PlusCircle className="w-4 h-4" />
            <span>新建项目</span>
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
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
            <ProjectList key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
} 