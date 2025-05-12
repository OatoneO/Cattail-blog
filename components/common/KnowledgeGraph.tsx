'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
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
  const timerRef = useRef<d3.Timer | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Relationship[]>([]);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialRenderRef = useRef(true);
  const [activeTab, setActiveTab] = useState('html');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const importantLinksRef = useRef<Relationship[]>([]);
  const nodeTypeColorMap = useRef<Map<string, string>>(new Map());
  const [nodeCount, setNodeCount] = useState(0);
  const [relationshipCount, setRelationshipCount] = useState(0);
  const MIN_NODES_TOTAL = 40; // 确保至少显示40个节点
  
  // 添加标签相关状态
  // const [availableTags, setAvailableTags] = useState<string[]>([]);
  // const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 渲染图谱的函数
  const renderGraph = useCallback(async () => {
    if (!svgElementRef.current) return;

    setIsLoading(true);
    d3.select(svgElementRef.current).selectAll('*').remove();

    // 增加视图尺寸，给节点提供更大的分布空间
    const width = Math.min(window.innerWidth * 0.9, window.innerWidth - 40);
    const height = Math.min(window.innerHeight * 0.8, window.innerHeight - 100);
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select<SVGSVGElement, unknown>(svgElementRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // 添加缩放功能并设置初始缩放
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    
    // 重置为默认视图位置，并设置合适的初始缩放比例
    svg.call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY).scale(0.6));

    // 设置提示框
    if (tooltipRef.current) {
      tooltipRef.current.remove();
    }
    tooltipRef.current = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background-color', 'rgba(255, 255, 255, 0.9)')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('max-width', '300px')
      .style('font-size', '12px')
      .style('z-index', '1000');

    try {
      const response = await fetch('/api/graph-data?all=true');
      const data: GraphData = await response.json();
      console.log('知识图谱数据', data);

      if (!data.nodes || data.nodes.length === 0) {
        setIsLoading(false); // 数据为空时直接结束加载
        return;
      }

      // 处理节点数据，确保每个节点都有正确的属性
      const nodes = data.nodes.map(node => ({
        ...node,
        properties: node.properties || {
          url: '',
          summary: '',
          category: ''
        }
      }));
      // 以 label 为唯一标识（标准化：去除首尾空格并转小写）去重
      const labelMap = new Map<string, Node>();
      nodes.forEach(node => {
        const normLabel = node.label.trim().toLowerCase();
        if (!labelMap.has(normLabel)) {
          labelMap.set(normLabel, node);
        }
      });
      const uniqueNodes = Array.from(labelMap.values());
      // 处理关系数据，source/target 匹配也用标准化 label
      const labelToNode = new Map(uniqueNodes.map(n => [n.label.trim().toLowerCase(), n]));
      const relationships = data.relationships.map(rel => {
        const sourceNode = typeof rel.source === 'string'
          ? labelToNode.get((nodes.find(n => n.id === rel.source)?.label || '').trim().toLowerCase())
          : labelToNode.get((rel.source as Node).label.trim().toLowerCase());
        const targetNode = typeof rel.target === 'string'
          ? labelToNode.get((nodes.find(n => n.id === rel.target)?.label || '').trim().toLowerCase())
          : labelToNode.get((rel.target as Node).label.trim().toLowerCase());
        return {
          ...rel,
          source: sourceNode,
          target: targetNode
        };
      }).filter(rel => rel.source && rel.target) as Relationship[];
      // 统计每个实体节点被多少博客节点关联（在去重后进行）
      const blogNodeIds = new Set(uniqueNodes.filter(n => n.type === 'blog').map(n => n.id));
      const entityBlogCount: Record<string, number> = {};
      relationships.forEach(rel => {
        const source = rel.source as Node;
        const target = rel.target as Node;
        if (source && target) {
          if (source.type === 'blog' && target.type !== 'blog') {
            entityBlogCount[target.id] = (entityBlogCount[target.id] || 0) + 1;
          }
          if (target.type === 'blog' && source.type !== 'blog') {
            entityBlogCount[source.id] = (entityBlogCount[source.id] || 0) + 1;
          }
        }
      });
      // 只保留被多个博客节点关联的实体节点
      const filteredEntityIds = Object.entries(entityBlogCount)
        .filter(([id, count]) => count >= 2)
        .map(([id]) => id);
      // 只保留博客节点和被多个博客节点关联的实体节点
      const filteredNodes = uniqueNodes.filter(n =>
        n.type === 'blog' || filteredEntityIds.includes(n.id)
      );
      // 只保留与这些节点相关的关系
      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredRelationships = relationships.filter(rel => {
        const source = rel.source as Node;
        const target = rel.target as Node;
        if (!source || !target) return false;
        const sourceId = source.id;
        const targetId = target.id;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });
      // 调试：打印关系数据
      console.log('filteredRelationships', filteredRelationships);
      // 完全重写初始布局策略，使用网格初始布局
      const gridSize = Math.ceil(Math.sqrt(filteredNodes.length));
      const gridStep = 150; // 网格单元大小
      const gridOffsetX = -((gridSize - 1) * gridStep) / 2;
      const gridOffsetY = -((gridSize - 1) * gridStep) / 2;
      filteredNodes.forEach((node, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const jitter = 20;
        node.x = gridOffsetX + col * gridStep + (Math.random() - 0.5) * jitter;
        node.y = gridOffsetY + row * gridStep + (Math.random() - 0.5) * jitter;
      });

      // 创建力导向布局，完全重新平衡力的配置
      simulationRef.current = d3.forceSimulation<Node>(filteredNodes)
        .force('link', d3.forceLink<Node, Relationship>(filteredRelationships)
          .id(d => d.id)
          .distance(d => {
            const source = d.source as Node;
            const target = d.target as Node;
            const baseDistance = 180;
            if (source.type === 'blog' || target.type === 'blog') {
              return baseDistance * 1.3;
            }
            return baseDistance;
          }))
        .force('charge', d3.forceManyBody()
          .strength((d) => {
            // 类型断言，告诉TypeScript这是Node类型
            const node = d as unknown as Node;
            return node.type === 'blog' ? -2000 : -1500;
          })
          .distanceMax(1000) // 增大最大作用距离
          .theta(0.8)) // 优化Barnes-Hut近似算法参数
        .force('center', d3.forceCenter(0, 0).strength(0.02)) // 进一步减弱中心力
        .force('collide', d3.forceCollide<Node>()
          .radius((d) => {
            // 类型断言，告诉TypeScript这是Node类型
            const node = d as unknown as Node;
            return node.type === 'blog' ? 80 : 60;
          })
          .iterations(3) // 增加碰撞检测迭代次数，提高精度
          .strength(1)) // 最大碰撞强度
        .force('x', d3.forceX(0).strength(0.03)) // 添加水平方向力
        .force('y', d3.forceY(0).strength(0.03)) // 添加垂直方向力
        .alpha(0.3) // 降低初始温度，减少剧烈运动
        .alphaDecay(0.003) // 更慢的冷却速度
        .velocityDecay(0.5); // 减小速度衰减，允许节点移动更远
        // 移除.stop()使模拟器继续运行

      // 手动运行模拟一定次数以获得更好的初始布局
      for (let i = 0; i < 100; i++) {
        simulationRef.current.tick();
      }

      // 创建连接线并设置动态更新位置
      const link = g.selectAll('.link')
        .data(filteredRelationships)
        .join('line')
        .attr('class', 'link')
        .attr('stroke', '#1976d2')
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 1)
        .attr('stroke-linecap', 'round')
        .attr('pointer-events', 'all')
        .attr('visibility', 'visible')
        .on('mouseover', function(event, d: Relationship) {
          event.stopPropagation(); // 阻止事件冒泡
          d3.select(this)
            .transition()
            .duration(200)
            .style('stroke-opacity', 0.9)
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
            return importantLinksRef.current.includes(rel) ? 0.6 : 0.3;
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

      // 创建节点组 - 不再设置固定位置，让模拟器动态更新
      const node = g.selectAll<SVGGElement, Node>('.node')
        .data(filteredNodes)
        .join('g')
        .attr('class', 'node')
        .call(d3.drag<SVGGElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
        );

      // 添加节点圆圈
      node.append('circle')
        .attr('r', (d: Node) => d.type === 'blog' ? 10 : 6) // 博客节点更大
        .style('fill', (d: Node) => getNodeColor(d))
        .style('stroke', '#222')
        .style('stroke-width', 1.5)
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
              return importantLinksRef.current.includes(rel) ? 0.4 : 0;
            });
            
            // 恢复所有节点大小
            node.selectAll('circle')
              .style('r', (d: any) => {
                // 保持中心节点大小
                const nodeData = d as Node;
                return nodeData.type === 'blog' ? 10 : 6;
              })
              .style('opacity', 0.8);
          } else {
            // 选择新节点
            setSelectedNode(clickedNodeId);
            
            // 找出与当前节点相关的所有连线
            const relatedLinks = relationships.filter(rel => {
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
              return isRelated ? 0.7 : (importantLinksRef.current.includes(rel) ? 0.1 : 0);
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
                const baseRadius = nodeData.type === 'blog' ? 10 : 6;
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
          // 双击事件用于跳转 - 只针对博客节点
          if (d.type === 'blog' && d.properties.url) {
            window.open(d.properties.url, '_blank');
          }
        })
        .on('mouseover', function(event, d: Node) {
          event.stopPropagation(); // 阻止事件冒泡
          
          // 保存原始半径以便恢复
          const baseRadius = d.type === 'blog' ? 10 : 6;
          
          // 高亮当前节点
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', baseRadius * 1.5)
            .style('opacity', 1);
          
          // 找出与当前节点相关的所有连线
          const nodeId = d.id;
          const relatedLinks = relationships.filter(rel => {
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
            const nodeBaseRadius = nodeData.type === 'blog' ? 10 : 6;
            return nodeBaseRadius * 1.2;
          })
          .style('opacity', 0.9);
          
          if (tooltipRef.current) {
            let tooltipContent = `<strong>${d.label}</strong><br/>`;
            
            // 博客节点
            if (d.type === 'blog') {
              tooltipContent += `
                ${d.properties.summary}<br/>
                <span style="font-size:10px;color:#aaa">类别: ${d.properties.category}</span><br/>
                <span style="font-size:10px;color:#aaa">双击: 查看博客</span>
              `;
            } 
            // 知识节点
            else {
              tooltipContent += `
                ${d.properties.summary}<br/>
                <span style="font-size:10px;color:#aaa">类型: ${d.type}</span><br/>
                <span style="font-size:10px;color:#aaa">单击: 显示关系</span>
              `;
            }
            
            tooltipRef.current
              .style('opacity', .9)
              .html(tooltipContent)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          }
        })
        .on('mouseout', function(event, d: Node) {
          const clickedNodeId = selectedNode;
          const baseRadius = d.type === 'blog' ? 10 : 6;
          
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
            return nodeData.type === 'blog' ? 10 : 6;
          })
          .style('opacity', 0.8);
          
          // 如果没有选中节点，则恢复所有连线样式
          if (!clickedNodeId) {
            // 恢复连线样式
            link.transition()
              .duration(200)
              .style('stroke-opacity', (l: any) => {
                const linkData = l as Relationship;
                return importantLinksRef.current.includes(linkData) ? 0.4 : 0.3;
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

      // 添加节点图标 - 为博客节点添加特殊图标
      node.filter((d: Node) => d.type === 'blog')
        .append('text')
        .attr('dx', 0)
        .attr('dy', 3)
        .attr('text-anchor', 'middle')
        .style('font-family', 'FontAwesome')
        .style('font-size', '10px')
        .style('fill', '#fff')
        .text('\uf15c'); // 文档图标

      // 优化节点标签，增加文本背景以提高可读性
      node.append('text')
        .attr('dx', (d: Node) => d.type === 'blog' ? 15 : 8)
        .attr('dy', '.35em')
        .text((d: Node) => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label)
        .style('font-size', '20px')
        .style('font-weight', '900')
        .style('fill', '#222')
        .style('stroke', '#fff')
        .style('stroke-width', '3px')
        .style('paint-order', 'stroke')
        .style('opacity', 1)
        .style('pointer-events', 'none');

      // 设置力模拟的tick事件，动态更新节点和连线位置
      simulationRef.current.on('tick', () => {
        link
          .attr('x1', d => (typeof d.source === 'object' ? d.source.x || 0 : 0))
          .attr('y1', d => (typeof d.source === 'object' ? d.source.y || 0 : 0))
          .attr('x2', d => (typeof d.target === 'object' ? d.target.x || 0 : 0))
          .attr('y2', d => (typeof d.target === 'object' ? d.target.y || 0 : 0));

        node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
      });

      // 设置提示框样式，确保在暗色主题下可见
      if (tooltipRef.current) {
        tooltipRef.current
          .style('background-color', 'rgba(30, 30, 30, 0.9)')
          .style('color', '#ffffff')
          .style('border', '1px solid #555')
          .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)');
      }

      // 更新节点和关系计数
      setNodeCount(filteredNodes.length);
      setRelationshipCount(filteredRelationships.length);

      // 设置加载完成
      setIsLoading(false);

      // 搜索功能修正：同步当前渲染节点
      nodesRef.current = filteredNodes;
      linksRef.current = filteredRelationships;
    } catch (error) {
      console.error('获取知识图谱数据失败:', error);
    }
  }, [selectedNode]);

  useEffect(() => {
    renderGraph();
  }, [activeTab, renderGraph]);

  // 获取节点颜色
  const getNodeColor = (node: Node) => {
    if (node.type === 'blog') return '#FF5722';
    
    const type = node.type.toLowerCase().trim();
    const category = (node.properties.category || '其他').toLowerCase().trim();
    
    return TYPE_COLORS[type] || CATEGORY_COLORS[category] || '#3498DB';
  };

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
    <div className="flex flex-col items-center gap-1">
      
      <div className="relative w-[80vw] h-[80vh] bg-background border border-border rounded-md overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-foreground text-xl">加载知识图谱中...</div>
          </div>
        )}
        <div className="absolute top-4 left-4 z-10 bg-background/80 p-2 rounded-md text-xs">
          <span className="font-medium">统计:</span> {nodeCount} 个节点 / {relationshipCount} 个关系
          <div className="text-xs text-muted-foreground mt-1">
            <span className="inline-block w-3 h-3 bg-[#FF5722] rounded-full mr-1"></span> 博客节点
            <span className="inline-block w-3 h-3 bg-[#4ECDC4] rounded-full ml-2 mr-1"></span> 知识节点
          </div>
        </div>
        <div className="absolute bottom-4 right-4 bg-background/80 p-3 rounded-md shadow-md z-10 text-xs">
          <div className="font-medium mb-1">操作说明:</div>
          <div>• 鼠标悬停在节点或连线上可查看详情</div>
          <div>• 单击节点可显示所有相关关系</div>
          <div>• 双击博客节点可跳转到博客页面</div>
          <div>• 点击空白处可恢复默认视图</div>
          <div>• 滚轮可缩放图谱</div>
          <div>• 拖动可平移视图</div>
        </div>
        <svg ref={svgElementRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
} 