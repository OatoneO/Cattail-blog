import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProjectForm from "@/components/project/ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/projects"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> 返回项目列表
        </Link>
        <h1 className="text-2xl font-bold mt-4">创建新项目</h1>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <ProjectForm />
      </div>
    </div>
  );
} 