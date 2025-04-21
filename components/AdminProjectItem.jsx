"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, ExternalLink, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { removeProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminProjectItem({ project }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 获取项目ID，优先使用_id字段（模拟数据），其次使用id字段（真实数据）
  const projectId = project._id || project.id;

  const handleDeleteProject = async () => {
    if (confirm(`确定要删除项目 "${project.title}" 吗？`)) {
      setIsDeleting(true);
      
      try {
        const formData = new FormData();
        formData.append("id", projectId);
        
        const result = await removeProject(formData);
        
        if (result.success) {
          toast.success("项目已删除");
        } else {
          toast.error("删除失败，请重试");
        }
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
          src={imageError ? "/images/image_loading.jpeg" : project.imageUrl || "/images/default-project.png"}
          alt={project.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {/* 使用technologies字段（模拟数据）或tags字段（真实数据） */}
            {(project.technologies || project.tags)?.map((tag, i) => (
              <span key={i} className="inline-block bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded ml-1">
                {tag}
              </span>
            ))}
          </p>
          <p className="text-sm line-clamp-2">{project.description || "无描述"}</p>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => router.push(`/project/${projectId}`)}
          >
            <Eye className="w-4 h-4" />
            <span>预览</span>
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
            onClick={() => router.push(`/admin/projects/edit/${projectId}`)}
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