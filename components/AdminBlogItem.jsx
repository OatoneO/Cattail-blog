"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { removeBlog } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminBlogItem({ blog }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDeleteBlog = async () => {
    if (confirm(`确定要删除博客 "${blog.title}" 吗？`)) {
      setIsDeleting(true);
      
      try {
        const formData = new FormData();
        formData.append("slug", blog.slug);
        
        const result = await removeBlog(formData);
        
        if (result.success) {
          toast.success("博客已删除");
        } else {
          toast.error("删除失败，请重试");
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
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
          src={imageError ? "/images/image_loading.jpeg" : blog.image || "/images/loading.jpg"}
          alt={blog.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{blog.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {blog.publishedAt || "未发布"} | {blog.tag || "无标签"}
          </p>
          <p className="text-sm line-clamp-2">{blog.summary || "无摘要"}</p>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => router.push(`/blog/${blog.slug}`)}
          >
            <Eye className="w-4 h-4" />
            <span>查看</span>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => router.push(`/admin/blogs/edit/${blog.slug}`)}
          >
            <Edit className="w-4 h-4" />
            <span>编辑</span>
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={handleDeleteBlog}
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