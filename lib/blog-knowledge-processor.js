/**
 * 博客知识图谱处理服务
 * 负责将博客内容处理为知识图谱三元组数据
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

/**
 * 处理博客内容，提取知识图谱数据
 * @param {Object} blog 博客对象，包含title, content, slug等属性
 * @returns {Object} 包含nodes和relationships的知识图谱数据
 */
export async function processBlogContent(blog) {
  console.log(`处理博客: ${blog.title}`);
  
  // 预处理文本
  const preprocessedText = preprocessText(blog.content);
  
  // 提取实体
  const entities = extractEntities(preprocessedText, blog.tag);
  
  // 创建博客节点
  const blogNodeId = `blog-${blog.slug}`;
  const blogNode = {
    id: blogNodeId,
    type: 'blog',
    properties: {
      title: blog.title,
      url: `/posts/${blog.slug}`,
      summary: blog.description || blog.excerpt || '博客文章',
      category: blog.tag || 'General'
    }
  };
  
  // 所有节点（包含博客节点和提取的实体节点）
  const nodes = [
    blogNode,
    ...entities.map(entity => ({
      id: `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`,
      type: entity.type,
      properties: {
        title: entity.text,
        url: '', // 实体节点没有URL
        summary: entity.context || `${entity.text} (${entity.type})`,
        category: blog.tag || 'General'
      }
    }))
  ];
  
  // 去除重复节点
  const uniqueNodes = removeDuplicateNodes(nodes);
  
  // 提取关系
  const relationships = extractRelationships(blog, uniqueNodes, entities);
  
  return {
    nodes: uniqueNodes,
    relationships
  };
}

/**
 * 预处理文本，去除HTML标签和特殊字符
 * @param {string} text 原始文本内容
 * @returns {string} 预处理后的文本
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
 * 提取文本中的实体
 * @param {string} text 预处理后的文本
 * @param {string} tag 博客标签，用于确定实体类型
 * @returns {Array} 提取的实体列表
 */
function extractEntities(text, tag) {
  const entities = [];
  const paragraphs = text.split(/\n+/);
  
  // 根据博客标签确定应该提取的实体类型
  const entityTypes = determineEntityTypes(tag);
  
  // 遍历段落提取实体
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 10) continue; // 忽略过短的段落
    
    // 分割成句子
    const sentences = paragraph.split(/[.。!！?？]/);
    
    for (const sentence of sentences) {
      if (sentence.trim().length < 5) continue; // 忽略过短的句子
      
      // 提取关键词作为实体
      const words = sentence.trim().split(/\s+/);
      const filteredWords = words.filter(word => 
        word.length > 2 && !stopWords.includes(word.toLowerCase())
      );
      
      // 尝试提取多词组合作为术语
      extractTerms(filteredWords, sentence, entityTypes, entities);
      
      // 提取单个关键词作为实体
      for (const word of filteredWords) {
        if (isLikelyEntity(word, entityTypes)) {
          // 查找是否已有相同实体
          const existingEntity = entities.find(e => 
            e.text.toLowerCase() === word.toLowerCase()
          );
          
          if (!existingEntity) {
            entities.push({
              text: word,
              type: guessEntityType(word, entityTypes),
              context: sentence.trim()
            });
          }
        }
      }
    }
  }
  
  // 限制实体数量，避免过多
  return entities.slice(0, 20);
}

/**
 * 确定应该提取的实体类型
 * @param {string} tag 博客标签
 * @returns {Object} 实体类型配置
 */
