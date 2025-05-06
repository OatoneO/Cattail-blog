import prisma from '@/lib/prisma';

// 创建新博客
export async function createBlog({ title, content, summary, author, tag, readTime, images = [] }) {
  try {
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        summary,
        author,
        tag,
        readTime,
        images: {
          create: images.map(image => ({
            url: image.url,
            alt: image.alt
          }))
        }
      },
      include: {
        images: true
      }
    });
    
    return blog;
  } catch (error) {
    console.error('Error creating blog:', error);
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
    console.error('Error getting all blogs:', error);
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
    console.error(`Error getting blog with slug ${slug}:`, error);
    throw error;
  }
}

// 更新博客
export async function updateBlog(slug, { title, content, summary, author, tag, readTime, images = [] }) {
  try {
    // 首先删除现有的图片
    await prisma.image.deleteMany({
      where: {
        blog: {
          slug
        }
      }
    });
    
    const blog = await prisma.blog.update({
      where: { slug },
      data: {
        title,
        content,
        summary,
        author,
        tag,
        readTime,
        images: {
          create: images.map(image => ({
            url: image.url,
            alt: image.alt
          }))
        }
      },
      include: {
        images: true
      }
    });
    
    return blog;
  } catch (error) {
    console.error(`Error updating blog ${slug}:`, error);
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
    console.error(`Error deleting blog ${slug}:`, error);
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
    console.error('Error adding image to blog:', error);
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
    console.error(`Error deleting image ${imageId}:`, error);
    throw error;
  }
} 