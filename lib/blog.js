import path from "path";
import fs from "fs";
import matter from "gray-matter";

const rootDirectory = path.join(process.cwd(), "content", "blog");

// 获取指定slug的博客内容
export async function getBlogBySlug(slug) {
  try {
    const filePath = path.join(rootDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
    const { data, content } = matter(fileContent);

    return { metadata: { ...data, slug }, content };
  } catch (error) {
    console.error(`Error getting blog ${slug}:`, error);
    return null;
  }
}

// 获取所有博客
export async function getBlogs() {
  try {
    // 确保目录存在
    if (!fs.existsSync(rootDirectory)) {
      fs.mkdirSync(rootDirectory, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(rootDirectory);
    
    if (files.length === 0) return [];

    const posts = files
      .filter(file => file.endsWith('.mdx'))
      .map((file) => getBlogMetadata(file))
      .sort((a, b) =>
        new Date(a.publishedAt ?? "") < new Date(b.publishedAt ?? "") ? 1 : -1
      );

    return posts;
  } catch (error) {
    console.error("Error getting blogs:", error);
    return [];
  }
}

// 获取博客元数据
export function getBlogMetadata(filepath) {
  try {
    const slug = filepath.replace(/\.mdx$/, "");
    const filePath = path.join(rootDirectory, filepath);
    const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
    const { data } = matter(fileContent);
    return { ...data, slug };
  } catch (error) {
    console.error(`Error getting blog metadata ${filepath}:`, error);
    return null;
  }
}

// 创建或更新博客
export async function saveBlog({ slug, content, metadata }) {
  try {
    // 确保目录存在
    if (!fs.existsSync(rootDirectory)) {
      fs.mkdirSync(rootDirectory, { recursive: true });
    }
    
    // 如果没有提供slug，则使用标题生成
    const blogSlug = slug || metadata.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const filePath = path.join(rootDirectory, `${blogSlug}.mdx`);
    
    // 构建frontmatter
    const frontmatter = matter.stringify(content, {
      title: metadata.title,
      summary: metadata.summary,
      image: metadata.image || '/images/default-blog.png',
      author: metadata.author || 'Cattail',
      publishedAt: metadata.publishedAt || new Date().toISOString().split('T')[0],
      tag: metadata.tag || 'General',
      readTime: metadata.readTime || '3 min read'
    });
    
    // 写入文件
    fs.writeFileSync(filePath, frontmatter);
    
    return {
      slug: blogSlug,
      ...metadata
    };
  } catch (error) {
    console.error("Error saving blog:", error);
    throw error;
  }
}

// 删除博客
export async function deleteBlog(slug) {
  try {
    const filePath = path.join(rootDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting blog ${slug}:`, error);
    return false;
  }
}
