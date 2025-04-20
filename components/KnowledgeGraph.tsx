'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';

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
}

interface Relationship {
  source: Node;
  target: Node;
  type: string;
}

interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

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
  const radius = 300;
  const phi = (d.phi || 0) - Math.PI / 2;
  const theta = (d.theta || 0) * 2;
  
  d.x = radius * Math.cos(phi) * Math.cos(theta);
  d.y = radius * Math.cos(phi) * Math.sin(theta);
  d.z = radius * Math.sin(phi);
  
  // 计算透视投影
  const scale = 1000 / (1000 - d.z!);
  return {
    x: d.x * scale,
    y: d.y * scale,
    scale: scale
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
  const [isRotating, setIsRotating] = useState(true);
  const timerRef = useRef<d3.Timer | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Relationship[]>([]);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialRenderRef = useRef(true);

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

  useEffect(() => {
    if (!svgElementRef.current) {
      console.log('SVG 引用未找到，退出渲染');
      return;
    }

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

    console.log('开始设置知识图谱...');
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

    // 创建提示框
    if (tooltipRef.current) {
      tooltipRef.current.remove();
    }
    tooltipRef.current = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border', '1px solid #444')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('max-width', '300px')
      .style('font-size', '12px')
      .style('z-index', '1000');

    // 获取数据并渲染图谱
    console.log('开始获取知识图谱数据...');
    
    // 获取所有类型的数据
    Promise.all([
      fetch('/api/graph-data?type=css').then(res => res.json()),
      fetch('/api/graph-data?type=html').then(res => res.json())
    ])
      .then(([cssData, htmlData]) => {
        console.log('获取到CSS知识图谱数据:', cssData);
        console.log('获取到HTML知识图谱数据:', htmlData);
        
        // 合并所有节点和关系
        const allNodes = [...cssData.nodes, ...htmlData.nodes];
        const allRelationships = [...cssData.relationships, ...htmlData.relationships];
        
        if (!allNodes || allNodes.length === 0) {
          throw new Error('没有找到知识图谱数据');
        }

        // 保存节点和连接数据
        nodesRef.current = allNodes;
        linksRef.current = allRelationships;

        // 初始化节点的球面坐标
        allNodes.forEach((node, i) => {
          const phi = Math.acos(-1 + (2 * i) / allNodes.length);
          const theta = Math.sqrt(allNodes.length * Math.PI) * phi;
          node.phi = phi;
          node.theta = theta;
          const pos = project(node);
          node.x = pos.x;
          node.y = pos.y;
        });

        // 创建连接线
        const link = gRef.current!.selectAll('.link')
          .data(allRelationships)
          .join('line')
          .attr('class', 'link')
          .style('stroke', 'rgba(255, 255, 255, 0.2)')
          .style('stroke-opacity', 0.6)
          .style('stroke-width', 1);

        // 创建节点组
        const node = gRef.current!.selectAll<SVGGElement, Node>('.node')
          .data(allNodes)
          .join('g')
          .attr('class', 'node');

        // 添加节点圆圈
        node.append('circle')
          .attr('r', 6)
          .style('fill', (d, i) => getRandomColor())
          .style('stroke', '#fff')
          .style('stroke-width', 1)
          .style('opacity', 0.8)
          .on('click', (event, d) => {
            event.stopPropagation();
            // 跳转到节点对应的网站
            window.open(d.properties.url, '_blank');
          })
          .on('mouseover', (event, d) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('r', 10)
              .style('opacity', 1);
              
            if (tooltipRef.current) {
              tooltipRef.current.transition()
                .duration(200)
                .style('opacity', .9);
              tooltipRef.current.html(`
                <strong>${d.label}</strong><br/>
                ${d.properties.summary}<br/>
                <a href="${d.properties.url}" target="_blank" style="color: #4ECDC4;">查看详情</a>
              `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('r', 6)
              .style('opacity', 0.8);
              
            if (tooltipRef.current) {
              tooltipRef.current.transition()
                .duration(500)
                .style('opacity', 0);
            }
          });

        // 添加节点标签
        node.append('text')
          .attr('dx', 8)
          .attr('dy', '.35em')
          .text(d => d.label)
          .style('font-size', '10px')
          .style('fill', '#fff')
          .style('opacity', 0.7)
          .style('text-shadow', '0 0 3px rgba(0,0,0,0.5)')
          .style('cursor', 'pointer')
          .on('click', (event, d) => {
            event.stopPropagation();
            // 跳转到节点对应的网站
            window.open(d.properties.url, '_blank');
          });

        // 自动旋转
        const startRotation = () => {
          if (timerRef.current) return;
          
          timerRef.current = d3.timer(() => {
            if (!isRotating) return;
            
            rotationRef.current.x += 0.001;
            rotationRef.current.y += 0.001;

            allNodes.forEach((node, i) => {
              if (node.phi !== undefined && node.theta !== undefined) {
                node.phi = node.phi + 0.001;
                node.theta = node.theta + 0.001;
                const pos = project(node);
                node.x = pos.x;
                node.y = pos.y;
              }
            });

            // 更新节点和连接线位置
            node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
            
            link
              .attr('x1', d => (d.source as Node).x || 0)
              .attr('y1', d => (d.source as Node).y || 0)
              .attr('x2', d => (d.target as Node).x || 0)
              .attr('y2', d => (d.target as Node).y || 0)
              .style('stroke-opacity', d => {
                const sourceZ = (d.source as Node).z || 0;
                const targetZ = (d.target as Node).z || 0;
                return Math.min(1, Math.max(0.1, (1000 - Math.min(sourceZ, targetZ)) / 1000));
              });
          });
        };

        startRotation();

        // 添加初始动画
        node.style('opacity', 0)
          .transition()
          .duration(1000)
          .style('opacity', 1)
          .delay((d, i) => i * 50);

        link.style('opacity', 0)
          .transition()
          .duration(1000)
          .style('opacity', 0.6)
          .delay((d, i) => i * 50);

        // 计算所有节点的边界框
        const bounds = {
          minX: d3.min(allNodes, d => d.x || 0) || 0,
          maxX: d3.max(allNodes, d => d.x || 0) || 0,
          minY: d3.min(allNodes, d => d.y || 0) || 0,
          maxY: d3.max(allNodes, d => d.y || 0) || 0
        };

        // 计算缩放比例以适应所有节点
        const padding = 50; // 边距
        const scaleX = (width - padding * 2) / (bounds.maxX - bounds.minX);
        const scaleY = (height - padding * 2) / (bounds.maxY - bounds.minY);
        const scale = Math.min(scaleX, scaleY);

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
      })
      .catch(error => {
        console.error('获取知识图谱数据失败:', error);
        setError(`获取知识图谱数据失败：${error.message}`);
        setIsLoading(false);
      });

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
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[80vw] max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索节点..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="w-full pl-10 bg-black/50 border-gray-700 text-white placeholder:text-gray-400 rounded-md border border-input px-3 py-2"
        />
      </div>
      <div className="relative w-[80vw] h-[60vh] bg-black" style={{ backgroundImage: 'url(/images/bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="text-white text-xl">加载知识图谱中...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // 重试加载数据
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              重试
            </button>
          </div>
        )}
        <svg ref={svgElementRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
} 