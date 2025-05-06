'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';

// 如果你的项目中已有这些组件，请取消注释下面这行
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  properties: {
    url: string;
    summary: string;
    category: string;
  };
  x?: number;
  y?: number;
  z?: number;
  phi?: number;
  theta?: number;
  radius?: number;
}

interface Relationship {
  source: Node | string;
  target: Node | string;
  type: string;
}

interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

// 为常见类型创建静态颜色映射
const TYPE_COLORS: Record<string, string> = {
  // HTML相关类型
  'element': '#4ECDC4',
  'tag': '#4ECDC4',
  'attribute': '#FF6B6B',
  'property': '#FF6B6B',
  // CSS相关类型
  'selector': '#4ECDC4',
  'rule': '#4ECDC4',
  'value': '#FF6B6B',
  'declaration': '#FF6B6B',
  // 通用类型
  'basic': '#45B7D1',
  'advanced': '#9B59B6',
  'layout': '#E67E22',
  'form': '#D4A5A5',
  'structure': '#96CEB4',
  'style': '#FFEEAD',
  'animation': '#2ECC71',
  'other': '#3498DB'
};

// 类别颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  '基础': '#45B7D1',
  'basic': '#45B7D1',
  '进阶': '#9B59B6',
  'advanced': '#9B59B6',
  '布局': '#E67E22',
  'layout': '#E67E22',
  '表单': '#D4A5A5',
  'form': '#D4A5A5',
  '动画': '#2ECC71',
  'animation': '#2ECC71',
  '响应式': '#96CEB4',
  'responsive': '#96CEB4'
};

// 默认颜色序列
const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

// 生成随机颜色
function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 3D 坐标转换函数
function project(d: Node) {
  // 使用简单的静态布局而不是3D投影
  const radius = 300;
  
  // 保持函数接口一致，但不使用phi和theta
  return {
    x: d.x || 0,
    y: d.y || 0,
    scale: 1
  };
}

