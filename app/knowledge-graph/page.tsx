import KnowledgeGraph from '@/components/KnowledgeGraph';

export default function KnowledgeGraphPage() {
  console.log('知识图谱页面正在加载...');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-400px)] py-4">
      <KnowledgeGraph />
    </div>
  );
} 