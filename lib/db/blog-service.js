/**
 * 博客服务模块
 * 提供博客相关的所有数据库操作服务
 * 
 * 主要功能：
 * - createBlog: 创建新博客
 * - getAllBlogs: 获取所有博客列表
 * - getBlogBySlug: 根据slug获取单个博客
 * - updateBlog: 更新博客内容
 * - deleteBlog: 删除博客
 * - addImageToBlog: 为博客添加图片
 */

import prisma from '@/lib/prisma';

// 创建新博客
export async function createBlog(data) {
  try {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const blog = await prisma.blog.create({
      data: {
        ...data,
        slug,
        images: data.images ? {
          create: data.images
        } : undefined
      },
      include: {
        images: true
      }
    });

    // 异步处理知识图谱数据
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/process-blog`;
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slug: blog.slug })
      })
      .then(response => response.json())
      .then(result => {
        console.log('博客知识图谱处理结果:', result);
      })
      .catch(error => {
        console.error('处理博客知识图谱时出错:', error);
      });
    } catch (error) {
      console.error('初始化知识图谱处理请求失败:', error);
      // 不阻止博客创建，仅记录错误
    }

    return blog;
  } catch (error) {
    throw error;
  }
}

// 获取所有博客
export async function getAllBlogs() {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        images: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });
    
    return blogs.map(blog => ({
      ...blog,
      publishedAt: blog.publishedAt.toISOString().split('T')[0]
    }));
  } catch (error) {
    throw error;
  }
}

// 根据 slug 获取博客
export async function getBlogBySlug(slug) {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        images: true
      }
    });
    
    if (blog) {
      return {
        ...blog,
        publishedAt: blog.publishedAt.toISOString().split('T')[0]
      };
    }
    
    return blog;
  } catch (error) {
    throw error;
  }
}

// 更新博客
export async function updateBlog(slug, data) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 获取现有博客信息
      const existingBlog = await tx.blog.findUnique({
        where: { slug },
        include: { images: true }
      });

      if (!existingBlog) {
        throw new Error(`Blog with slug ${slug} not found`);
      }

      // 确保publishedAt是有效的日期
      let publishedAt = data.publishedAt;
      try {
        const date = new Date(publishedAt);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        publishedAt = date;
      } catch (error) {
        publishedAt = new Date();
      }

      // 从data中移除image和images字段
      const { image, images, ...blogData } = data;

      // 更新博客信息
      const updatedBlog = await tx.blog.update({
        where: { slug },
        data: {
          ...blogData,
          publishedAt,
          images: {
            deleteMany: {},
            create: images || []
          }
        },
        include: {
          images: true
        }
      });

      // 异步处理知识图谱数据
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/process-blog`;
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ slug: updatedBlog.slug })
        })
        .then(response => response.json())
        .then(result => {
          console.log('博客知识图谱更新结果:', result);
        })
        .catch(error => {
          console.error('更新博客知识图谱时出错:', error);
        });
      } catch (error) {
        console.error('初始化知识图谱更新请求失败:', error);
        // 不阻止博客更新，仅记录错误
      }

      return updatedBlog;
    });
  } catch (error) {
    throw error;
  }
}

// 删除博客
export async function deleteBlog(slug) {
  try {
    await prisma.blog.delete({
      where: { slug }
    });
    return true;
  } catch (error) {
    throw error;
  }
}

// 添加图片到博客
export async function addImageToBlog(blogId, { url, alt }) {
  try {
    const image = await prisma.image.create({
      data: {
        url,
        alt,
        blogId
      }
    });
    
    return image;
  } catch (error) {
    throw error;
  }
}

// 删除博客中的图片
export async function deleteImage(imageId) {
  try {
    await prisma.image.delete({
      where: { id: imageId }
    });
    
    return true;
  } catch (error) {
    throw error;
  }
} 