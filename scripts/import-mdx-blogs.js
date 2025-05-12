import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { processBlogContent } from '../lib/blog-knowledge-processor.js';
// 使用直接导入neo4j驱动而不是service
import neo4j from 'neo4j-driver';

// 初始化Prisma客户端
const prisma = new PrismaClient();

// 初始化Neo4j驱动
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'Boge1010!'
  )
);

// 获取文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const blogsDir = path.join(rootDir, 'content', 'blog');

// 配置选项
const CONFIG = {
  // 是否更新已存在的博客
  updateExisting: true,
  // 是否处理知识图谱
  processKnowledgeGraph: true,
  // 导入特定文件，为空则导入所有文件
  // targetFiles: ['html5-semantic-elements.mdx'], 
  targetFiles: [], // 留空导入所有文件
};

/**
 * 生成Slug
 * 为简洁起见，对中文使用时间戳方式，对英文进行常规处理
 */
function generateSlug(text, fileName) {
  // 优先使用文件名作为slug基础（如果文件名没有特殊字符）
  const fileNameBase = fileName.replace(/\.mdx$/, '');
  if (/^[a-z0-9-]+$/.test(fileNameBase)) {
    return fileNameBase;
  }
  
  if (!text) return '';
  
  // 检测是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  
  if (hasChinese) {
    // 为中文标题生成基于时间戳的slug
    const timestamp = new Date().getTime().toString(36);
    return `post-${timestamp}`;
  }
  
  // 对于英文标题
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 存储博客知识图谱数据到Neo4j
 */
async function storeGraphData(graphData, tag) {
  try {
    console.log('开始存储知识图谱数据到Neo4j...');
    
    const { nodes, relationships } = graphData;
    
    // 直接使用博客标签作为节点标签
    const nodeLabel = tag;
    
    const session = neo4jDriver.session();
    
    try {
      console.log(`存储 ${nodes.length} 个节点...`);
      
      // 存储节点
      for (const node of nodes) {
        const properties = node.properties || {};
        try {
          await session.run(
            `MERGE (n:${nodeLabel} {id: $id})
             ON CREATE SET 
               n.type = $type,
               n.title = $title,
               n.url = $url,
               n.summary = $summary,
               n.category = $category
             ON MATCH SET
               n.url = $url,
               n.summary = $summary,
               n.category = $category`,
            {
              id: node.id,
              type: node.type,
              title: properties.title || '',
              url: properties.url || '',
              summary: properties.summary || '',
              category: properties.category || ''
            }
          );
        } catch (error) {
          console.error(`存储节点 ${node.id} 失败:`, error);
        }
      }
      
      console.log(`存储 ${relationships.length} 个关系...`);
      
      // 存储关系
      for (const rel of relationships) {
        try {
          await session.run(
            `MATCH (a {id: $sourceId}), (b {id: $targetId})
             MERGE (a)-[r:${rel.type}]->(b)
             ${rel.properties ? 'ON CREATE SET r += $properties' : ''}`,
            {
              sourceId: rel.source,
              targetId: rel.target,
              properties: rel.properties || {}
            }
          );
        } catch (error) {
          console.error(`存储关系 ${rel.source} -> ${rel.target} 失败:`, error);
        }
      }
      
      console.log('知识图谱数据存储完成');
      return true;
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('存储知识图谱数据失败:', error);
    return false;
  }
}

/**
 * 导入单个博客
 */
async function importBlog(filePath) {
  try {
    const fileName = path.basename(filePath);
    console.log(`\n开始处理: ${fileName}`);
    
    // 读取博客文件内容
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 解析frontmatter
    const { data, content } = matter(fileContent);
    
    // 生成slug
    const slug = generateSlug(data.title, fileName);
    console.log(`生成的slug: ${slug}`);
    
    // 检查博客是否已存在
    const existingBlog = await prisma.blog.findUnique({
      where: { slug }
    });
    
    if (existingBlog && !CONFIG.updateExisting) {
      console.log(`博客 "${data.title}" 已存在，跳过导入`);
      return { 
        slug, 
        status: 'skipped', 
        message: '博客已存在，已跳过' 
      };
    }
    
    // 创建博客对象
    const blogData = {
      title: data.title,
      content: content,
      summary: data.summary || data.excerpt || `${data.title}的摘要`,
      author: data.author || 'Cattail',
      tag: data.tag || 'General',
      readTime: data.readTime || `${Math.ceil(content.length / 2000)} min read`
    };
    
    // 处理日期
    try {
      // 尝试解析publishedAt
      if (data.publishedAt) {
        // 检测是否需要转换日期格式 (如 "2024-03-15")
        if (typeof data.publishedAt === 'string' && data.publishedAt.split('-').length === 3) {
          // 转换为ISO 8601格式
          blogData.publishedAt = new Date(data.publishedAt).toISOString();
          console.log(`转换日期: ${data.publishedAt} -> ${blogData.publishedAt}`);
        } else {
          blogData.publishedAt = new Date(data.publishedAt).toISOString();
        }
      } else {
        blogData.publishedAt = new Date().toISOString();
      }
    } catch (error) {
      console.warn(`日期格式错误，使用当前日期: ${error.message}`);
      blogData.publishedAt = new Date().toISOString();
    }
    
    // 处理图片
    const images = [];
    if (data.image && data.image !== '/images/loading.jpg') {
      images.push({
        url: data.image,
        alt: data.title || '博客封面图片'
      });
    }
    
    let blog;
    
    if (existingBlog) {
      // 更新已存在的博客
      console.log(`更新博客: ${data.title}`);
      blog = await prisma.blog.update({
        where: { slug },
        data: {
          ...blogData,
          images: {
            deleteMany: {},
            create: images
          }
        },
        include: {
          images: true
        }
      });
    } else {
      // 创建新博客
      console.log(`创建博客: ${data.title}`);
      blog = await prisma.blog.create({
        data: {
          ...blogData,
          slug,
          images: {
            create: images
          }
        },
        include: {
          images: true
        }
      });
    }
    
    console.log(`博客${existingBlog ? '更新' : '创建'}成功: ${blog.title}`);
    
    // 处理知识图谱
    if (CONFIG.processKnowledgeGraph) {
      console.log(`开始处理博客知识图谱...`);
      
      try {
        // 处理博客内容，提取知识图谱数据
        const graphData = await processBlogContent(blog);
        console.log(`提取了 ${graphData.nodes.length} 个节点和 ${graphData.relationships.length} 个关系`);
        
        // 存储到Neo4j
        const success = await storeGraphData(graphData, blog.tag);
        
        if (success) {
          console.log('知识图谱处理成功');
        } else {
          console.warn('知识图谱处理部分失败');
        }
      } catch (error) {
        console.error('处理知识图谱时出错:', error);
        return { 
          slug, 
          status: 'partial', 
          message: '博客保存成功，但知识图谱处理失败' 
        };
      }
    }
    
    return { 
      slug, 
      status: 'success', 
      message: `博客${existingBlog ? '更新' : '创建'}成功` 
    };
  } catch (error) {
    console.error(`处理文件失败: ${filePath}`, error);
    return { 
      filePath, 
      status: 'error', 
      message: error.message 
    };
  }
}

/**
 * 批量导入博客
 */
async function importBlogs() {
  try {
    // 获取所有MDX文件
    let files = fs.readdirSync(blogsDir)
      .filter(file => file.endsWith('.mdx'));
    
    // 如果指定了目标文件，则只处理指定文件
    if (CONFIG.targetFiles && CONFIG.targetFiles.length > 0) {
      files = files.filter(file => CONFIG.targetFiles.includes(file));
    }
    
    console.log(`找到 ${files.length} 个MDX文件需要导入`);
    
    const results = [];
    
    // 逐个处理文件
    for (const file of files) {
      const filePath = path.join(blogsDir, file);
      const result = await importBlog(filePath);
      results.push({ file, ...result });
    }
    
    // 输出总结
    console.log('\n导入结果总结:');
    const successful = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const partial = results.filter(r => r.status === 'partial').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`成功: ${successful}, 跳过: ${skipped}, 部分成功: ${partial}, 失败: ${failed}`);
    
    // 详细输出每个文件的结果
    console.log('\n详细结果:');
    results.forEach(result => {
      console.log(`- ${result.file}: ${result.status} (${result.message})`);
    });
    
    return results;
  } catch (error) {
    console.error('批量导入过程中出错:', error);
    throw error;
  } finally {
    // 关闭Prisma连接
    await prisma.$disconnect();
    // 关闭Neo4j连接
    await neo4jDriver.close();
  }
}

// 执行导入
importBlogs()
  .then(() => {
    console.log('导入完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('导入失败:', error);
    process.exit(1);
  }); 