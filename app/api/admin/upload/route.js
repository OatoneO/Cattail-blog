import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

// 确保上传目录存在的辅助函数
async function ensureUploadDir() {
  const fs = await import("fs/promises");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  try {
    await fs.access(uploadDir);
    console.log("上传目录已存在:", uploadDir);
  } catch (error) {
    console.log("创建上传目录:", uploadDir);
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  return uploadDir;
}

export async function POST(request) {
  try {
    console.log("收到上传请求");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      console.log("未找到文件");
      return NextResponse.json(
        { error: "未选择文件" },
        { status: 400 }
      );
    }

    console.log("文件信息:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      console.log("文件类型错误:", file.type);
      return NextResponse.json(
        { error: "只支持上传图片文件" },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      console.log("文件大小超限:", file.size);
      return NextResponse.json(
        { error: "图片大小不能超过5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/\s+/g, "-").toLowerCase();
    const uniqueFilename = `${Date.now()}-${filename}`;
    
    // 确保上传目录存在
    const uploadDir = await ensureUploadDir();
    const filepath = path.join(uploadDir, uniqueFilename);
    
    console.log("准备写入文件:", filepath);
    // 写入文件
    await writeFile(filepath, buffer);
    console.log("文件写入成功");
    
    // 返回可以在前端访问的URL路径
    const fileUrl = `/uploads/${uniqueFilename}`;
    console.log("返回文件URL:", fileUrl);
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("上传文件时发生错误:", error);
    return NextResponse.json(
      { error: error.message || "上传文件失败，请重试" },
      { status: 500 }
    );
  }
} 