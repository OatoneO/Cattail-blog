import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const rootDirectory = path.join(process.cwd(), 'content', 'blog');

async function migrateBlogs() {
  try {
    // 确保目录存在
    if (!fs.existsSync(rootDirectory)) {
      console.log('Blog directory does not exist');
      return;
    }

    const files = fs.readdirSync(rootDirectory);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));

    console.log(`Found ${mdxFiles.length} blog posts to migrate`);

    for (const file of mdxFiles) {
      const filePath = path.join(rootDirectory, file);
      const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
      const { data, content } = matter(fileContent);
      const slug = file.replace(/\.mdx$/, '');

      // 提取图片 URL
      const imageUrls = [];
      const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        imageUrls.push({
          url: match[2],
          alt: match[1]
        });
      }

      // 创建博客记录
      await prisma.blog.create({
        data: {
          title: data.title,
          slug,
          content,
          summary: data.summary,
          author: data.author || 'Cattail',
          publishedAt: new Date(data.publishedAt || Date.now()),
          tag: data.tag || 'General',
          readTime: data.readTime || '3 min read',
          images: {
            create: imageUrls
          }
        }
      });

      console.log(`Migrated blog: ${slug}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBlogs(); 