function determineEntityTypes(tag) {
  // 默认实体类型
  const defaultTypes = {
    primary: 'concept',
    secondary: 'term',
    patterns: {}
  };
  
  // 根据标签自定义实体类型
  if (tag && typeof tag === 'string') {
    const tagLower = tag.toLowerCase();
    
    if (tagLower.includes('html')) {
      return {
        primary: 'element',
        secondary: 'attribute',
        patterns: {
          element: /<([a-z][a-z0-9]*)\b[^>]*>/i,
          attribute: /\s([a-z][a-z0-9-]*)(=|:)/i
        }
      };
    } else if (tagLower.includes('css')) {
      return {
        primary: 'property',
        secondary: 'value',
        patterns: {
          selector: /([.#][a-z][a-z0-9-]*)/i,
          property: /([a-z-]+):/i
        }
      };
    } else if (tagLower.includes('javascript') || tagLower.includes('js')) {
      return {
        primary: 'function',
        secondary: 'variable',
        patterns: {
          function: /function\s+([a-z][a-z0-9_]*)/i,
          method: /\.([a-z][a-z0-9_]*)\(/i
        }
      };
    }
  }
  
  return defaultTypes;
}

/**
 * 判断一个词是否可能是实体
 * @param {string} word 待判断的词
 * @param {Object} entityTypes 实体类型配置
 * @returns {boolean} 是否可能是实体
 */
function isLikelyEntity(word, entityTypes) {
  // 忽略纯数字
  if (/^\d+$/.test(word)) return false;
  
  // 忽略太短的词
  if (word.length < 3) return false;
  
  // 针对特定类型模式的检测
  for (const [type, pattern] of Object.entries(entityTypes.patterns)) {
    if (pattern.test(word)) return true;
  }
  
  // 默认规则：首字母大写或包含特殊字符的词更可能是实体
  return /^[A-Z]/.test(word) || 
         /[-_]/.test(word) || 
         word.length > 5;
}

/**
 * 根据词特征猜测实体类型
 * @param {string} word 实体词
 * @param {Object} entityTypes 实体类型配置
 * @returns {string} 猜测的实体类型
 */
function guessEntityType(word, entityTypes) {
  // 根据模式匹配类型
  for (const [type, pattern] of Object.entries(entityTypes.patterns)) {
    if (pattern.test(word)) return type;
  }
  
  // HTML元素相关
  if (/^<.+>$/.test(word) || /^[a-z]+Element$/i.test(word)) {
    return 'element';
  }
  
  // CSS相关
  if (/^[.#]/.test(word) || /^[a-z-]+:$/i.test(word)) {
    return 'property';
  }
  
  // 默认使用主要和次要类型
  return Math.random() > 0.7 ? entityTypes.secondary : entityTypes.primary;
}

/**
 * 从词列表中提取术语（多词组合）
 * @param {Array} words 词列表
 * @param {string} sentence 原始句子
 * @param {Object} entityTypes 实体类型配置
 * @param {Array} entities 实体列表，用于添加新发现的实体
 */
function extractTerms(words, sentence, entityTypes, entities) {
  // 如果词数太少，不尝试提取术语
  if (words.length < 3) return;
  
  // 尝试2-3个词的组合
  for (let i = 0; i < words.length - 1; i++) {
    // 双词术语
    const twoWordTerm = `${words[i]} ${words[i+1]}`;
    if (isLikelyTerm(twoWordTerm)) {
      entities.push({
        text: twoWordTerm,
        type: guessEntityType(twoWordTerm, entityTypes),
        context: sentence.trim()
      });
    }
    
    // 三词术语
    if (i < words.length - 2) {
      const threeWordTerm = `${words[i]} ${words[i+1]} ${words[i+2]}`;
      if (isLikelyTerm(threeWordTerm)) {
        entities.push({
          text: threeWordTerm,
          type: guessEntityType(threeWordTerm, entityTypes),
          context: sentence.trim()
        });
      }
    }
  }
}

/**
 * 判断一个词组是否可能是术语
 * @param {string} term 词组
 * @returns {boolean} 是否可能是术语
 */
function isLikelyTerm(term) {
  // 技术术语通常每个词都是首字母大写，或者包含特殊字符
  const hasSpecialFormat = /([A-Z][a-z]+\s+){2,}/.test(term) || 
                           /[-_]/.test(term);
  
  // 避免普通短语
  const isCommonPhrase = /^(in the|for the|to the|of the|on the)$/i.test(term);
  
  return hasSpecialFormat && !isCommonPhrase;
}

/**
 * 去除重复节点
 * @param {Array} nodes 节点列表
 * @returns {Array} 去重后的节点列表
 */
function removeDuplicateNodes(nodes) {
  const uniqueIds = new Set();
  const uniqueNodes = [];
  
  for (const node of nodes) {
    if (!uniqueIds.has(node.id)) {
      uniqueIds.add(node.id);
      uniqueNodes.push(node);
    }
  }
  
  return uniqueNodes;
}

/**
 * 提取博客和实体之间的关系
 * @param {Object} blog 博客对象
 * @param {Array} nodes 节点列表
 * @param {Array} entities 实体列表
 * @returns {Array} 关系列表
 */
function extractRelationships(blog, nodes, entities) {
  const relationships = [];
  const blogNodeId = `blog-${blog.slug}`;
  
  // 博客与实体之间的关系
  for (const entity of entities) {
    const entityId = `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`;
    
    // 检查实体节点是否存在
    const entityNode = nodes.find(node => node.id === entityId);
    if (!entityNode) continue;
    
    // 创建博客->实体的关系
    relationships.push({
      source: blogNodeId,
      target: entityId,
      type: 'MENTIONS'
    });
  }
  
  // 在实体之间创建关系
  // 这里使用简单的共现关系：如果两个实体出现在同一博客中，就建立联系
  for (let i = 0; i < entities.length; i++) {
    const entityId1 = `entity-${entities[i].text.toLowerCase().replace(/\s+/g, '-')}`;
    
    for (let j = i + 1; j < entities.length; j++) {
      const entityId2 = `entity-${entities[j].text.toLowerCase().replace(/\s+/g, '-')}`;
      
      // 检查两个实体节点是否都存在
      const entityNode1 = nodes.find(node => node.id === entityId1);
      const entityNode2 = nodes.find(node => node.id === entityId2);
      
      if (!entityNode1 || !entityNode2) continue;
      
      // 创建实体间的关系
      if (Math.random() > 0.7) { // 随机选择部分实体创建关系，避免关系过多
        relationships.push({
          source: entityId1,
          target: entityId2,
          type: 'RELATED_TO'
        });
      }
    }
  }
  
  return relationships;
} 