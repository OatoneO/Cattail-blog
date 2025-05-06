import MotionDivWrapper from "@/components/common/MotionDivWrapper";
import Projects from "@/components/project/Projects";
import { getAllProjects } from "@/lib/db/project-service";

export const dynamic = "force-dynamic";

export default async function ProjectPage() {
  const projects = await getAllProjects();
  
  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">项目展示</h1>
        <Projects projects={projects} />
      </div>
    </MotionDivWrapper>
  );
}
