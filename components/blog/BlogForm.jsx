/**
 * 博客表单组件
 * 用于创建和编辑博客文章
 * 
 * 功能：
 * - 支持创建新博客和编辑现有博客
 * - 表单字段验证
 * - 图片上传
 * - 实时预览
 * - 提交处理
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrUpdateBlog } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ImageUpload from "@/components/common/ImageUpload";
import { Eye } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export default function BlogForm({ blogData }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    summary: "",
    image: "/images/loading.jpg",
    author: "Cattail",
    publishedAt: new Date().toISOString().split('T')[0],
    tag: "General",
    readTime: "3 min read",
    content: ""
  });

  useEffect(() => {
    if (blogData) {
      const publishedAt = blogData.publishedAt 
        ? new Date(blogData.publishedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      setFormData({
        slug: blogData.slug || "",
        title: blogData.title || "",
        summary: blogData.summary || "",
        image: blogData.images?.[0]?.url || "/images/loading.jpg",
        author: blogData.author || "Cattail",
        publishedAt: publishedAt,
        tag: blogData.tag || "General",
        readTime: blogData.readTime || "3 min read",
        content: blogData.content || ""
      });
    }
  }, [blogData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      const result = await createOrUpdateBlog(formDataToSend);

      if (result.success) {
        toast.success('博客保存成功');
        router.push('/admin/blogs');
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (error) {
      toast.error('保存失败: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    const queryParams = new URLSearchParams();
    Object.keys(formData).forEach(key => {
      queryParams.append(key, formData[key]);
    });
    
    window.open(`/admin/blogs/preview?${queryParams.toString()}`, '_blank');
  };

  if (!isSignedIn) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">请先登录后再编辑博客</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">标题</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="博客标题"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug（URL友好名称）</Label>
        <Input
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="my-blog-post（留空将自动从标题生成）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">摘要</Label>
        <Textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          required
          placeholder="博客摘要"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>封面图片</Label>
        <ImageUpload 
          defaultImage={formData.image} 
          onImageChange={handleImageChange} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="author">作者</Label>
          <Input
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="作者名称"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="publishedAt">发布日期</Label>
          <Input
            id="publishedAt"
            name="publishedAt"
            type="date"
            value={formData.publishedAt}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tag">标签</Label>
          <Input
            id="tag"
            name="tag"
            value={formData.tag}
            onChange={handleChange}
            placeholder="Next.js"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="readTime">阅读时长</Label>
          <Input
            id="readTime"
            name="readTime"
            value={formData.readTime}
            onChange={handleChange}
            placeholder="3 min read"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">博客内容 (Markdown)</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          placeholder="使用Markdown格式编写博客内容..."
          rows={15}
          className="font-mono"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/blogs")}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={isSubmitting || !formData.title}
          className="gap-1"
        >
          <Eye className="w-4 h-4" />
          <span>预览</span>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存博客"}
        </Button>
      </div>
    </form>
  );
} 