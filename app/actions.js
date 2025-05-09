"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saveProject, deleteProject } from "@/lib/project";
import { redirect } from "next/navigation";
import { createBlog, updateBlog, deleteBlog } from "@/lib/db/blog-service";

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
  try {
    const blogData = {
      title: formData.get('title'),
      summary: formData.get('summary'),
      image: formData.get('image'),
      author: formData.get('author'),
      publishedAt: formData.get('publishedAt'),
      tag: formData.get('tag'),
      readTime: formData.get('readTime'),
      content: formData.get('content'),
    };

    // 确保publishedAt是有效的日期格式
    if (blogData.publishedAt) {
      try {
        const date = new Date(blogData.publishedAt);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        blogData.publishedAt = date.toISOString();
      } catch (error) {
        blogData.publishedAt = new Date().toISOString();
      }
    } else {
      blogData.publishedAt = new Date().toISOString();
    }

    // 确保图片数据正确格式化
    const images = [];
    if (blogData.image && blogData.image !== '/images/loading.jpg') {
      images.push({
        url: blogData.image,
        alt: blogData.title || '博客封面图片'
      });
    }

    const slug = formData.get('slug');
    
    let blog;
    if (slug) {
      blog = await updateBlog(slug, {
        ...blogData,
        images
      });
    } else {
      blog = await createBlog({
        ...blogData,
        images
      });
    }

    revalidatePath('/blog/[slug]', 'page');
    revalidatePath('/', 'page');
    revalidatePath('/admin/blogs', 'page');
    
    return { success: true, blog };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function removeBlog(formData) {
  const slug = formData.get("slug");
  
  if (!slug) {
    return { success: false, error: "Slug is required" };
  }
  
  try {
    await deleteBlog(slug);
    
    revalidatePath("/blog");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting blog:", error);
    return { success: false, error: error.message };
  }
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
