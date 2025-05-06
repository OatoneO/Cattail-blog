import { getProjectById } from "@/lib/db/project-service";
import ProjectForm from "@/components/ProjectForm";
import { notFound } from "next/navigation";

export default async function EditProjectPage({ params }) {
  const projectData = await getProjectById(params.id);

  if (!projectData) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑项目</h1>
      <ProjectForm projectData={projectData} />
    </div>
  );
} 