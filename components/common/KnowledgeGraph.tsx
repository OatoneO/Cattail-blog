'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;  // 现在只有两种类型：'blog' 和 'entity'
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

// 简化节点颜色映射，只区分博客和实体两种类型
const TYPE_COLORS: Record<string, string> = {
  'blog': '#FF5722',  // 博客节点为橙色
  'entity': '#4ECDC4' // 实体节点为青色
};

// 移除不需要的类别颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  '前端': '#45B7D1',
  '后端': '#9B59B6',
  '数据库': '#E67E22',
  '工具': '#2ECC71',
  '其他': '#3498DB'
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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [relationshipCount, setRelationshipCount] = useState(0);
  const filteredNodesRef = useRef<Node[]>([]);
  const filteredRelationshipsRef = useRef<Relationship[]>([]);

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
      console.log('原始知识图谱数据:', data);
      console.log('原始节点数量:', data.nodes?.length || 0);
      console.log('原始关系数量:', data.relationships?.length || 0);
      
      // 统计节点类型分布
      const typeCount: Record<string, number> = {};
      data.nodes?.forEach(node => {
        typeCount[node.type] = (typeCount[node.type] || 0) + 1;
      });
      console.log('节点类型分布:', typeCount);

      if (!data.nodes || data.nodes.length === 0) {
        setIsLoading(false); // 数据为空时直接结束加载
        setError('没有找到任何知识图谱数据');
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

      // 处理关系数据，确保source/target正确引用节点对象
      const idToNode = new Map(uniqueNodes.map(n => [n.id, n]));
      const relationships = data.relationships.filter(rel => {
        const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
        const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
        return idToNode.has(sourceId) && idToNode.has(targetId);
      }).map(rel => {
        const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
        const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
        return {
          ...rel,
          source: idToNode.get(sourceId),
          target: idToNode.get(targetId)
        };
      }) as Relationship[];

      // 筛选出所有博客节点 - 确保博客节点都被包含，无论它们的关系如何
      const blogNodes = uniqueNodes.filter(node => node.type === 'blog');
      console.log('所有博客节点:', blogNodes.map(n => n.label));
      const blogNodeIds = new Set(blogNodes.map(node => node.id));
      
      // 统计每个实体节点与多少个博客节点有关联
      const entityToBlogCount: Record<string, number> = {};
      const entityNodes = uniqueNodes.filter(node => node.type === 'entity');
      
      // 初始设置所有实体节点的连接计数为0
      entityNodes.forEach(node => {
        entityToBlogCount[node.id] = 0;
      });
      
      // 统计实体节点与博客节点的连接数
      relationships.forEach(rel => {
        const source = rel.source as Node;
        const target = rel.target as Node;
        
        // 如果一端是博客节点，另一端是实体节点，则增加计数
        if (source.type === 'blog' && target.type === 'entity') {
          entityToBlogCount[target.id] = (entityToBlogCount[target.id] || 0) + 1;
        }
        if (target.type === 'blog' && source.type === 'entity') {
          entityToBlogCount[source.id] = (entityToBlogCount[source.id] || 0) + 1;
        }
      });
      
      // 筛选出与多个博客节点相关的实体节点（至少与2个博客相关）
      const MIN_BLOG_CONNECTIONS = 2;  // 严格要求至少与2个博客节点有关系
      const importantEntityIds = Object.entries(entityToBlogCount)
        .filter(([_, count]) => count >= MIN_BLOG_CONNECTIONS)
        .map(([id]) => id);
      
      // 合并博客节点和重要实体节点 - 确保包含所有8个博客节点
      const filteredNodes = uniqueNodes.filter(node => 
        node.type === 'blog' || importantEntityIds.includes(node.id)
      );
      
      // 只保留这些节点之间的关系
      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredRelationships = relationships.filter(rel => {
        const source = rel.source as Node;
        const target = rel.target as Node;
        return filteredNodeIds.has(source.id) && filteredNodeIds.has(target.id);
      });
      
      // 输出更详细的过滤信息
      console.log('博客节点数量:', blogNodes.length, '博客节点ID:', Array.from(blogNodeIds));
      console.log('实体节点与博客连接统计:', entityToBlogCount);
      console.log('多连接实体节点数量:', importantEntityIds.length);
      console.log('多连接实体节点ID:', importantEntityIds);
      console.log('过滤后的节点数量:', filteredNodes.length, '其中博客节点:', blogNodes.length, '实体节点:', filteredNodes.length - blogNodes.length);
      console.log('过滤后的关系数量:', filteredRelationships.length);
      
      // 如果没有找到合适的节点，显示警告
      if (filteredNodes.length === 0) {
        setIsLoading(false);
        setError("没有找到符合条件的节点，请检查知识图谱生成是否成功");
        return;
      }

      // 打印节点标签以便检查
      console.log('节点标签:', filteredNodes.map(n => `${n.id} (${n.type}): ${n.label}`).slice(0, 20)); // 限制输出数量
      
      // 完全重写初始布局策略，根据节点类型设置不同的布局
      const blogNodesFiltered = filteredNodes.filter(n => n.type === 'blog');
      const entityNodesFiltered = filteredNodes.filter(n => n.type === 'entity');
      
      // 使用力导向布局初始化节点位置
      const forceX = d3.forceX(0).strength(0.05);
      const forceY = d3.forceY(0).strength(0.05);
      
      // 为不同类型的节点设置不同的初始位置
      const blogRadius = Math.max(200, blogNodesFiltered.length * 40);
      const angleStep = (2 * Math.PI) / blogNodesFiltered.length;
      
      // 将博客节点放置在一个圆上
      blogNodesFiltered.forEach((node, i) => {
        const angle = i * angleStep;
        node.x = Math.cos(angle) * blogRadius;
        node.y = Math.sin(angle) * blogRadius;
      });
      
      // 实体节点放在中间位置，稍后让力导向布局调整
      entityNodesFiltered.forEach((node) => {
        node.x = (Math.random() - 0.5) * 400;
        node.y = (Math.random() - 0.5) * 400;
      });

      // 创建力导向布局，完全重新平衡力的配置
      simulationRef.current = d3.forceSimulation<Node>(filteredNodes)
        .force('link', d3.forceLink<Node, Relationship>(filteredRelationships)
          .id(d => d.id)
          .distance(d => {
            const source = d.source as Node;
            const target = d.target as Node;
            // 博客节点之间的距离更大
            if (source.type === 'blog' && target.type === 'blog') {
              return 300;
            }
            // 博客节点和实体节点之间的距离
            if (source.type === 'blog' || target.type === 'blog') {
              return 150;
            }
            // 实体节点之间的距离
            return 100;
          }))
        .force('charge', d3.forceManyBody()
          .strength((d) => {
            // 类型断言，告诉TypeScript这是Node类型
            const node = d as unknown as Node;
            return node.type === 'blog' ? -2000 : -800;
          })
          .distanceMax(1000)) // 增大最大作用距离
        .force('center', d3.forceCenter(0, 0).strength(0.02)) // 进一步减弱中心力
        .force('collide', d3.forceCollide<Node>()
          .radius((d) => {
            // 类型断言，告诉TypeScript这是Node类型
            const node = d as unknown as Node;
            return node.type === 'blog' ? 80 : 40;
          })
          .iterations(3)) // 增加碰撞检测迭代次数，提高精度
        .force('x', forceX) // 添加水平方向力
        .force('y', forceY) // 添加垂直方向力
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
            return 0.3; // 默认所有关系线透明度一致
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

      // 鼠标悬浮高亮相关连线和节点
      node.append('circle')
        .attr('r', (d: Node) => d.type === 'blog' ? 12 : 6)
        .style('fill', (d: Node) => getNodeColor(d))
        .style('stroke', '#222')
        .style('stroke-width', 1.5)
        .style('opacity', 0.8)
        .on('mouseover', function(event, d: Node) {
          event.stopPropagation();
          // 高亮当前节点
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d.type === 'blog' ? 18 : 10)
            .style('opacity', 1);
          // 高亮相关连线
          link.transition().duration(200)
            .style('stroke-opacity', (l: any) => {
              const rel = l as Relationship;
              const source = rel.source as Node;
              const target = rel.target as Node;
              return (source.id === d.id || target.id === d.id) ? 0.9 : 0.05;
            })
            .style('stroke-width', (l: any) => {
              const rel = l as Relationship;
              const source = rel.source as Node;
              const target = rel.target as Node;
              return (source.id === d.id || target.id === d.id) ? 3 : 1;
            });
          // 高亮相关节点
          const relatedNodeIds = new Set<string>();
          filteredRelationships.forEach(rel => {
            const source = rel.source as Node;
            const target = rel.target as Node;
            if (source.id === d.id) relatedNodeIds.add(target.id);
            if (target.id === d.id) relatedNodeIds.add(source.id);
          });
          node.selectAll('circle').transition().duration(200)
            .attr('r', (n: any) => {
              const nodeData = n as Node;
              const baseRadius = nodeData.type === 'blog' ? 12 : 6;
              return nodeData.id === d.id ? baseRadius * 1.5 :
                (relatedNodeIds.has(nodeData.id) ? baseRadius * 1.2 : baseRadius);
            })
            .style('opacity', (n: any) => {
              const nodeData = n as Node;
              return nodeData.id === d.id ? 1 :
                (relatedNodeIds.has(nodeData.id) ? 0.9 : 0.2);
            });
          // tooltip
          if (tooltipRef.current) {
            let tooltipContent = `<strong>${d.label}</strong><br/>`;
            if (d.type === 'blog') {
              tooltipContent += `
                ${d.properties.summary || '暂无摘要'}<br/>
                <span style="font-size:10px;color:#aaa">类别: ${d.properties.category || '未分类'}</span><br/>
                <span style="font-size:10px;color:#aaa">双击: 查看博客</span>
              `;
            } else {
              tooltipContent += `
                <span style=\"font-size:10px;color:#aaa\">概念类型: 实体</span><br/>
                <span style=\"font-size:10px;color:#aaa\">悬停: 高亮关系</span>
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
          // 恢复节点和连线样式
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d.type === 'blog' ? 12 : 6)
            .style('opacity', 0.8);
          link.transition().duration(200)
            .style('stroke-opacity', 0.3)
            .style('stroke-width', 1.5);
          node.selectAll('circle').transition().duration(200)
            .attr('r', (n: any) => n.type === 'blog' ? 12 : 6)
            .style('opacity', 0.8);
          if (tooltipRef.current) {
            tooltipRef.current.transition().duration(500).style('opacity', 0);
          }
        })
        .on('dblclick', function(event, d: Node) {
          event.stopPropagation();
          if (d.type === 'blog' && d.properties.url) {
            let url = d.properties.url;
            if (url.startsWith('/')) {
              url = window.location.origin + url;
            }
            console.log('跳转到', url);
            window.open(url, '_blank');
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

      // 为实体节点添加不同的图标
      node.filter((d: Node) => d.type === 'entity')
        .append('text')
        .attr('dx', 0)
        .attr('dy', 3)
        .attr('text-anchor', 'middle')
        .style('font-family', 'FontAwesome')
        .style('font-size', '8px')
        .style('fill', '#fff')
        .text('\uf02d'); // 书本图标

      // 添加SVG背景点击事件，用于取消选择
      svg.on('click', function() {
        // 如果有选中的节点，则取消选择
        if (selectedNode) {
          setSelectedNode(null);
          
          // 恢复所有连线样式
          link.transition()
            .duration(200)
            .style('stroke-opacity', 0.3)
            .style('stroke-width', 1.5);
            
          // 恢复所有节点样式  
          node.selectAll('circle')
            .transition()
            .duration(200)
            .attr('r', (d: any) => {
              const nodeData = d as Node;
              return nodeData.type === 'blog' ? 12 : 6;
            })
            .style('opacity', 0.8);
        }
      });

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

      // 记录过滤后的节点和关系，以便在组件内其他位置使用
      filteredNodesRef.current = filteredNodes;
      filteredRelationshipsRef.current = filteredRelationships;
      
      // 更新节点和关系计数
      setNodeCount(filteredNodes.length);
      setRelationshipCount(filteredRelationships.length);

      // 设置加载完成
      setIsLoading(false);
    } catch (error) {
      console.error('获取知识图谱数据失败:', error);
      setError('获取知识图谱数据失败，请刷新页面重试');
      setIsLoading(false);
    }
  }, [selectedNode]);

  useEffect(() => {
    renderGraph();
    
    // 清理函数，移除tooltip
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
      }
    };
  }, [renderGraph]);

  // 简化节点颜色获取函数
  const getNodeColor = (node: Node) => {
    if (node.type === 'blog') return TYPE_COLORS['blog'];
    return TYPE_COLORS['entity'] || '#3498DB'; // 默认为蓝色
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[80vw] h-[80vh] bg-background border border-border rounded-md overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-foreground text-xl">加载知识图谱中...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-red-500 text-xl">{error}</div>
          </div>
        )}
        <div className="absolute top-4 left-4 z-10 bg-background/80 p-2 rounded-md text-xs">
          <span className="font-medium">统计:</span> {nodeCount} 个节点 / {relationshipCount} 个关系
          <div className="text-xs text-muted-foreground mt-1">
            <span className="inline-block w-3 h-3 bg-[#FF5722] rounded-full mr-1"></span> 博客节点
            <span className="inline-block w-3 h-3 bg-[#4ECDC4] rounded-full ml-2 mr-1"></span> 实体节点
          </div>
        </div>
        <div className="absolute bottom-4 right-4 bg-background/80 p-3 rounded-md shadow-md z-10 text-xs">
          <div className="font-medium mb-1">操作说明:</div>
          <div>• 鼠标悬停在节点或连线上可高亮关系</div>
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