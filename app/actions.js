"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saveBlog, deleteBlog } from "@/lib/blog";
import { saveProject, deleteProject } from "@/lib/project";
import { redirect } from "next/navigation";

export async function createMessage(formData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // if (!formData.get("message")) {
  //   return { message: "Please enter something!" };
  // }

  await prisma.message.create({
    data: {
      message: formData.get("message"),
      userId: user.id,
      userName: user.username || user.firstName,
      userImg: user.imageUrl,
    },
  });

  revalidatePath("/message");
}

// 博客相关操作
export async function createOrUpdateBlog(formData) {
  const metadata = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    image: formData.get("image"),
    author: formData.get("author"),
    publishedAt: formData.get("publishedAt") || new Date().toISOString().split('T')[0],
    tag: formData.get("tag"),
    readTime: formData.get("readTime") || "3 min read"
  };
  
  const content = formData.get("content");
  const slug = formData.get("slug");
  
  await saveBlog({ slug, content, metadata });
  
  revalidatePath("/blog");
  revalidatePath("/");
  
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
  
  return { success: true };
}

export async function removeBlog(formData) {
  const slug = formData.get("slug");
  
  if (!slug) {
    return { success: false, error: "Slug is required" };
  }
  
  const result = await deleteBlog(slug);
  
  revalidatePath("/blog");
  revalidatePath("/");
  
  return { success: result };
}

// 项目相关操作
export async function createOrUpdateProject(formData) {
  const projectData = {
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    link: formData.get("link"),
    imageUrl: formData.get("imageUrl"),
    tags: formData.get("tags")?.split(",").map(tag => tag.trim()) || []
  };
  
  await saveProject(projectData);
  
  revalidatePath("/project");
  revalidatePath("/");
  
  return { success: true };
}

export async function removeProject(formData) {
  const id = formData.get("id");
  
  if (!id) {
    return { success: false, error: "Project ID is required" };
  }
  
  const result = await deleteProject(id);
  
  revalidatePath("/project");
  revalidatePath("/");
  
  return { success: result };
}
