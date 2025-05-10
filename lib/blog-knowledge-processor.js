/**
 * 博客知识图谱处理服务
 * 负责将博客内容处理为知识图谱三元组数据，仅保留实体节点和文章-实体关系
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
  '做', '去', '看', '说', '想', '用', '来', '给', '找', '吃'
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
  
  // 提取名词实体
  const entities = extractNounEntities(preprocessedText, blog.tag);
  
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
  
  // 创建实体节点（只保留名词实体）
  const entityNodes = entities.map(entity => ({
    id: `entity-${entity.text.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'noun_entity',
    properties: {
      title: entity.text,
      category: blog.tag || 'General',
      weight: entity.frequency || 1 // 添加权重属性
    }
  }));
  
  // 所有节点（博客节点和实体节点）
  const nodes = [blogNode, ...entityNodes];
  
  // 去除重复节点
  const uniqueNodes = removeDuplicateNodes(nodes);
  
  // 提取关系（仅文章与实体的关系）
  const relationships = extractEntityRelationships(blog, uniqueNodes, entities);
  
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
 * 提取文本中的名词实体
 * @param {string} text 预处理后的文本
 * @param {string} tag 博客标签，用于确定实体类型
 * @returns {Array} 提取的名词实体列表
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
        if (isLikelyNoun(word)) {
          const normalizedWord = word.toLowerCase();
          
          // 更新实体频率
          if (entityFrequency.has(normalizedWord)) {
            entityFrequency.set(normalizedWord, entityFrequency.get(normalizedWord) + 1);
          } else {
            entityFrequency.set(normalizedWord, 1);
            // 添加新实体
            entities.push({
              text: word,
              context: sentence.trim()
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
  
  // 按频率排序并限制实体数量
  return entities
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 30);
}

/**
 * 判断一个词是否可能是名词
 * @param {string} word 待判断的词
 * @returns {boolean} 是否可能是名词
 */
function isLikelyNoun(word) {
  // 忽略纯数字
  if (/^\d+$/.test(word)) return false;
  
  // 忽略太短的词
  if (word.length < 3) return false;
  
  // 检查是否为常见非名词
  if (nonNounWords.includes(word.toLowerCase())) return false;
  
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
 * 从词列表中提取名词短语
 * @param {Array} words 词列表
 * @param {string} sentence 原始句子
 * @param {Array} entities 实体列表，用于添加新发现的实体
 * @param {Map} entityFrequency 实体频率映射
 */
function extractNounPhrases(words, sentence, entities, entityFrequency) {
  // 如果词数太少，不尝试提取名词短语
  if (words.length < 2) return;
  
  // 尝试2-3个词的组合
  for (let i = 0; i < words.length - 1; i++) {
    // 双词名词短语
    if (isLikelyNoun(words[i]) || isLikelyNoun(words[i+1])) {
      const twoWordPhrase = `${words[i]} ${words[i+1]}`;
      if (isLikelyNounPhrase(twoWordPhrase)) {
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
        if (isLikelyNounPhrase(threeWordPhrase)) {
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
 * 判断一个词组是否可能是名词短语
 * @param {string} phrase 词组
 * @returns {boolean} 是否可能是名词短语
 */
function isLikelyNounPhrase(phrase) {
  // 避免常见非名词短语
  const isCommonPhrase = /^(in the|for the|to the|of the|on the)$/i.test(phrase);
  if (isCommonPhrase) return false;
  
  // 技术术语特征：每个词首字母大写或包含特殊字符
  const isTechTerm = /([A-Z][a-z]+\s+)+/.test(phrase) || /[-_]/.test(phrase);
  
  // 名词短语特征：形容词+名词组合
  const isAdjectiveNoun = /[a-z]+\s+[A-Z][a-z]+/.test(phrase);
  
  // 特定领域术语：通常全部小写但有特定模式
  const isDomainTerm = phrase.length > 10 && /[a-z]+\s+[a-z]+/.test(phrase);
  
  return isTechTerm || isAdjectiveNoun || isDomainTerm;
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
 * 提取博客和实体之间的关系（仅保留文章-实体关系）
 * @param {Object} blog 博客对象
 * @param {Array} nodes 节点列表
 * @param {Array} entities 实体列表
 * @returns {Array} 关系列表
 */
function extractEntityRelationships(blog, nodes, entities) {
  const relationships = [];
  const blogNodeId = `blog-${blog.slug}`;
  
  // 仅创建博客与实体之间的关系
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
        weight: entity.frequency || 1
      }
    });
  }
  
  return relationships;
} 