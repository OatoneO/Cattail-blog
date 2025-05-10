import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// 获取当前文件目录
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
  targetFiles: [], 
  // API地址
  apiUrl: 'http://localhost:3000'
};

/**
 * 导入单个博客
 * @param {string} filePath - MDX文件路径
 * @returns {Promise<Object>} - 导入结果
 */
async function importBlog(filePath) {
  try {
    const fileName = path.basename(filePath);
    const slug = fileName.replace(/\.mdx$/, '');
    
    console.log(`\n开始处理: ${fileName}`);
    
    // 读取博客文件内容
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 使用gray-matter解析frontmatter
    const { data, content } = matter(fileContent);
    
    // 创建博客对象
    const blog = {
      title: data.title || '无标题',
      content: content || '',
      summary: data.summary || data.excerpt || `${data.title}的摘要`,
      author: data.author || 'Cattail',
      publishedAt: data.publishedAt || new Date().toISOString(),
      tag: data.tag || 'General',
      readTime: data.readTime || `${Math.ceil(content.length / 2000)} min read`
      // 不提供slug，让后端生成
    };
    
    // 输出完整请求信息进行诊断
    console.log('==== 完整请求数据 ====');
    console.log(JSON.stringify(blog, null, 2));
    console.log('======================');
    
    // 检查博客是否已存在
    const checkResponse = await fetch(`${CONFIG.apiUrl}/api/blog/${slug}`);
    const exists = checkResponse.ok;
    
    if (exists && !CONFIG.updateExisting) {
      console.log(`博客 "${blog.title}" 已存在，跳过导入`);
      return { slug, status: 'skipped', message: '博客已存在，已跳过' };
    }
    
    // 发送数据到博客API
    const method = exists ? 'PUT' : 'POST';
    const url = exists 
      ? `${CONFIG.apiUrl}/api/blog/${slug}` 
      : `${CONFIG.apiUrl}/api/blog`;
    
    console.log(`${exists ? '更新' : '创建'}博客: ${blog.title}`);
    console.log(`API URL: ${url}, 方法: ${method}`);
    
    try {
      // 使用简化版的POST请求测试
      console.log('正在发送请求...');
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blog),
      });

      // 获取响应文本
      const responseText = await response.text();
      
      console.log(`HTTP状态码: ${response.status}`);
      console.log(`HTTP状态: ${response.statusText}`);
      console.log(`响应内容: ${responseText}`);
      
      if (!response.ok) {
        console.error(`API响应错误: 状态码 ${response.status}`);
        throw new Error(`博客${exists ? '更新' : '创建'}失败! status: ${response.status}`);
      }

      // 尝试解析响应为JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.warn('无法解析响应为JSON:', e.message);
        result = { title: blog.title };
      }
      
      console.log(`博客${exists ? '更新' : '创建'}成功: ${result.title || blog.title}`);
      
      // 处理知识图谱
      if (CONFIG.processKnowledgeGraph) {
        console.log(`处理 "${result.title || blog.title}" 的知识图谱...`);
        
        const graphResponse = await fetch(`${CONFIG.apiUrl}/api/process-blog`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: result.slug || slug }),
        });

        if (!graphResponse.ok) {
          const text = await graphResponse.text();
          console.warn(`知识图谱处理警告: ${text}`);
          return { 
            slug: result.slug || slug, 
            status: 'partial', 
            message: '博客导入成功，但知识图谱处理失败' 
          };
        }

        const graphResult = await graphResponse.json();
        console.log(`知识图谱处理完成: ${graphResult.nodes || 0} 个节点, ${graphResult.relationships || 0} 个关系`);
      }
      
      return { 
        slug: result.slug || slug, 
        status: 'success', 
        message: `博客${exists ? '更新' : '创建'}成功` 
      };
    } catch (error) {
      console.error(`API请求错误: ${error.message}`);
      if (error.cause) {
        console.error(`错误原因: ${error.cause}`);
      }
      throw error;
    }
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
    // 确保博客目录存在
    if (!fs.existsSync(blogsDir)) {
      console.error(`错误: 博客目录不存在 (${blogsDir})`);
      return;
    }
    
    // 获取所有MDX文件
    let files = fs.readdirSync(blogsDir)
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.join(blogsDir, file));
    
    // 如果指定了目标文件，只处理这些文件
    if (CONFIG.targetFiles.length > 0) {
      const targetSet = new Set(CONFIG.targetFiles);
      files = files.filter(file => {
        const fileName = path.basename(file);
        return targetSet.has(fileName);
      });
    }
    
    console.log(`找到 ${files.length} 个MDX文件需要处理`);
    
    // 导入结果统计
    const stats = {
      success: 0,
      error: 0,
      skipped: 0,
      partial: 0
    };
    
    // 逐个处理文件
    for (const file of files) {
      const result = await importBlog(file);
      stats[result.status]++;
    }
    
    // 输出导入结果
    console.log('\n===== 导入完成 =====');
    console.log(`成功: ${stats.success}`);
    console.log(`部分成功: ${stats.partial}`);
    console.log(`跳过: ${stats.skipped}`);
    console.log(`失败: ${stats.error}`);
    console.log('=====================');
    
    if (stats.success + stats.partial > 0) {
      console.log(`\n您现在可以访问 ${CONFIG.apiUrl}/blog 查看导入的博客文章`);
    }
  } catch (error) {
    console.error('批量导入过程中发生错误:', error);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--no-update' || arg === '-n') {
      CONFIG.updateExisting = false;
    } else if (arg === '--no-graph' || arg === '-g') {
      CONFIG.processKnowledgeGraph = false;
    } else if (arg === '--api' || arg === '-a') {
      if (i + 1 < args.length) {
        CONFIG.apiUrl = args[++i];
      }
    } else if (arg === '--file' || arg === '-f') {
      if (i + 1 < args.length) {
        CONFIG.targetFiles.push(args[++i]);
      }
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
博客批量导入工具

用法: node scripts/import-blogs.js [选项]

选项:
  -n, --no-update       不更新已存在的博客
  -g, --no-graph        不处理知识图谱
  -a, --api <url>       指定API URL (默认: http://localhost:3000)
  -f, --file <filename> 指定要导入的文件名 (可多次使用)
  -h, --help            显示帮助信息
  
示例:
  导入所有博客:
    node scripts/import-blogs.js
    
  只导入特定文件:
    node scripts/import-blogs.js -f html5-semantic-elements.mdx
    
  导入时不更新已存在的博客:
    node scripts/import-blogs.js --no-update
  `);
}

// 执行脚本
parseArgs();
importBlogs(); 