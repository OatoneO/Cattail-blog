import MotionDivWrapper from "@/components/MotionDivWrapper";
import Projects from "@/components/Projects";
import { mockProjects } from "@/lib/mockData";

export default function ProjectPage() {
  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">项目展示</h1>
        <Projects projects={mockProjects} />
      </div>
    </MotionDivWrapper>
  );
}
