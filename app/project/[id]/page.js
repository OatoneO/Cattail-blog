import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mockProjects } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import MotionDivWrapper from "@/components/MotionDivWrapper";

export default function ProjectDetailPage({ params }) {
  const project = mockProjects.find(p => p._id === params.id);

  if (!project) {
    notFound();
  }

  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/project">
              <Button variant="ghost" className="mb-4">
                ← 返回项目列表
              </Button>
            </Link>
            <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.technologies?.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
            <Image
              src={project.imageUrl || "/images/default-project.png"}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="prose dark:prose-invert max-w-none mb-8">
            <p className="text-lg">{project.description}</p>
          </div>

          {project.link && (
            <Button className="gap-2" onClick={() => window.open(project.link, "_blank")}>
              <ExternalLink className="w-4 h-4" />
              访问项目
            </Button>
          )}
        </div>
      </div>
    </MotionDivWrapper>
  );
} 