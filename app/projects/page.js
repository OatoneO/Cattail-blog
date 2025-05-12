import { getAllProjects } from "@/lib/db/project-service";
import Projects from "@/components/project/Projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">项目展示</h1>
      <Projects projects={projects} />
    </div>
  );
} 