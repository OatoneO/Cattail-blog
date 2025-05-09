"use client";

import { useState, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ImageUpload({ defaultImage, onImageChange }) {
  const [image, setImage] = useState(defaultImage || "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      toast.error("请上传图片文件");
      return;
    }

    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过5MB");
      toast.error("图片大小不能超过5MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("开始上传图片...");
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      console.log("收到响应:", response.status);
      const data = await response.json();
      console.log("响应数据:", data);

      if (!response.ok) {
        throw new Error(data.error || "上传失败");
      }

      if (!data.url) {
        throw new Error("服务器返回的URL为空");
      }

      setImage(data.url);
      onImageChange(data.url);
      toast.success("图片上传成功");
    } catch (error) {
      console.error("上传错误:", error);
      setError(error.message || "上传失败，请重试");
      toast.error(error.message || "上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setImage("");
    onImageChange("");
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {image ? (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-border">
          <Image
            src={image}
            alt="上传的图片"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={(e) => {
              console.error("图片加载失败:", image);
              setError("图片加载失败");
              toast.error("图片加载失败");
            }}
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border p-8">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">点击或拖拽上传图片</p>
            <p className="text-xs text-muted-foreground mt-1">
              支持 JPG, PNG, GIF 格式，最大 5MB
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={isUploading}
            onClick={handleButtonClick}
          >
            {isUploading ? "上传中..." : "选择图片"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
} 