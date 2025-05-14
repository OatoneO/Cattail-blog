/**
 * 博客知识图谱处理器
 * 
 * 该模块负责从博客内容中提取和构建知识图谱数据，主要功能包括：
 * 1. 从博客标题和内容中提取关键实体
 * 2. 识别和过滤不相关的实体
 * 3. 建立博客与实体之间的关联关系
 * 4. 生成标准化的知识图谱节点和关系数据
 * 5. 支持实体权重和相关性计算
 * 
 * 核心处理流程：
 * 1. 文本预处理：清理和标准化文本内容
 * 2. 实体提取：从标题和内容中识别关键实体
 * 3. 实体过滤：移除无关实体和低质量实体
 * 4. 关系提取：建立实体间的关系
 * 5. 数据标准化：生成标准格式的知识图谱数据
 * 
 * 技术特点：
 * - 使用基于规则的方法进行实体识别，避免复杂的NLP依赖
 * - 支持中英文混合内容的处理
 * - 实现了基于频率和上下文的实体权重计算
 * - 提供了领域相关的关键词过滤机制
 */

// 使用简单字符串处理替代复杂NLP库
const stopWords = [
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 
  'through', 'over', 'before', 'between', 'after', 'since', 'without',
  'of', 'from', 'as', 'into', 'during', 'including', 'until', 'against',
  'among', 'throughout', 'despite', 'towards', 'upon', 'concerning',
  // 中文停用词
  '的', '地', '得', '了', '在', '是', '我', '有', '和', '就',
  '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说',
  '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
];

// 添加常见动词和非名词词汇，以便过滤
const nonNounWords = [
  'make', 'do', 'get', 'take', 'see', 'know', 'think', 'go', 'say', 'come',
  'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel',
  'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help',
  'would', 'could', 'should', 'will', 'can', 'may', 'might', 'must',
  // 中文动词
  '做', '去', '看', '说', '想', '用', '来', '给', '找', '吃',
  // 添加泛化词汇和示例词
  'example', 'info', 'accessibility', 'com', 'test', 'sample', 'demo',
  '示例', '信息', '测试', '演示', '例子'
];

// 添加日期时间相关词汇进行过滤
const dateTimeWords = [
  'date', 'time', 'year', 'month', 'day', 'hour', 'minute', 'second',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 
  'august', 'september', 'october', 'november', 'december',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  // 中文日期时间词
  '日期', '时间', '年', '月', '日', '小时', '分钟', '秒',
  '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月',
  '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'
];

// 关系类型映射
const relationTypes = {
  '是': 'IS_A',
  '包含': 'CONTAINS',
  '属于': 'BELONGS_TO',
  '使用': 'USES',
  '定义': 'DEFINES',
  '实现': 'IMPLEMENTS',
  '扩展': 'EXTENDS',
  '继承': 'INHERITS_FROM',
  '依赖': 'DEPENDS_ON',
  
  // 英文关系词
  'is': 'IS_A',
  'are': 'IS_A',
  'contains': 'CONTAINS',
  'has': 'HAS',
  'uses': 'USES',
  'defines': 'DEFINES',
  'implements': 'IMPLEMENTS',
  'extends': 'EXTENDS',
  'inherits': 'INHERITS_FROM',
  'depends': 'DEPENDS_ON'
};

// 领域相关词汇表（可根据实际扩展）
const domainKeywords = {
  html: ['元素', '标签', '语义化', '结构', '属性', '文档', '节点', '布局', '标准', '兼容性', 'head', 'body', 'div', 'span', 'section', 'header', 'footer', 'article', 'nav', 'main', 'aside', 'meta', 'title', 'lang', 'charset', 'doctype', 'html5'],
  css: ['样式', '选择器', '布局', '盒模型', 'flex', 'grid', '动画', '过渡', '媒体查询', 'class', 'id', 'color', 'font', 'margin', 'padding', 'border', 'display', 'position', 'float', 'css3'],
  javascript: ['变量', '函数', '对象', '数组', '事件', '回调', '异步', 'promise', '原型', '作用域', '闭包', 'this', 'class', 'let', 'const', 'es6', '模块', '导入', '导出', '箭头函数', 'async', 'await', 'json', 'dom', 'bom', 'window', 'document'],
  // 可继续扩展其他领域
};

