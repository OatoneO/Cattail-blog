"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { mockProjects } from "@/lib/mockData";

export default function ProjectForm({ projectData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    link: "",
    imageUrl: "",
    tags: ""
  });

  useEffect(() => {
    if (projectData) {
      setFormData({
        id: projectData.id || "",
        title: projectData.title || "",
        description: projectData.description || "",
        link: projectData.link || "",
        imageUrl: projectData.imageUrl || "",
        tags: Array.isArray(projectData.tags) ? projectData.tags.join(", ") : projectData.tags || ""
      });
    }
  }, [projectData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 模拟提交延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 将标签字符串转换为数组
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      if (projectData && projectData.id) {
        // 更新现有项目
        const projectIndex = mockProjects.findIndex(p => (p._id === projectData.id || p.id === projectData.id));
        
        if (projectIndex !== -1) {
          // 在内存中"更新"模拟数据
          mockProjects[projectIndex] = {
            ...mockProjects[projectIndex],
            title: formData.title,
            description: formData.description,
            link: formData.link,
            imageUrl: formData.imageUrl,
            technologies: tagsArray // 使用technologies字段存储标签
          };
          
          console.log('模拟更新项目:', mockProjects[projectIndex]);
        }
      } else {
        // 创建新项目
        const newProject = {
          _id: Date.now().toString(), // 生成唯一ID
          title: formData.title,
          description: formData.description,
          link: formData.link,
          imageUrl: formData.imageUrl || "/images/image_loading.jpeg",
          technologies: tagsArray
        };
        
        // 添加到模拟数据数组
        mockProjects.unshift(newProject);
        console.log('模拟创建新项目:', newProject);
      }
      
      // 显示成功提示
      toast.success(projectData ? "项目已更新" : "项目已创建");
      
      // 等待提示显示后立即跳转
      setTimeout(() => {
        router.push("/admin/projects");
        router.refresh(); // 强制刷新页面
      }, 200);
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error("提交失败，请重试");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <input type="hidden" name="id" value={formData.id} />
      
      <div className="space-y-2">
        <Label htmlFor="title">标题 *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="项目标题"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">描述 *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="项目描述"
          rows={4}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="link">项目链接</Label>
        <Input
          id="link"
          name="link"
          type="url"
          value={formData.link}
          onChange={handleChange}
          placeholder="https://example.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="imageUrl">图片链接 *</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">标签（用逗号分隔）</Label>
        <Input
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="React, Next.js, TypeScript"
        />
      </div>
      
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "提交中..." : (projectData ? "更新项目" : "创建项目")}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/projects")}
        >
          取消
        </Button>
      </div>
    </form>
  );
} 