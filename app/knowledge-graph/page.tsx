import KnowledgeGraph from '@/components/common/KnowledgeGraph';

export default function KnowledgeGraphPage() {
  console.log('知识图谱页面正在加载...');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">知识图谱</h1>
      <KnowledgeGraph />
    </div>
  );
} 