// 外部技术词典（可扩展）
const techDictionary = [
  // HTML
  'html', 'head', 'body', 'div', 'span', 'section', 'header', 'footer', 'article', 'nav', 'main', 'aside', 'meta', 'title', 'lang', 'charset', 'doctype', 'html5',
  // CSS
  'css', 'flex', 'grid', 'animation', 'transition', 'media query', 'class', 'id', 'color', 'font', 'margin', 'padding', 'border', 'display', 'position', 'float', 'css3',
  // JavaScript
  'javascript', 'js', 'variable', 'function', 'object', 'array', 'event', 'callback', 'async', 'promise', 'prototype', 'scope', 'closure', 'this', 'class', 'let', 'const', 'es6', 'module', 'import', 'export', 'arrow function', 'async', 'await', 'json', 'dom', 'bom', 'window', 'document',
  // 其他
  'react', 'vue', 'angular', 'node', 'express', 'mongodb', 'mysql', 'postgresql', 'sql', 'nosql', 'rest', 'api', 'graphql', 'frontend', 'backend', 'fullstack', 'devops', 'database', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'serverless', 'microservice', 'framework', 'library', 'component', 'function', 'class', 'object', 'interface', 'type', 'algorithm', 'data structure', 'git', 'github', 'gitlab', 'bitbucket', 'agile', 'scrum',
  // 中文
  '前端', '后端', '全栈', '数据库', '云计算', '微服务', '框架', '库', '组件', '函数', '类', '对象', '接口', '算法', '数据结构', '版本控制',
];

/**
 * 处理博客内容，提取知识图谱数据
 * @param {Object} blog 博客对象，包含title, content, slug等属性
 * @returns {Object} 包含nodes和relationships的知识图谱数据
 * 
 * 处理流程：
 * 1. 预处理博客内容
 * 2. 从标题提取关键实体
 * 3. 从内容提取名词实体
 * 4. 合并和过滤实体
 * 5. 创建博客节点
 * 6. 建立实体节点
 * 7. 提取关系
 * 8. 返回标准化的知识图谱数据
 */
