'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { toast } from "sonner";

export default function ProjectList({ project }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDeleteProject = async () => {
    if (confirm(`确定要删除项目 "${project.title}" 吗？`)) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('删除失败');
        }

        toast.success("项目已删除");
        router.refresh();
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("删除失败，请重试");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 p-4 border border-border rounded-lg hover:bg-muted/30">
      <div className="relative aspect-[16/9] sm:w-48 rounded-md overflow-hidden">
        <Image
          src={imageError ? "/images/image_loading.jpeg" : project.imageUrl || "/images/loading.jpg"}
          alt={project.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
          <div className="flex flex-wrap gap-1 mb-2">
            {project.technologies?.map((tech, index) => (
              <Tag key={index}>{tech}</Tag>
            ))}
          </div>
          <p className="text-sm line-clamp-2">{project.description || "无描述"}</p>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            <Eye className="w-4 h-4" />
            <span>查看</span>
          </Button>
          
          {project.link && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => window.open(project.link, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              <span>访问</span>
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => router.push(`/admin/projects/edit/${project.id}`)}
          >
            <Edit className="w-4 h-4" />
            <span>编辑</span>
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={handleDeleteProject}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "删除中..." : "删除"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 