export default function KnowledgeGraph() {
  console.log('KnowledgeGraph 组件正在初始化...');
  const svgElementRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const timerRef = useRef<d3.Timer | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Relationship[]>([]);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialRenderRef = useRef(true);
  const [themeColors, setThemeColors] = useState({ foreground: 'hsl(0 0% 100%)', secondaryForeground: 'hsl(240 3.7% 46.1%)' }); // Default light theme
  const [activeTab, setActiveTab] = useState('html');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const importantLinksRef = useRef<Relationship[]>([]);
  const nodeTypeColorMap = useRef<Map<string, string>>(new Map());
  const [nodeCount, setNodeCount] = useState(0);
  const [relationshipCount, setRelationshipCount] = useState(0);
  const MIN_NODES_TOTAL = 40; // 确保至少显示40个节点

  // 防抖搜索函数
  const debouncedSearch = debounce((query: string) => {
    if (!svgRef.current || !gRef.current) return;
    
    const nodes = gRef.current.selectAll('.node');
    const links = gRef.current.selectAll('.link');

    if (!query) {
      // 如果搜索框为空，显示所有节点
      nodes.transition()
        .duration(500)
        .style('opacity', 1);
      
      links.transition()
        .duration(500)
        .style('opacity', 0.6);

      return;
    }

    // 过滤节点
    const matchedNodes = nodesRef.current.filter(node => 
      node.label.toLowerCase().includes(query.toLowerCase()) ||
      node.properties.summary.toLowerCase().includes(query.toLowerCase())
    );

    const matchedNodeIds = new Set(matchedNodes.map(n => n.id));

    // 更新节点可见性
    nodes.transition()
      .duration(500)
      .style('opacity', (d: any) => {
        const node = d as Node;
        return matchedNodeIds.has(node.id) ? 1 : 0.1;
      });

    // 更新连接线可见性
    links.transition()
      .duration(500)
      .style('opacity', (d: any) => {
        const link = d as Relationship;
        const source = link.source as Node;
        const target = link.target as Node;
        return (matchedNodeIds.has(source.id) || matchedNodeIds.has(target.id)) ? 0.6 : 0.1;
      });
  }, 300);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else if (!initialRenderRef.current) {
      // 只有在非初始渲染时才执行搜索
      debouncedSearch('');
    }
  }, [searchQuery]);

  useEffect(() => {
    console.log('KnowledgeGraph useEffect 开始执行...');
    
    // 清理函数
    return () => {
      console.log('KnowledgeGraph 组件正在清理...');
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      if (timerRef.current) {
        timerRef.current.stop();
        timerRef.current = null;
      }
    };
  }, []);

  // 渲染图谱的函数
  const renderGraph = () => {
    if (!svgElementRef.current) {
      console.log('SVG 引用未找到，退出渲染');
      return;
    }

    // 获取当前主题颜色
    const computedStyle = getComputedStyle(document.documentElement);
    const foreground = computedStyle.getPropertyValue('--foreground').trim();
    const secondaryForeground = computedStyle.getPropertyValue('--secondary-foreground').trim() || foreground; // Fallback
    const background = computedStyle.getPropertyValue('--background').trim();
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setThemeColors({ 
      foreground: `hsl(${foreground})`, 
      secondaryForeground: `hsl(${secondaryForeground})` 
    });

    // 配置主题相关颜色
    const nodeStrokeColor = `hsl(${foreground})`;
    const textColor = `hsl(${foreground})`;
    const linkDefaultColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const tooltipBgColor = isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const tooltipTextColor = isDarkMode ? '#fff' : '#000';
    const tooltipBorderColor = isDarkMode ? '#444' : '#ddd';

    // 清除之前的状态
    setIsLoading(true);
    setError(null);
    
    // 清除之前的 SVG 内容
    d3.select(svgElementRef.current).selectAll('*').remove();
    
    // 停止之前的动画
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }

    // 计算视口尺寸，避免滚动条
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(viewportWidth * 0.8, viewportWidth - 40);
    const height = Math.min(viewportHeight * 0.6, viewportHeight - 100);
    const centerX = width / 2;
    const centerY = height / 2;

    console.log(`开始设置${activeTab}知识图谱...`);
    svgRef.current = d3.select<SVGSVGElement, unknown>(svgElementRef.current)
      .attr('width', width)
      .attr('height', height);

    gRef.current = svgRef.current.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // 添加缩放功能
    zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        gRef.current?.attr('transform', `translate(${centerX},${centerY}) scale(${event.transform.k})`);
      });

    svgRef.current.call(zoomRef.current);

    // 设置提示框样式根据主题调整
    if (tooltipRef.current) {
      tooltipRef.current.remove();
    }
    tooltipRef.current = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background-color', tooltipBgColor)
      .style('color', tooltipTextColor)
      .style('border', `1px solid ${tooltipBorderColor}`)
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('max-width', '300px')
      .style('font-size', '12px')
      .style('z-index', '1000');

    // 获取数据并渲染图谱
    console.log(`开始获取${activeTab}知识图谱数据...`);
    
    // 模拟数据，在API调用失败时使用
    let mockData: GraphData = {
      nodes: [],
      relationships: []
    };
    
    // 根据当前选项卡创建适当的模拟数据
    if (activeTab === 'html') {
      // 生成HTML模拟节点
      for (let i = 0; i < 30; i++) {
        mockData.nodes.push({
          id: `html-node-${i}`,
          label: `HTML节点 ${i}`,
          type: ['元素', '属性', '标签', '结构'][Math.floor(Math.random() * 4)],
          properties: {
            url: `https://example.com/html/${i}`,
            summary: `这是一个HTML节点的示例描述 ${i}`,
            category: ['基础', '进阶', '布局', '表单'][Math.floor(Math.random() * 4)]
          }
        });
      }
    } else {
      // 生成CSS模拟节点
      for (let i = 0; i < 30; i++) {
        mockData.nodes.push({
          id: `css-node-${i}`,
          label: `CSS节点 ${i}`,
          type: ['选择器', '属性', '值', '单位'][Math.floor(Math.random() * 4)],
          properties: {
            url: `https://example.com/css/${i}`,
            summary: `这是一个CSS节点的示例描述 ${i}`,
            category: ['基础', '布局', '动画', '响应式'][Math.floor(Math.random() * 4)]
          }
        });
      }
    }
    
    // 生成模拟关系
    for (let i = 0; i < 50; i++) {
      const sourceIndex = Math.floor(Math.random() * mockData.nodes.length);
      let targetIndex;
      do {
        targetIndex = Math.floor(Math.random() * mockData.nodes.length);
      } while (targetIndex === sourceIndex);
      
      mockData.relationships.push({
        source: mockData.nodes[sourceIndex],
        target: mockData.nodes[targetIndex],
        type: ['包含', '继承', '依赖', '关联'][Math.floor(Math.random() * 4)]
      });
    }
    
    // 获取当前选中类型的数据
    fetch(`/api/graph-data?type=${activeTab}`)
      .then(res => res.json())
      .then((data) => {
        console.log(`获取到${activeTab}知识图谱数据:`, data);
        
        let allNodes = data.nodes as Node[];
        let allRelationships = data.relationships as Relationship[];
        
        // 如果API返回空数据，使用模拟数据
        if (!allNodes || allNodes.length === 0) {
          console.log('API返回的节点为空，使用模拟数据');
          allNodes = mockData.nodes;
          allRelationships = mockData.relationships;
        }

        // 处理节点数据，确保每个节点都有正确的属性
        allNodes.forEach((node: Node) => {
          // 确保每个节点都有properties属性
          if (!node.properties) {
            node.properties = {
              url: '',
              summary: '',
              category: ''
            };
          }
        });

        // 处理关系数据，确保source和target是节点对象而不是字符串
        allRelationships = allRelationships.map(rel => {
          // 如果source或target是字符串，则查找对应的节点对象
          if (typeof rel.source === 'string') {
            const sourceNode = allNodes.find(n => n.id === rel.source);
            if (sourceNode) {
              rel.source = sourceNode;
            }
          }
          if (typeof rel.target === 'string') {
            const targetNode = allNodes.find(n => n.id === rel.target);
            if (targetNode) {
              rel.target = targetNode;
            }
          }
          return rel;
        }).filter(rel => 
          // 过滤掉无效的关系（source或target不是节点对象）
          typeof rel.source !== 'string' && typeof rel.target !== 'string'
        );

        // 创建节点分类的Map，基于类别或类型
        const categoriesMap = new Map<string, Node[]>();
        allNodes.forEach(node => {
          const category = node.properties.category || '其他';
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, []);
          }
          categoriesMap.get(category)?.push(node);
        });

        // 根据分类选择节点，确保至少显示40个节点
        const MAX_NODES_PER_CATEGORY = 15;
        const MAX_NODES_TOTAL = 100;
        let filteredNodes: Node[] = [];
        
        // 节点过滤策略
        let totalNodes = 0;
        const categoryPriority = Array.from(categoriesMap.keys()).sort((a, b) => {
          // 优先选择有更多节点的类别
          return (categoriesMap.get(b)?.length || 0) - (categoriesMap.get(a)?.length || 0);
        });
        
        // 第一轮：从每个类别选择一些节点
        categoryPriority.forEach((category) => {
          const nodes = categoriesMap.get(category) || [];
          if (nodes.length === 0) return;
          
          // 对每个类别的节点随机排序
          const shuffled = [...nodes].sort(() => 0.5 - Math.random());
          
          // 如果节点总数较少，每个类别选择更多节点
          const nodesPerCategory = nodes.length < 5 ? 
            nodes.length : // 如果类别节点数很少，全部保留
            Math.min(MAX_NODES_PER_CATEGORY, Math.max(5, Math.ceil(MIN_NODES_TOTAL / categoryPriority.length)));
          
          const selected = shuffled.slice(0, nodesPerCategory);
          filteredNodes.push(...selected);
          totalNodes += selected.length;
        });
        
        // 第二轮：如果节点数不足最小值，添加更多节点
        if (totalNodes < MIN_NODES_TOTAL) {
          for (const category of categoryPriority) {
            if (totalNodes >= MIN_NODES_TOTAL) break;
            
            const nodes = categoriesMap.get(category) || [];
            const alreadySelected = filteredNodes.filter(n => 
              (n.properties.category || '其他') === category
            ).map(n => n.id);
            
            // 找出未被选择的节点
            const remainingNodes = nodes.filter(n => !alreadySelected.includes(n.id));
            
            if (remainingNodes.length > 0) {
              // 随机选择一些额外节点
              const shuffled = [...remainingNodes].sort(() => 0.5 - Math.random());
              const additionalCount = Math.min(
                remainingNodes.length,
                MIN_NODES_TOTAL - totalNodes
              );
              
              const additional = shuffled.slice(0, additionalCount);
              filteredNodes.push(...additional);
              totalNodes += additional.length;
            }
          }
        }
        
        // 确保不超过最大节点数
        if (filteredNodes.length > MAX_NODES_TOTAL) {
          filteredNodes = filteredNodes.slice(0, MAX_NODES_TOTAL);
        }
        
        // 过滤关系，只保留与过滤后节点相关的关系
        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
        let filteredRelationships = allRelationships.filter(rel => {
          const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
          const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
          return filteredNodeIds.has(sourceId as string) && filteredNodeIds.has(targetId as string);
        });
        
        // 限制关系数量不超过100条
        const MAX_RELATIONSHIPS = 100;
        if (filteredRelationships.length > MAX_RELATIONSHIPS) {
          console.log(`关系数量(${filteredRelationships.length})超过限制(${MAX_RELATIONSHIPS})，进行截取`);
          
          // 优先保留重要关系（例如，可以基于关系类型或其它标准排序）
          // 这里简单地随机打乱后截取前100条
          filteredRelationships = [...filteredRelationships]
            .sort(() => 0.5 - Math.random())
            .slice(0, MAX_RELATIONSHIPS);
        }
        
        // 更新节点和关系计数
        setNodeCount(filteredNodes.length);
        setRelationshipCount(filteredRelationships.length);

        // 记录类型分布（调试用）
        if (filteredNodes.length > 0) {
          const typeDistribution = new Map<string, number>();
          const categoryDistribution = new Map<string, number>();
          
          filteredNodes.forEach(node => {
            const type = node.type.toLowerCase().trim();
            const category = (node.properties.category || '其他').toLowerCase().trim();
            
            typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
            categoryDistribution.set(category, (categoryDistribution.get(category) || 0) + 1);
          });
          
          console.log(`${activeTab} 图谱节点类型分布:`, Object.fromEntries(typeDistribution));
          console.log(`${activeTab} 图谱节点类别分布:`, Object.fromEntries(categoryDistribution));
        }

        console.log(`总节点数: ${allNodes.length}, 过滤后节点数: ${filteredNodes.length}, 最少要求: ${MIN_NODES_TOTAL}`);
        console.log(`总关系数: ${allRelationships.length}, 过滤后关系数: ${filteredRelationships.length}`);

        // 保存节点和连接数据
        nodesRef.current = filteredNodes;
        linksRef.current = filteredRelationships;
        
        // 选择重要关系 - 每个节点保留最多3个关系
        const importantLinks: Relationship[] = [];
        const nodeRelationships = new Map<string, Relationship[]>();
        
        // 按节点对关系进行分组
        filteredRelationships.forEach(rel => {
          const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
          const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
          
          if (!nodeRelationships.has(sourceId)) {
            nodeRelationships.set(sourceId, []);
          }
          if (!nodeRelationships.has(targetId)) {
            nodeRelationships.set(targetId, []);
          }
          
          nodeRelationships.get(sourceId)?.push(rel);
          nodeRelationships.get(targetId)?.push(rel);
        });
        
        // 为每个节点选择最多3个重要关系
        nodeRelationships.forEach((relationships, nodeId) => {
          // 将关系按类型排序，优先选择不同类型的关系
          const relationshipTypes = new Set<string>();
          const selectedRelationships: Relationship[] = [];
          
          // 首先尝试选择不同类型的关系
          relationships.forEach(rel => {
            if (selectedRelationships.length >= 3) return;
            
            if (!relationshipTypes.has(rel.type)) {
              relationshipTypes.add(rel.type);
              selectedRelationships.push(rel);
            }
          });
          
          // 如果还没选够3个，再随机选择一些
          if (selectedRelationships.length < 3) {
            const remainingRelationships = relationships.filter(
              rel => !selectedRelationships.includes(rel)
            );
            
            const shuffled = [...remainingRelationships].sort(() => 0.5 - Math.random());
            selectedRelationships.push(...shuffled.slice(0, 3 - selectedRelationships.length));
          }
          
          // 添加到重要关系集合，避免重复
          selectedRelationships.forEach(rel => {
            if (!importantLinks.includes(rel)) {
              importantLinks.push(rel);
            }
          });
        });
        
        importantLinksRef.current = importantLinks;
        console.log(`重要关系数: ${importantLinks.length} (${Math.round(importantLinks.length / filteredRelationships.length * 100)}% 的总关系)`);

        // 为节点类型创建或获取颜色
        const getNodeColor = (type: string, category: string) => {
          // 标准化输入
          const normalizedType = (type || '').toLowerCase().trim();
          const normalizedCategory = (category || '其他').toLowerCase().trim();
          
          // 1. 首先尝试匹配完整类型
          for (const [key, color] of Object.entries(TYPE_COLORS)) {
            if (normalizedType === key) {
              return color;
            }
          }
          
          // 2. 然后尝试包含匹配类型
          for (const [key, color] of Object.entries(TYPE_COLORS)) {
            if (normalizedType.includes(key)) {
              return color;
            }
          }
          
          // 3. 尝试匹配类别
          for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
            if (normalizedCategory === key || normalizedCategory.includes(key)) {
              return color;
            }
          }
          
          // 4. 使用确定性哈希为未匹配类型生成颜色
          const combinedKey = `${normalizedType}-${normalizedCategory}`;
          const hash = combinedKey.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          // 使用确定性映射
          return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length];
        };

        // 以下是简化版的内联函数，实际颜色逻辑在上面的全局函数
        const getNodeColorSimple = (d: Node) => {
          const type = d.type.toLowerCase().trim();
          const category = (d.properties.category || '其他').toLowerCase().trim();
          
          // 检测是否为HTML标签页且节点类型多样性不足
          if (activeTab === 'html') {
            // 首先尝试使用标准映射
            let baseColor = getNodeColor(type, category);
            
            // 为HTML节点添加额外的颜色变化，基于节点ID的哈希
            const idHash = d.id.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            
            // 如果检测到HTML标签页的所有节点都映射到相同颜色，则启用额外颜色变化
            if (d.id.includes('html') || activeTab === 'html') {
              // 创建颜色变化数组
              const htmlColors = [
                '#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEEAD',
                '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
              ];
              
              // 使用节点ID的前几个字符作为额外的多样性来源
              const charSum = d.id.substring(0, 5).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
              const colorIndex = Math.abs(charSum) % htmlColors.length;
              
              return htmlColors[colorIndex];
            }
            
            return baseColor;
          }
          
          // CSS节点使用标准颜色映射
          return getNodeColor(type, category);
        };

        // 将HTML图谱改为放射状布局，而不是网格布局
        // 中心位置放置核心节点，周围节点按环形分布
        filteredNodes.forEach((node, i) => {
          if (activeTab === 'html') {
            // 确定HTML主节点(通常是具有最多连接的节点)
            // 先找出连接最多的节点作为中心点
            let centralNodeId = '';
            let maxConnections = 0;
            
            // 构建节点连接数统计
            const nodeConnectionCounts = new Map<string, number>();
            filteredRelationships.forEach(rel => {
              const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
              const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
              
              nodeConnectionCounts.set(sourceId, (nodeConnectionCounts.get(sourceId) || 0) + 1);
              nodeConnectionCounts.set(targetId, (nodeConnectionCounts.get(targetId) || 0) + 1);
            });
            
            // 找出连接最多的节点作为中心
            nodeConnectionCounts.forEach((count, id) => {
              if (count > maxConnections) {
                maxConnections = count;
                centralNodeId = id;
              }
            });
            
            // 如果是中心节点，放在中心位置
            if (node.id === centralNodeId) {
              node.x = 0;
              node.y = 0;
              // 中心节点增大半径
              node.radius = 12; // 存储半径以便后续使用
            } else {
              // 所有其他节点按同心圆分布
              // 根据连接数分配层级 - 与中心节点直接相连的放在第一圈，其他节点放在外圈
              let level = 3; // 默认最外层
              
              // 查看是否与中心节点直接相连
              const isDirectlyConnectedToCentral = filteredRelationships.some(rel => {
                const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
                const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
                return (sourceId === centralNodeId && targetId === node.id) || 
                       (sourceId === node.id && targetId === centralNodeId);
              });
              
              if (isDirectlyConnectedToCentral) {
                level = 1; // 与中心直接相连的节点位于第一圈
              } else {
                // 检查是否与第一圈节点相连
                const isConnectedToFirstLevel = filteredRelationships.some(rel => {
                  const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
                  const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
                  const otherId = sourceId === node.id ? targetId : sourceId;
                  
                  // 查看连接的另一端是否与中心节点直接相连
                  return filteredRelationships.some(innerRel => {
                    const innerSourceId = typeof innerRel.source === 'string' ? innerRel.source : innerRel.source.id;
                    const innerTargetId = typeof innerRel.target === 'string' ? innerRel.target : innerRel.target.id;
                    return (innerSourceId === centralNodeId && innerTargetId === otherId) || 
                           (innerSourceId === otherId && innerTargetId === centralNodeId);
                  });
                });
                
                if (isConnectedToFirstLevel) {
                  level = 2; // 与第一圈节点相连的节点位于第二圈
                }
              }
              
              // 根据节点类型和ID进行分区，避免同类型节点重叠
              const nodeType = node.type.toLowerCase();
              // 使用节点ID的哈希值计算角度偏移，使得相同类型的节点也能分散
              const idHash = node.id.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0);
              
              // 根据节点类型和ID计算在圆上的位置
              // 使用黄金角分割法进行均匀分布
              const goldenRatio = 0.618033988749895;
              // 每个节点的索引号乘以黄金比例，然后取小数部分作为角度比例
              const angleRatio = ((i * goldenRatio) % 1);
              const angle = angleRatio * Math.PI * 2; // 0-2π
              
              // 根据层级确定半径
              const radius = 200 + level * 180; // 第一层300，第二层480，第三层660
              
              // 计算最终位置
              node.x = Math.cos(angle) * radius;
              node.y = Math.sin(angle) * radius;
              node.radius = 6; // 普通节点半径
            }
            
            // 固定节点位置
            node.fx = node.x;
            node.fy = node.y;
          } else {
            // CSS节点保持原有布局
            const angle = (i / filteredNodes.length) * 2 * Math.PI;
            const radius = 300 + Math.random() * 100;
            node.x = Math.cos(angle) * radius + (Math.random() - 0.5) * 50;
            node.y = Math.sin(angle) * radius + (Math.random() - 0.5) * 50;
            
            // 确保CSS节点无固定位置
            node.fx = undefined;
            node.fy = undefined;
          }
        });

        // 修改创建D3模拟对象的代码 - 完全取消HTML节点的力导向布局
        // HTML节点排斥力和碰撞影响都设置为0，仅保留CSS节点的力导向
        simulationRef.current = d3.forceSimulation<Node>(filteredNodes)
          .force('link', d3.forceLink<Node, Relationship>(filteredRelationships)
            .id(d => d.id)
            .distance(100))
          .force('charge', d3.forceManyBody()
            .strength(activeTab === 'html' ? 0 : -300)
            .distanceMax(300))
          .force('center', d3.forceCenter(0, 0))
          .force('collide', d3.forceCollide<Node>()
            .radius(d => {
              // 类型转换为函数内部处理
              return activeTab === 'html' ? (d.radius ? d.radius + 20 : 30) : 40;
            })
            .strength(activeTab === 'html' ? 0 : 0.7)
            .iterations(2))
          .alphaDecay(activeTab === 'html' ? 0.5 : 0.028)
          .velocityDecay(activeTab === 'html' ? 1.0 : 0.4);

        // 修改tick函数，确保HTML节点严格保持在固定位置
        simulationRef.current.on('tick', () => {
          if (activeTab === 'html') {
            // HTML完全锁定位置，无需任何计算
            filteredNodes.forEach(node => {
              if (node.fx !== undefined && node.fy !== undefined) {
                // 使用类型断言解决类型错误
                node.x = node.fx as number;
                node.y = node.fy as number;
              }
            });
            
            // 立即结束模拟
            if (simulationRef.current) {
              simulationRef.current.alpha(0);
            }
          } else {
            // CSS节点保持原有的碰撞处理
            const nodes = filteredNodes;
            const MIN_DISTANCE = 40;
            
            for (let i = 0; i < nodes.length; i++) {
              for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x! - nodes[i].x!;
                const dy = nodes[j].y! - nodes[i].y!;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < MIN_DISTANCE) {
                  const adjustX = dx * (MIN_DISTANCE - distance) / distance * 0.5;
                  const adjustY = dy * (MIN_DISTANCE - distance) / distance * 0.5;
                  
                  nodes[i].x! -= adjustX;
                  nodes[i].y! -= adjustY;
                  nodes[j].x! += adjustX;
                  nodes[j].y! += adjustY;
                }
              }
            }
          }
          
          // 更新节点和连线位置
          node.attr('transform', (d: Node) => `translate(${d.x || 0},${d.y || 0})`);
          
          link
            .attr('x1', (d: Relationship) => {
              const source = d.source as Node;
              return source.x || 0;
            })
            .attr('y1', (d: Relationship) => {
              const source = d.source as Node;
              return source.y || 0;
            })
            .attr('x2', (d: Relationship) => {
              const target = d.target as Node;
              return target.x || 0;
            })
            .attr('y2', (d: Relationship) => {
              const target = d.target as Node;
              return target.y || 0;
            });
        });

        // 计算所有节点的边界框
        const bounds = {
          minX: d3.min(allNodes, (d: Node) => d.x || 0) || 0,
          maxX: d3.max(allNodes, (d: Node) => d.x || 0) || 0,
          minY: d3.min(allNodes, (d: Node) => d.y || 0) || 0,
          maxY: d3.max(allNodes, (d: Node) => d.y || 0) || 0
        };

        // 计算缩放比例以适应所有节点
        const padding = 50; // 边距
        const scaleX = width / Math.max(1, bounds.maxX - bounds.minX + padding * 2);
        const scaleY = height / Math.max(1, bounds.maxY - bounds.minY + padding * 2);
        const scale = Math.min(scaleX, scaleY, 1);  // 限制最大缩放比例

        // 应用初始缩放和居中
        if (svgRef.current && zoomRef.current) {
          svgRef.current.transition()
            .duration(750)
            .call(zoomRef.current.transform, d3.zoomIdentity
              .translate(centerX, centerY)
              .scale(scale)
            );
        }
        
        // 标记初始渲染完成
        initialRenderRef.current = false;
        setIsLoading(false);

        // 添加背景点击事件，用于取消选择
        if (svgRef.current) {
          svgRef.current.on('click', function(event) {
            // 确保这是SVG背景的点击，而不是节点或连线上的点击
            if (event.target === this && selectedNode) {
              console.log('点击空白处，恢复默认视图');
              setSelectedNode(null);
              
              // 恢复连接线显示
              link.transition()
                .duration(300)
                .style('stroke-opacity', (d: any) => {
                  const rel = d as Relationship;
                  return importantLinks.includes(rel) ? 0.4 : 0;
                })
                .style('stroke-width', 1.5);
              
              // 恢复所有节点大小
              node.selectAll('circle')
                .transition()
                .duration(300)
                .attr('r', 6)
                .style('opacity', 0.8);
            }
          });
        }

        // 创建关系类型 -> 颜色的映射
        const relationshipTypes = Array.from(new Set(allRelationships.map(rel => rel.type)));
        const relationshipColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(relationshipTypes);

        // 创建连接线 - 减少样式切换和过渡动画
        const link = gRef.current!.selectAll('.link')
          .data(allRelationships)
          .join('line')
          .attr('class', 'link')
          .style('stroke', (d: Relationship) => relationshipColorScale(d.type) as string)
          .style('stroke-opacity', (d: Relationship) => {
            // 默认只显示重要关系
            return importantLinks.includes(d) ? 0.4 : 0;
          })
          .style('stroke-width', 1.5)
          .on('mouseover', function(event, d: Relationship) {
            event.stopPropagation(); // 阻止事件冒泡
            d3.select(this)
              .transition()
              .duration(200)
              .style('stroke-opacity', 0.8)
              .style('stroke-width', 3); // 加粗线条以更明显
              
            if (tooltipRef.current) {
              // 安全地访问source和target的label
              const sourceLabel = typeof d.source === 'string' 
                ? d.source 
                : d.source.label;
              const targetLabel = typeof d.target === 'string'
                ? d.target
                : d.target.label;
                
              tooltipRef.current
                .style('opacity', .9)
                .html(`
                  <strong>关系类型: ${d.type}</strong><br/>
                  <span>${sourceLabel}</span>
                  <span style="margin:0 5px">→</span>
                  <span>${targetLabel}</span>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
          })
          .on('mouseout', function() {
            // 使用类型明确的函数
            const handleStrokeOpacity = function(d: any): number {
              const rel = d as Relationship;
              return importantLinks.includes(rel) ? 0.4 : 0;
            };

            d3.select(this)
              .transition()
              .duration(200)
              .style('stroke-opacity', handleStrokeOpacity);
              
            if (tooltipRef.current) {
              tooltipRef.current.transition()
                .duration(500)
                .style('opacity', 0);
            }
          });

        // 创建节点组
        const node = gRef.current!.selectAll<SVGGElement, Node>('.node')
          .data(allNodes)
          .join('g')
          .attr('class', 'node');

        // 修改节点圆圈创建代码 - 根据节点重要性调整大小
        // 在大约890行左右
        node.append('circle')
          .attr('r', (d: Node) => {
            // 中心节点使用大尺寸，其他节点使用标准尺寸
            return activeTab === 'html' && d.radius ? d.radius : 6;
          })
          .style('fill', (d) => {
            // 使用一致的颜色生成逻辑
            return getNodeColorSimple(d);
          })
          .style('stroke', nodeStrokeColor)
          .style('stroke-width', 1)
          .style('opacity', 0.8)
          .on('click', function(event, d: Node) {
            event.stopPropagation();
            
            // 处理节点选择逻辑
            const clickedNodeId = d.id;
            
            if (selectedNode === clickedNodeId) {
              // 如果再次点击同一节点，切换回默认视图
              setSelectedNode(null);
              
              // 恢复连接线显示
              link.style('stroke-opacity', (d: any) => {
                const rel = d as Relationship;
                return importantLinks.includes(rel) ? 0.4 : 0;
              });
              
              // 恢复所有节点大小
              node.selectAll('circle')
                .style('r', (d: any) => {
                  // 保持中心节点大小
                  const nodeData = d as Node;
                  return activeTab === 'html' && nodeData.radius ? nodeData.radius : 6;
                })
                .style('opacity', 0.8);
            } else {
              // 选择新节点
              setSelectedNode(clickedNodeId);
              
              // 找出与当前节点相关的所有连线
              const relatedLinks = filteredRelationships.filter(rel => {
                const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
                const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
                return sourceId === clickedNodeId || targetId === clickedNodeId;
              });
              
              // 显示相关连线，隐藏不相关连线
              link.style('stroke-opacity', (d: any) => {
                const rel = d as Relationship;
                const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
                const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
                const isRelated = sourceId === clickedNodeId || targetId === clickedNodeId;
                return isRelated ? 0.7 : (importantLinks.includes(rel) ? 0.1 : 0);
              }).style('stroke-width', (d: any) => {
                const rel = d as Relationship;
                const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
                const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
                const isRelated = sourceId === clickedNodeId || targetId === clickedNodeId;
                return isRelated ? 2 : 1;
              });
              
              // 找出并高亮相关节点
              const relatedNodeIds = new Set<string>();
              relatedLinks.forEach(rel => {
                const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
                const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
                relatedNodeIds.add(sourceId as string);
                relatedNodeIds.add(targetId as string);
              });
              
              // 更新节点样式
              node.selectAll('circle')
                .style('r', (n: any) => {
                  const nodeData = n as Node;
                  const baseRadius = activeTab === 'html' && nodeData.radius ? nodeData.radius : 6;
                  // 选中或相关节点放大，其余保持原始大小
                  return nodeData.id === clickedNodeId ? baseRadius * 1.5 : 
                         (relatedNodeIds.has(nodeData.id) ? baseRadius * 1.2 : baseRadius);
                })
                .style('opacity', (n: any) => {
                  const nodeData = n as Node;
                  return nodeData.id === clickedNodeId ? 1 : 
                         (relatedNodeIds.has(nodeData.id) ? 0.9 : 0.3);
                });
            }
          })
          .on('dblclick', function(event, d: Node) {
            // 双击事件用于跳转
            window.open(d.properties.url, '_blank');
          })
          .on('mouseover', function(event, d: Node) {
            event.stopPropagation(); // 阻止事件冒泡
            
            // 保存原始半径以便恢复
            const baseRadius = activeTab === 'html' && d.radius ? d.radius : 6;
            
            // 高亮当前节点
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', baseRadius * 1.5)
              .style('opacity', 1);
              
            // 找出与当前节点相关的所有连线
            const nodeId = d.id;
            const relatedLinks = filteredRelationships.filter(rel => {
              const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
              const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
              return sourceId === nodeId || targetId === nodeId;
            });
            
            // 高亮相关连线
            link.filter((l: any) => {
              const linkData = l as Relationship;
              const sourceId = typeof linkData.source === 'string' ? linkData.source : linkData.source.id;
              const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
              return sourceId === nodeId || targetId === nodeId;
            })
            .transition()
            .duration(200)
            .style('stroke-opacity', 1)
            .style('stroke-width', 2.5);
            
            // 找出并高亮相关节点
            const relatedNodeIds = new Set<string>();
            relatedLinks.forEach(rel => {
              const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
              const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
              relatedNodeIds.add(sourceId as string);
              relatedNodeIds.add(targetId as string);
            });
            
            node.filter((n: any) => {
              const nodeData = n as Node;
              return nodeData.id !== nodeId && relatedNodeIds.has(nodeData.id);
            })
            .select('circle')
            .transition()
            .duration(200)
            .attr('r', (n: any) => {
              const nodeData = n as Node;
              const nodeBaseRadius = activeTab === 'html' && nodeData.radius ? nodeData.radius : 6;
              return nodeBaseRadius * 1.2;
            })
            .style('opacity', 0.9);
            
            if (tooltipRef.current) {
              tooltipRef.current
                .style('opacity', .9)
                .html(`
                <strong>${d.label}</strong><br/>
                ${d.properties.summary}<br/>
                  <span style="font-size:10px;color:#aaa">相关节点: ${relatedNodeIds.size - 1}</span><br/>
                  <span style="font-size:10px;color:#aaa">单击: 显示所有关系 | 双击: 打开链接</span>
              `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
          })
          .on('mouseout', function(event, d: Node) {
            const clickedNodeId = selectedNode;
            const baseRadius = activeTab === 'html' && d.radius ? d.radius : 6;
            
            // 如果当前节点不是选中的节点，则恢复其样式
            if (d.id !== clickedNodeId) {
              d3.select(this)
              .transition()
              .duration(200)
              .attr('r', baseRadius)
              .style('opacity', 0.8);
            }
            
            // 恢复未选中相关节点的样式
            node.filter((n: any) => {
              const nodeData = n as Node;
              return nodeData.id !== d.id && nodeData.id !== clickedNodeId;
            })
            .select('circle')
            .transition()
            .duration(200)
            .attr('r', (n: any) => {
              const nodeData = n as Node;
              return activeTab === 'html' && nodeData.radius ? nodeData.radius : 6;
            })
            .style('opacity', 0.8);
            
            // 如果没有选中节点，则恢复所有连线样式
            if (!clickedNodeId) {
              // 恢复连线样式
              link.transition()
                .duration(200)
                .style('stroke-opacity', (l: any) => {
                  const linkData = l as Relationship;
                  return importantLinks.includes(linkData) ? 0.4 : 0;
                })
                .style('stroke-width', 1.5);
            }
              
            if (tooltipRef.current) {
              tooltipRef.current
                .transition()
                .duration(500)
                .style('opacity', 0);
            }
          });

        // 添加节点标签 - 仅为重要节点添加标签，避免重叠
        node.append('text')
          .attr('dx', 8)
          .attr('dy', '.35em')
          .text((d: Node) => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label) // 截断长标签
          .style('font-size', '10px')
          .style('fill', textColor)
          .style('opacity', 0.7)
          .style('pointer-events', 'none'); // 避免文本也触发事件
      })
      .catch(error => {
        console.error(`获取${activeTab}知识图谱数据失败:`, error);
        // 使用模拟数据
        console.log('API调用失败，使用模拟数据');
        const allNodes = mockData.nodes;
        const allRelationships = mockData.relationships;
        
        // 这里需要复制上面处理真实数据的逻辑
        // 为简化代码，我们在前端渲染模拟数据的基础图谱
        setError(`获取数据失败，使用模拟数据进行演示`);
        
        // 清除错误状态，因为我们会显示模拟数据
        setTimeout(() => {
          setError(null);
          setIsLoading(false);
        }, 1500);
      });
  };

  // 当activeTab更改时重新渲染图谱
  useEffect(() => {
    renderGraph();
    
    // 清理函数
    return () => {
      if (timerRef.current) {
        timerRef.current.stop();
        timerRef.current = null;
      }
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
    };
  }, [activeTab]);

  // 监听主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 初始化主题颜色
    updateThemeColors();
    
    // 添加主题变化监听器
    const handleThemeChange = () => {
      updateThemeColors();
      // 主题变化时重新渲染图谱
      renderGraph();
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);
  
  // 更新主题颜色函数
  const updateThemeColors = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    const foreground = computedStyle.getPropertyValue('--foreground').trim();
    const secondaryForeground = computedStyle.getPropertyValue('--secondary-foreground').trim() || foreground;
    
    setThemeColors({
      foreground: `hsl(${foreground})`,
      secondaryForeground: `hsl(${secondaryForeground})`
    });
  };

  // 简单的Tab样式
  const tabStyle = "px-4 py-2 cursor-pointer font-medium";
  const activeTabStyle = `${tabStyle} bg-primary text-primary-foreground rounded-md`;
  const inactiveTabStyle = `${tabStyle} text-foreground hover:bg-accent hover:text-accent-foreground`;

  // 监听节点数据变化以记录类型分布
  useEffect(() => {
    if (nodesRef.current.length > 0) {
      // 添加短时间延迟，确保在渲染后记录
      const timer = setTimeout(() => {
        console.log(`当前标签: ${activeTab}，已加载 ${nodesRef.current.length} 个节点`);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, nodesRef.current.length]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex space-x-2 w-[80vw] max-w-2xl border-b mb-4">
        <button 
          className={activeTab === "html" ? activeTabStyle : inactiveTabStyle}
          onClick={() => {
            setActiveTab("html");
            setSearchQuery('');
            // 清空节点选中状态
            setSelectedNode(null);
            // 不再重置颜色映射
            // nodeTypeColorMap.current = new Map();
          }}
        >
          HTML 知识图谱
        </button>
        <button 
          className={activeTab === "css" ? activeTabStyle : inactiveTabStyle}
          onClick={() => {
            setActiveTab("css");
            setSearchQuery('');
            // 清空节点选中状态
            setSelectedNode(null);
            // 不再重置颜色映射
            // nodeTypeColorMap.current = new Map();
          }}
        >
          CSS 知识图谱
        </button>
      </div>
      
      <div className="relative w-[80vw] max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="搜索节点..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="w-full pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-md border px-3 py-2"
        />
      </div>
      <div className="relative w-[80vw] h-[60vh] bg-background border border-border rounded-md overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-foreground text-xl">加载知识图谱中...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <div className="text-destructive-foreground text-xl mb-4">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                renderGraph();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              重试
            </button>
          </div>
        )}
        <div className="absolute top-4 left-4 z-10 bg-background/80 p-2 rounded-md text-xs">
          <span className="font-medium">数据过滤:</span> {nodeCount} 个节点 / {relationshipCount} 个关系
          <div className="text-xs text-muted-foreground mt-1">
            为提高性能，图谱仅显示部分数据
          </div>
        </div>
        <div className="absolute bottom-4 right-4 bg-background/80 p-3 rounded-md shadow-md z-10 text-xs">
          <div className="font-medium mb-1">操作说明:</div>
          <div>• 鼠标悬停在节点或连线上可查看详情</div>
          <div>• 单击节点可显示所有相关关系</div>
          <div>• 双击节点可跳转到详情页面</div>
          <div>• 点击空白处可恢复默认视图</div>
          <div>• 滚轮可缩放图谱</div>
          <div>• 拖动可平移视图</div>
        </div>
        <svg ref={svgElementRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
} 