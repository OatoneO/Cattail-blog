import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@clerk/nextjs/server";

// 确保上传目录存在的辅助函数
async function ensureUploadDir() {
  const fs = await import("fs/promises");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  return uploadDir;
}

export async function POST(request) {
  try {
    // 身份验证检查
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/\s+/g, "-").toLowerCase();
    const uniqueFilename = `${Date.now()}-${filename}`;
    
    // 确保上传目录存在
    const uploadDir = await ensureUploadDir();
    const filepath = path.join(uploadDir, uniqueFilename);
    
    // 写入文件
    await writeFile(filepath, buffer);
    
    // 返回可以在前端访问的URL路径
    const fileUrl = `/uploads/${uniqueFilename}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 