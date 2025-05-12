import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from "@/components/ui/timeline";

const careerData = [
  {
    year: "2025-03",
    title: "WEB前端开发工程师",
    company: "汇川技术——实习",
    description: "了解FlowGram.AI插件化构建流程引擎，负责InoCube平台逻辑编辑器和流程编辑器的组件开发"
  },
  {
    year: "2024-10",
    title: "前端开发工程师",
    company: "江苏先维技术有限公司——实习",
    description: "参与公司主要产品和脚手架的前端开发，负责产品迭代和维护。"
  },
  {
    year: "2024-06",
    title: "助理应用软件工程师",
    company: "VIVO——实习",
    description: "了解智能编程产品业务流程和使用痛点，参与智能编程产品更新换代。"
  }
];

export default function Career() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="ml-2 text-lg text-muted-foreground">💼  职业生涯</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline className="space-y-6">
          {careerData.map((item, index) => (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineDot className="bg-primary ring-4 ring-primary/20" />
                {index !== careerData.length - 1 && (
                  <TimelineConnector className="my-2" />
                )}
              </TimelineSeparator>
              <TimelineContent>
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.year}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.company}
                    </span>
                  </div>
                  <h4 className="mt-2 text-lg font-semibold">{item.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
} 