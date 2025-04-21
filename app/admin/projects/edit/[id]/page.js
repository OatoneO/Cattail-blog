import { mockProjects } from "@/lib/mockData";
import ProjectForm from "@/components/ProjectForm";
import { notFound } from "next/navigation";

export default function EditProjectPage({ params }) {
  const projectData = mockProjects.find(p => p._id === params.id);

  if (!projectData) {
    notFound();
  }

  // 确保表单组件可以正确处理模拟数据
  const adaptedProjectData = {
    id: projectData._id,
    title: projectData.title,
    description: projectData.description,
    link: projectData.link,
    imageUrl: projectData.imageUrl,
    tags: projectData.technologies
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑项目</h1>
      <ProjectForm projectData={adaptedProjectData} />
    </div>
  );
} 