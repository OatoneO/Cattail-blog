"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saveProject, deleteProject } from "@/lib/project";
import { redirect } from "next/navigation";
import { createBlog, updateBlog, deleteBlog, getBlogBySlug } from "@/lib/db/blog-service";

/**
 * 创建新留言
 * 
 * 功能：
 * - 验证用户登录状态
 * - 创建新的留言记录
 * - 自动关联用户信息
 * - 提交后刷新留言板页面
 * 
 * @param {FormData} formData - 包含留言内容的表单数据
 * @throws {Error} 当用户未登录时抛出未授权错误
 */
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

/**
 * 删除留言
 * 
 * 功能：
 * - 验证用户权限（管理员或留言发布者）
 * - 删除指定留言
 * - 提交后刷新留言板页面
 * 
 * @param {FormData} formData - 包含留言ID的表单数据
 * @throws {Error} 当用户未登录或无权删除时抛出未授权错误
 */
export async function removeMessage(formData) {
  const user = await currentUser();
  const messageId = formData.get("messageId");

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 获取留言信息
  const message = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!message) {
    throw new Error("Message not found");
  }

  // 验证权限：管理员或留言发布者
  const isAdmin = user.id === "user_2vxec51JBR7zN12XcPs7FGKksT8";
  const isAuthor = message.userId === user.id;

  if (!isAdmin && !isAuthor) {
    throw new Error("Unauthorized: Only admin or message author can delete messages");
  }

  try {
    await prisma.message.delete({
      where: {
        id: messageId
      }
    });

    revalidatePath("/message");
    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: error.message };
  }
}

// 博客相关操作
export async function createOrUpdateBlog(formData) {
  try {
    const blogData = {
      title: formData.get('title'),
      summary: formData.get('summary'),
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
    const imageUrl = formData.get('image');
    if (imageUrl && imageUrl !== '/images/loading.jpg') {
      images.push({
        url: imageUrl,
        alt: blogData.title || '博客封面图片'
      });
    }

    const slug = formData.get('slug');
    
    let blog;
    if (slug) {
      // 检查博客是否存在
      const existingBlog = await getBlogBySlug(slug);
      if (existingBlog) {
        blog = await updateBlog(slug, {
          ...blogData,
          images
        });
      } else {
        blog = await createBlog({
          ...blogData,
          slug,
          images
        });
      }
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
