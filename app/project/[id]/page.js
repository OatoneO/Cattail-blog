import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/db/project-service";
import MotionDivWrapper from "@/components/common/MotionDivWrapper";
import ProjectDetail from "@/components/project/ProjectDetail";

export default async function ProjectDetailPage({ params }) {
  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ProjectDetail project={project} />
    </MotionDivWrapper>
  );
} 