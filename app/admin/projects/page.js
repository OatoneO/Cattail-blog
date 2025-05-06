import { getAllProjects } from "@/lib/db/project-service";
import ProjectList from "@/components/admin/ProjectList";
import CreateProjectButton from "@/components/admin/CreateProjectButton";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">项目管理</h1>
        <CreateProjectButton />
      </div>
      <ProjectList projects={projects} />
    </div>
  );
} 