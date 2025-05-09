"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";

export default function ProjectForm({ projectData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    link: "",
    imageUrl: "",
    technologies: []
  });

  useEffect(() => {
    if (projectData) {
      setFormData({
        id: projectData.id || "",
        title: projectData.title || "",
        description: projectData.description || "",
        link: projectData.link || "",
        imageUrl: projectData.imageUrl || "",
        technologies: Array.isArray(projectData.technologies) ? projectData.technologies : []
      });
    }
  }, [projectData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "标题不能为空";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "描述不能为空";
    }
    
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = "图片链接不能为空";
    } else if (!isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = "请输入有效的图片链接";
    }
    
    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = "请输入有效的项目链接";
    }
    
    if (formData.technologies.length === 0) {
      newErrors.technologies = "请至少添加一个技术标签";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleTechnologiesChange = (technologies) => {
    setFormData(prev => ({
      ...prev,
      technologies
    }));
    if (errors.technologies) {
      setErrors(prev => ({
        ...prev,
        technologies: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("请检查表单填写是否正确");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        link: formData.link.trim(),
        imageUrl: formData.imageUrl.trim(),
        technologies: formData.technologies
      };

      const url = projectData?.id 
        ? `/api/projects/${projectData.id}`
        : '/api/projects';
      
      const method = projectData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('提交失败');
      }

      toast.success(projectData ? "项目已更新" : "项目已创建");
      
      setTimeout(() => {
        router.push("/admin/projects");
        router.refresh();
      }, 200);
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error("提交失败，请重试");
    } finally {
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
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
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
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
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
          className={errors.link ? "border-destructive" : ""}
        />
        {errors.link && (
          <p className="text-sm text-destructive">{errors.link}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="imageUrl">图片链接 *</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className={errors.imageUrl ? "border-destructive" : ""}
        />
        {errors.imageUrl && (
          <p className="text-sm text-destructive">{errors.imageUrl}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="technologies">技术栈 *</Label>
        <TagInput
          value={formData.technologies}
          onChange={handleTechnologiesChange}
          placeholder="输入技术标签后按回车"
          error={errors.technologies}
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