export async function processBlogContent(blog) {
  console.log(`处理博客: ${blog.title}`);
  
  // 预处理文本
  const preprocessedText = preprocessText(blog.content);
  
  // 从博客标题中提取关键词作为重要实体
  const titleEntities = extractKeyEntitiesFromTitle(blog.title);
  
  // 提取名词实体
  const contentEntities = extractNounEntities(preprocessedText, blog.tag);
  
  // 合并标题和内容的实体，并确保标题实体有更高的权重
  const entities = mergeEntities(titleEntities, contentEntities);
  
  // 创建博客节点
  const blogNodeId = `blog-${blog.slug}`;
  const blogNode = {
    id: blogNodeId,
    type: 'blog',
    properties: {
      title: blog.title,
      url: `/blog/${blog.slug}`,
      summary: blog.description || blog.excerpt || '博客文章',
      category: blog.tag || 'General'
    }
  };
  
  // 过滤掉日期类型的实体和低相关性实体
  const filteredEntities = filterIrrelevantEntities(entities);
  
  // 创建实体节点（只保留名词实体）
  const entityNodes = filteredEntities.map(entity => ({
    id: `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'entity',
    properties: {
      title: entity.text,
      category: blog.tag || 'General',
      weight: entity.frequency || 1, // 添加权重属性
      relevance: entity.relevance || 0.5 // 添加相关性属性
    }
  }));
  
  // 所有节点（博客节点和实体节点）
  const nodes = [blogNode, ...entityNodes];
  
  // 去除重复节点
  const uniqueNodes = removeDuplicateNodes(nodes);
  
  // 提取博客和实体之间的关系
  const blogEntityRelationships = extractBlogEntityRelationships(blog, uniqueNodes, filteredEntities);
  
  // 提取实体之间的关系
  const entityRelationships = extractEntityToEntityRelationships(blog, uniqueNodes, filteredEntities, preprocessedText);
  
  // 合并所有关系
  const relationships = [...blogEntityRelationships, ...entityRelationships];
  
  return {
    nodes: uniqueNodes,
    relationships
  };
}

/**
 * 从博客标题中提取关键实体
 * @param {string} title 博客标题
 * @returns {Array} 标题中的关键实体
 * 
 * 提取策略：
 * 1. 预处理标题文本
 * 2. 提取单个单词实体
 * 3. 提取名词短语
 * 4. 为标题中的实体赋予更高权重
 */
function extractKeyEntitiesFromTitle(title) {
  if (!title) return [];
  
  // 预处理标题
  const cleanTitle = preprocessText(title);
  const words = cleanTitle.split(/\s+/);
  
  const titleEntities = [];
  const entityFrequency = new Map();
  
  // 提取单词作为实体
  for (const word of words) {
    if (word.length > 2 && 
        !stopWords.includes(word.toLowerCase()) &&
        !nonNounWords.includes(word.toLowerCase()) &&
        isLikelyNoun(word)) {
      
      const normalizedWord = word.toLowerCase();
      if (!entityFrequency.has(normalizedWord)) {
        entityFrequency.set(normalizedWord, 2); // 标题中的实体赋予更高的基础权重
        titleEntities.push({
          text: word,
          context: cleanTitle,
          frequency: 2,
          fromTitle: true // 标记来自标题的实体
        });
      }
    }
  }
  
  // 提取名词短语
  for (let i = 0; i < words.length - 1; i++) {
    if (isLikelyNoun(words[i]) || isLikelyNoun(words[i+1])) {
      const phrase = `${words[i]} ${words[i+1]}`;
      
      if (isLikelyNounPhrase(phrase)) {
        const normalizedPhrase = phrase.toLowerCase();
        if (!entityFrequency.has(normalizedPhrase)) {
          entityFrequency.set(normalizedPhrase, 3); // 标题中的短语赋予更高权重
          titleEntities.push({
            text: phrase,
            context: cleanTitle,
            frequency: 3,
            fromTitle: true
          });
        }
      }
    }
  }
  
  return titleEntities;
}

/**
 * 合并来自标题和内容的实体
 * @param {Array} titleEntities 标题实体
 * @param {Array} contentEntities 内容实体
 * @returns {Array} 合并后的实体列表
 * 
 * 合并策略：
 * 1. 保留标题实体的高权重
 * 2. 合并重复实体并累加权重
 * 3. 添加新的内容实体
 */
function mergeEntities(titleEntities, contentEntities) {
  const mergedEntities = [...titleEntities];
  const existingEntityTexts = new Set(titleEntities.map(e => e.text.toLowerCase()));
  
  for (const entity of contentEntities) {
    const normalizedText = entity.text.toLowerCase();
    
    if (existingEntityTexts.has(normalizedText)) {
      // 如果实体已存在，更新权重
      const existingEntity = mergedEntities.find(e => 
        e.text.toLowerCase() === normalizedText
      );
      existingEntity.frequency += entity.frequency;
    } else {
      // 否则添加新实体
      mergedEntities.push(entity);
      existingEntityTexts.add(normalizedText);
    }
  }
  
  return mergedEntities;
}

/**
 * 预处理文本，去除HTML标签和特殊字符
 * @param {string} text 原始文本内容
 * @returns {string} 预处理后的文本
 * 
 * 处理步骤：
 * 1. 转换为小写
 * 2. 移除特殊字符
 * 3. 标准化空白字符
 * 4. 移除多余标点
 */
function preprocessText(text) {
  // 如果不是字符串，转换为字符串
  if (typeof text !== 'string') {
    text = String(text || '');
  }
  
  // 移除HTML标签
  let cleanText = text.replace(/<[^>]*>/g, ' ');
  
  // 移除特殊字符和多余空格
  cleanText = cleanText.replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleanText;
}

/**
 * 从文本中提取名词实体
 * @param {string} text 预处理后的文本
 * @param {string} tag 博客标签/分类
 * @returns {Array} 提取的实体列表
 * 
 * 提取策略：
 * 1. 分词处理
 * 2. 过滤停用词
 * 3. 识别名词和名词短语
 * 4. 计算实体频率
 * 5. 评估实体相关性
 */
function extractNounEntities(text, tag) {
  const entities = [];
  const entityFrequency = new Map(); // 跟踪实体出现频率
  const paragraphs = text.split(/\n+/);
  
  // 遍历段落提取实体
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 10) continue; // 忽略过短的段落
    
    // 分割成句子
    const sentences = paragraph.split(/[.。!！?？]/);
    
    for (const sentence of sentences) {
      if (sentence.trim().length < 5) continue; // 忽略过短的句子
      
      // 提取可能的名词
      const words = sentence.trim().split(/\s+/);
      const filteredWords = words.filter(word => 
        word.length > 2 && 
        !stopWords.includes(word.toLowerCase()) &&
        !nonNounWords.includes(word.toLowerCase())
      );
      
      // 提取单个名词作为实体
      for (const word of filteredWords) {
        if (isLikelyNoun(word) && !isGenericOrExample(word)) {
          const normalizedWord = word.toLowerCase();
          
          // 领域相关优先
          const domainRelated = isDomainRelated(word, tag);
          // 技术词典校验
          const validTech = isValidTechTerm(word);
          
          // 更新实体频率
          if (entityFrequency.has(normalizedWord)) {
            entityFrequency.set(normalizedWord, entityFrequency.get(normalizedWord) + 1);
          } else {
            entityFrequency.set(normalizedWord, 1);
            // 添加新实体
            entities.push({
              text: word,
              context: sentence.trim(),
              domainRelated,
              validTech
            });
          }
        }
      }
      
      // 提取名词短语
      extractNounPhrases(filteredWords, sentence, entities, entityFrequency);
    }
  }
  
  // 更新实体频率
  for (const entity of entities) {
    const normalizedText = entity.text.toLowerCase();
    entity.frequency = entityFrequency.get(normalizedText) || 1;
  }
  
  // 计算TF-IDF权重
  calculateEntityRelevance(entities, text, tag);
  
  // 按相关度排序并限制实体数量，移除低相关度实体
  return entities
    .filter(entity => entity.relevance > 0.2) // 提高相关性阈值
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 20); // 限制为20个最相关实体
}

/**
 * 判断是否为通用词或示例词
 * @param {string} word 待检查的词
 * @returns {boolean} 是否为通用词
 * 
 * 检查标准：
 * 1. 是否为常见示例词
 * 2. 是否为通用描述词
 * 3. 是否为技术文档常见词
 */
function isGenericOrExample(word) {
  const normalized = word.toLowerCase();
  // 检查是否包含通用词或示例词的部分
  return normalized.includes('example') || 
         normalized.includes('test') || 
         normalized.includes('demo') || 
         normalized.includes('info') ||
         normalized.includes('示例') ||
         normalized.includes('演示') ||
         normalized === 'com' ||
         normalized.includes('click') ||
         normalized.includes('here') ||
         normalized.includes('点击') ||
         normalized.includes('这里') ||
         normalized === 'accessibility';
}

/**
 * 计算实体的相关性得分
 * @param {Array} entities 实体列表
 * @param {string} documentText 文档文本
 * @param {string} tag 博客标签
 * @returns {Array} 带有相关性得分的实体列表
 * 
 * 计算因素：
 * 1. 实体出现频率
 * 2. 实体在关键段落中的分布
 * 3. 实体与博客标签的相关性
 * 4. 实体的技术相关性
 */
function calculateEntityRelevance(entities, documentText, tag) {
  const documentLength = documentText.length;
  const documentWordCount = documentText.split(/\s+/).length;
  
  // 提取文档关键段落（通常是文章开头和各段落的首句）
  const keyParagraphs = extractKeyParagraphs(documentText);
  
  // 获取标题（假设标题在documentText开头或通过参数传递）
  const title = (typeof tag === 'object' && tag.title) ? tag.title : '';
  const tagStr = typeof tag === 'string' ? tag : '';
  
  for (const entity of entities) {
    let relevance = entity.frequency;
    const lengthFactor = Math.min(entity.text.length / 5, 2);
    relevance *= lengthFactor;
    
    // 文档占比权重
    const textOccurrence = (documentText.match(new RegExp(entity.text, 'gi')) || []).length;
    if (textOccurrence > 0) {
      const density = textOccurrence / documentWordCount;
      relevance *= (1 + density * 10);
    }
    
    // 上下文相关性
    if (entity.context && entity.context.trim().toLowerCase().startsWith(entity.text.toLowerCase())) {
      relevance *= 1.5;
    }
    
    // 关键段落加权
    const keyParaOccurrence = countOccurrencesInParagraphs(entity.text, keyParagraphs);
    if (keyParaOccurrence > 0) {
      relevance *= (1 + keyParaOccurrence * 0.3);
    }
    
    // 技术术语加权
    if (isTechnicalTerm(entity.text)) {
      relevance *= 1.5;
    }
    
    // 领域相关加权
    if (entity.domainRelated) {
      relevance *= 2;
    }
    
    // 技术词典加权
    if (entity.validTech) {
      relevance *= 1.5;
    } else {
      relevance *= 0.7; // 无法验证的实体降低权重
    }
    
    // 与标题匹配加权
    if (title && title.toLowerCase().includes(entity.text.toLowerCase())) {
      relevance *= 2;
    }
    // 与标签匹配加权
    if (tagStr && tagStr.toLowerCase().includes(entity.text.toLowerCase())) {
      relevance *= 1.5;
    }
    
    entity.relevance = Math.min(relevance / 10, 1);
  }
}

/**
 * 提取文档中的关键段落
 * @param {string} text 文档文本
 * @returns {Array} 关键段落列表
 * 
 * 提取策略：
 * 1. 按段落分割文本
 * 2. 识别包含技术术语的段落
 * 3. 识别包含实体定义的段落
 * 4. 过滤无关段落
 */
function extractKeyParagraphs(text) {
  const paragraphs = text.split(/\n+/);
  const keyParagraphs = [];
  
  // 添加文章开头段落
  if (paragraphs.length > 0) {
    keyParagraphs.push(paragraphs[0]);
  }
  
  // 添加各段落的首句
  for (let i = 0; i < Math.min(paragraphs.length, 10); i++) {
    const sentences = paragraphs[i].split(/[.。!！?？]/);
    if (sentences.length > 0 && sentences[0].trim().length > 10) {
      keyParagraphs.push(sentences[0]);
    }
  }
  
  return keyParagraphs;
}

/**
 * 统计实体在关键段落中的出现次数
 * @param {string} text 实体文本
 * @param {Array} paragraphs 关键段落列表
 * @returns {number} 出现次数
 */
function countOccurrencesInParagraphs(text, paragraphs) {
  let count = 0;
  const regex = new RegExp(text, 'gi');
  
  for (const paragraph of paragraphs) {
    const matches = paragraph.match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count;
}

/**
 * 判断是否为技术术语
 * @param {string} text 待检查的文本
 * @returns {boolean} 是否为技术术语
 * 
 * 判断标准：
 * 1. 是否在技术词典中
 * 2. 是否符合技术术语特征
 * 3. 是否包含技术相关词汇
 */
function isTechnicalTerm(text) {
  const techTermPatterns = [
    /^[A-Z][a-z]*[A-Z]/,  // 驼峰命名法
    /\b[A-Z]{2,}\b/,      // 全大写缩写词
    /\b[a-z]+[A-Z][a-z]+\b/, // 小驼峰
    /-api$|-sdk$|-cli$|-ui$|-ux$|-db$|-sql$|-css$|-html$|-js$|-ts$|-xml$|-json$/i, // 常见技术后缀
    /^api-|^sdk-|^cli-|^ui-|^db-|^sql-|^css-|^html-|^js-|^ts-|^xml-|^json-/i, // 常见技术前缀
    /[a-z]+\.[a-z]+/      // 点号连接（可能是域名或包名）
  ];
  
  // 常见技术词汇列表
  const commonTechTerms = [
    'html', 'css', 'javascript', 'js', 'typescript', 'ts', 'react', 'vue', 'angular',
    'node', 'express', 'mongodb', 'mysql', 'postgresql', 'sql', 'nosql', 'rest', 'api',
    'graphql', 'frontend', 'backend', 'fullstack', 'devops', 'database', 'cloud',
    'aws', 'azure', 'docker', 'kubernetes', 'serverless', 'microservice', 'framework',
    'library', 'component', 'function', 'class', 'object', 'interface', 'type',
    'algorithm', 'data structure', 'git', 'github', 'gitlab', 'bitbucket', 'agile', 'scrum',
    // 中文技术词汇
    '前端', '后端', '全栈', '数据库', '云计算', '微服务', '框架', '库', '组件', '函数', '类',
    '对象', '接口', '算法', '数据结构', '版本控制'
  ];
  
  // 检查是否匹配技术术语模式
  for (const pattern of techTermPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // 检查是否是常见技术词汇
  if (commonTechTerms.includes(text.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * 判断词是否为名词
 * @param {string} word 待检查的词
 * @returns {boolean} 是否为名词
 * 
 * 判断标准：
 * 1. 不在非名词词表中
 * 2. 符合名词特征
 * 3. 不在停用词表中
 */
function isLikelyNoun(word) {
  // 忽略纯数字
  if (/^\d+$/.test(word)) return false;
  
  // 忽略太短的词
  if (word.length < 3) return false;
  
  // 检查是否为常见非名词
  if (nonNounWords.includes(word.toLowerCase())) return false;
  
  // 检查是否为日期时间词
  if (dateTimeWords.includes(word.toLowerCase())) return false;
  
  // 名词特征：首字母大写的单词更可能是专有名词
  const isProperNoun = /^[A-Z][a-z]+$/.test(word);
  
  // 技术词汇特征：包含连字符或下划线
  const isTechTerm = /[-_]/.test(word);
  
  // 复合词特征：驼峰命名法
  const isCompoundWord = /[a-z][A-Z]/.test(word);
  
  // 中文名词特征（简单规则）
  const isChineseNoun = /[\u4e00-\u9fa5]{2,}/.test(word);
  
  return isProperNoun || isTechTerm || isCompoundWord || isChineseNoun || word.length > 5;
}

/**
 * 提取名词短语
 * @param {Array} words 分词列表
 * @param {string} sentence 原始句子
 * @param {Array} entities 已识别的实体
 * @param {Map} entityFrequency 实体频率统计
 * @returns {Array} 提取的名词短语
 * 
 * 提取策略：
 * 1. 识别相邻的名词组合
 * 2. 验证短语的有效性
 * 3. 更新实体频率统计
 */
function extractNounPhrases(words, sentence, entities, entityFrequency) {
  // 如果词数太少，不尝试提取名词短语
  if (words.length < 2) return;
  
  // 尝试2-3个词的组合
  for (let i = 0; i < words.length - 1; i++) {
    // 双词名词短语
    if (isLikelyNoun(words[i]) || isLikelyNoun(words[i+1])) {
      const twoWordPhrase = `${words[i]} ${words[i+1]}`;
      if (isLikelyNounPhrase(twoWordPhrase) && !isGenericOrExample(twoWordPhrase)) {
        const normalizedPhrase = twoWordPhrase.toLowerCase();
        
        // 更新短语频率
        if (entityFrequency.has(normalizedPhrase)) {
          entityFrequency.set(normalizedPhrase, entityFrequency.get(normalizedPhrase) + 1);
        } else {
          entityFrequency.set(normalizedPhrase, 1);
          // 添加新短语实体
          entities.push({
            text: twoWordPhrase,
            context: sentence.trim()
          });
        }
      }
    }
    
    // 三词名词短语
    if (i < words.length - 2) {
      if (isLikelyNoun(words[i]) || isLikelyNoun(words[i+1]) || isLikelyNoun(words[i+2])) {
        const threeWordPhrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
        if (isLikelyNounPhrase(threeWordPhrase) && !isGenericOrExample(threeWordPhrase)) {
          const normalizedPhrase = threeWordPhrase.toLowerCase();
          
          // 更新短语频率
          if (entityFrequency.has(normalizedPhrase)) {
            entityFrequency.set(normalizedPhrase, entityFrequency.get(normalizedPhrase) + 1);
          } else {
            entityFrequency.set(normalizedPhrase, 1);
            // 添加新短语实体
            entities.push({
              text: threeWordPhrase,
              context: sentence.trim()
            });
          }
        }
      }
    }
  }
}

/**
 * 判断短语是否为有效的名词短语
 * @param {string} phrase 待检查的短语
 * @returns {boolean} 是否为有效的名词短语
 * 
 * 判断标准：
 * 1. 长度限制
 * 2. 词性组合
 * 3. 语义完整性
 */
function isLikelyNounPhrase(phrase) {
  // 避免常见非名词短语
  const isCommonPhrase = /^(in the|for the|to the|of the|on the)$/i.test(phrase);
  if (isCommonPhrase) return false;
  
  // 检查是否包含通用词或示例词
  if (isGenericOrExample(phrase)) return false;
  
  // 技术术语特征：每个词首字母大写或包含特殊字符
  const isTechTerm = /([A-Z][a-z]+\s+)+/.test(phrase) || /[-_]/.test(phrase);
  
  // 名词短语特征：形容词+名词组合
  const isAdjectiveNoun = /[a-z]+\s+[A-Z][a-z]+/.test(phrase);
  
  // 特定领域术语：通常全部小写但有特定模式
  const isDomainTerm = phrase.length > 10 && /[a-z]+\s+[a-z]+/.test(phrase);
  
  // 中文名词短语
  const isChinesePhrase = /[\u4e00-\u9fa5]{2,}\s+[\u4e00-\u9fa5]{2,}/.test(phrase);
  
  return isTechTerm || isAdjectiveNoun || isDomainTerm || isChinesePhrase;
}

/**
 * 移除重复的节点
 * @param {Array} nodes 节点列表
 * @returns {Array} 去重后的节点列表
 * 
 * 去重策略：
 * 1. 基于节点ID去重
 * 2. 合并相同节点的属性
 * 3. 保留权重最高的节点
 */
function removeDuplicateNodes(nodes) {
  const uniqueIds = new Set();
  const uniqueNodes = [];
  
  for (const node of nodes) {
    if (!uniqueIds.has(node.id)) {
      uniqueIds.add(node.id);
      uniqueNodes.push(node);
    } else {
      // 如果是重复节点，更新原有节点的权重（如果存在）
      const existingNode = uniqueNodes.find(n => n.id === node.id);
      if (existingNode && node.properties.weight && existingNode.properties.weight) {
        existingNode.properties.weight += node.properties.weight;
      }
    }
  }
  
  return uniqueNodes;
}

/**
 * 过滤无关实体
 * @param {Array} entities 实体列表
 * @returns {Array} 过滤后的实体列表
 * 
 * 过滤标准：
 * 1. 实体相关性得分
 * 2. 实体频率
 * 3. 实体类型
 * 4. 领域相关性
 */
function filterIrrelevantEntities(entities) {
  return entities.filter(entity => {
    const normalizedText = entity.text.toLowerCase();
    
    // 过滤日期格式 (2023-01-01, 01/01/2023 等)
    if (/^\d{2,4}[-/\.]\d{1,2}[-/\.]\d{1,2}$/.test(normalizedText)) {
      return false;
    }
    
    // 过滤纯数字
    if (/^\d+$/.test(normalizedText)) {
      return false;
    }
    
    // 过滤日期时间相关词
    if (dateTimeWords.includes(normalizedText)) {
      return false;
    }
    
    // 过滤年份
    if (/^(19|20)\d{2}$/.test(normalizedText)) {
      return false;
    }
    
    // 过滤低相关性实体
    if (entity.relevance < 0.1) {
      return false;
    }
    
    return true;
  });
}

/**
 * 提取博客与实体之间的关系
 * @param {Object} blog 博客对象
 * @param {Array} nodes 节点列表
 * @param {Array} entities 实体列表
 * @returns {Array} 关系列表
 * 
 * 关系类型：
 * 1. 博客包含实体
 * 2. 博客讨论实体
 * 3. 博客引用实体
 */
function extractBlogEntityRelationships(blog, nodes, entities) {
  const relationships = [];
  const blogNodeId = `blog-${blog.slug}`;
  
  // 创建博客与实体之间的关系
  for (const entity of entities) {
    const entityId = `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`;
    
    // 检查实体节点是否存在
    const entityNode = nodes.find(node => node.id === entityId);
    if (!entityNode) continue;
    
    // 创建博客->实体的关系
    relationships.push({
      source: blogNodeId,
      target: entityId,
      type: 'CONTAINS',
      properties: {
        weight: entity.relevance || entity.frequency || 1
      }
    });
  }
  
  return relationships;
}

/**
 * 提取实体之间的关系
 * @param {Object} blog 博客对象
 * @param {Array} nodes 节点列表
 * @param {Array} entities 实体列表
 * @param {string} text 预处理后的文本
 * @returns {Array} 关系列表
 * 
 * 关系提取策略：
 * 1. 共现分析
 * 2. 上下文分析
 * 3. 语义关系识别
 */
function extractEntityToEntityRelationships(blog, nodes, entities, text) {
  const relationships = [];
  const paragraphs = text.split(/\n+/);
  
  // 创建实体ID映射表，方便快速查找
  const entityMap = {};
  for (const entity of entities) {
    entityMap[entity.text.toLowerCase()] = `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  // 获取所有实体ID
  const entityIds = Object.values(entityMap);
  
  // 检查节点是否存在
  const existingEntityIds = nodes
    .filter(node => node.type === 'entity')
    .map(node => node.id);
  
  // 实体共现分析
  const coOccurrenceMap = buildCoOccurrenceMap(entities, text, paragraphs);
  
  // 基于共现频率创建实体间关系
  for (const [entityPair, frequency] of Object.entries(coOccurrenceMap)) {
    const [sourceText, targetText] = entityPair.split('||||');
    
    // 获取实体ID
    const sourceId = entityMap[sourceText];
    const targetId = entityMap[targetText];
    
    // 确保两个实体节点都存在
    if (!existingEntityIds.includes(sourceId) || !existingEntityIds.includes(targetId)) {
      continue;
    }
    
    // 避免自环关系
    if (sourceId === targetId) {
      continue;
    }
    
    // 尝试检测关系类型
    const relationType = detectRelationType(sourceText, targetText, text) || 'RELATED_TO';
    
    // 创建实体间关系
    relationships.push({
      source: sourceId,
      target: targetId,
      type: relationType,
      properties: {
        weight: Math.min(frequency / 2, 1),  // 归一化权重
        source: blog.slug                    // 关系来源
      }
    });
  }
  
  return relationships;
}

/**
 * 构建实体共现图
 * @param {Array} entities 实体列表
 * @param {string} text 博客内容
 * @param {Array} paragraphs 关键段落
 * @returns {Map} 共现关系图
 * 
 * 构建策略：
 * 1. 统计实体共现频率
 * 2. 计算共现强度
 * 3. 过滤弱关联
 */
function buildCoOccurrenceMap(entities, text, paragraphs) {
  const coOccurrenceMap = {};
  
  // 只处理高相关性实体，避免噪音
  const highRelevanceEntities = entities.filter(e => e.relevance > 0.15);
  
  // 从段落层面分析共现
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 20) continue;
    
    // 记录当前段落中出现的实体
    const entitiesInParagraph = [];
    
    for (const entity of highRelevanceEntities) {
      // 检查实体是否在段落中出现
      if (new RegExp(`\\b${escapeRegExp(entity.text)}\\b`, 'i').test(paragraph)) {
        entitiesInParagraph.push(entity.text.toLowerCase());
      }
    }
    
    // 生成实体对共现记录
    for (let i = 0; i < entitiesInParagraph.length; i++) {
      for (let j = i + 1; j < entitiesInParagraph.length; j++) {
        const entityPair = `${entitiesInParagraph[i]}||||${entitiesInParagraph[j]}`;
        const reversePair = `${entitiesInParagraph[j]}||||${entitiesInParagraph[i]}`;
        
        // 更新共现频率（双向都记录）
        coOccurrenceMap[entityPair] = (coOccurrenceMap[entityPair] || 0) + 1;
        coOccurrenceMap[reversePair] = (coOccurrenceMap[reversePair] || 0) + 1;
      }
    }
  }
  
  // 过滤掉低频共现
  const filteredMap = {};
  for (const [pair, frequency] of Object.entries(coOccurrenceMap)) {
    if (frequency >= 2) {  // 只保留出现至少2次的共现对
      filteredMap[pair] = frequency;
    }
  }
  
  return filteredMap;
}

/**
 * 转义正则表达式特殊字符
 * @param {string} text 原始文本
 * @returns {string} 转义后的文本
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 检测实体间的关系类型
 * @param {string} source 源实体
 * @param {string} target 目标实体
 * @param {string} text 上下文文本
 * @returns {string} 关系类型
 * 
 * 检测策略：
 * 1. 基于关系词识别
 * 2. 基于上下文分析
 * 3. 基于语义规则
 */
function detectRelationType(source, target, text) {
  // 定义可能包含关系的模式
  const patterns = [
    // 中文模式
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}是[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    new RegExp(`${escapeRegExp(target)}[^.。!?！？]{0,50}是[^.。!?！？]{0,50}${escapeRegExp(source)}`, 'i'),
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}包含[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}使用[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}依赖[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    
    // 英文模式
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}\\bis\\b[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    new RegExp(`${escapeRegExp(target)}[^.。!?！？]{0,50}\\bis\\b[^.。!?！？]{0,50}${escapeRegExp(source)}`, 'i'),
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}\\bcontains\\b[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}\\buses\\b[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i'),
    new RegExp(`${escapeRegExp(source)}[^.。!?！？]{0,50}\\bdepends on\\b[^.。!?！？]{0,50}${escapeRegExp(target)}`, 'i')
  ];
  
  // 检查文本中是否有匹配的关系模式
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // 提取关系词
      for (const [keyword, relationType] of Object.entries(relationTypes)) {
        if (match[0].toLowerCase().includes(keyword)) {
          return relationType;
        }
      }
      
      // 默认为IS_A关系
      return 'IS_A';
    }
  }
  
  // 未找到明确关系，返回null，调用方会使用默认的RELATED_TO
  return null;
}

/**
 * 判断实体是否与特定领域相关
 * @param {string} entityText 实体文本
 * @param {string} tag 领域标签
 * @returns {boolean} 是否相关
 * 
 * 判断标准：
 * 1. 领域关键词匹配
 * 2. 技术术语相关性
 * 3. 上下文相关性
 */
function isDomainRelated(entityText, tag) {
  if (!tag) return false;
  const tagKey = tag.toLowerCase();
  if (!domainKeywords[tagKey]) return false;
  return domainKeywords[tagKey].some(keyword => entityText.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * 验证技术术语的有效性
 * @param {string} entityText 实体文本
 * @returns {boolean} 是否为有效的技术术语
 * 
 * 验证标准：
 * 1. 技术词典匹配
 * 2. 术语特征符合
 * 3. 上下文相关性
 */
function isValidTechTerm(entityText) {
  return techDictionary.some(term => entityText.toLowerCase() === term.toLowerCase());
} 