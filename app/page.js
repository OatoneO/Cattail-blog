import MotionDivWrapper from "@/components/common/MotionDivWrapper";
import { getAllBlogs } from "@/lib/db/blog-service";
import { getAllProjects } from "@/lib/db/project-service";
import Hero from "@/components/common/Hero";
import SkillsBar from "@/components/common/SkillsBar";
import RecentUpdate from "@/components/common/RecentUpdate";
import BasisInfo from "@/components/common/BasicInfo";
import TagCloudComponent from "@/components/common/TagCloud";
import Career from "@/components/common/Career";
// import Spotify from "@/components/common/Spotify";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Page() {
  // 获取博客数据
  const blogs = await getAllBlogs();
  const recentBlogs = blogs.slice(0, 3).map(blog => ({
    ...blog,
    image: blog.images?.[0]?.url || '/images/loading.jpg'
  }));

  // 获取项目数据
  const projects = await getAllProjects();

  // 统计标签
  const tagCounts = new Map();

  // 统计博客标签
  blogs.forEach(blog => {
    const tag = blog.tag;
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });

  // 统计项目标签
  projects.forEach(project => {
    if (Array.isArray(project.technologies)) {
      project.technologies.forEach(tech => {
        tagCounts.set(tech, (tagCounts.get(tech) || 0) + 1);
      });
    }
  });

  // 转换为标签云需要的格式
  const tags = Array.from(tagCounts.entries()).map(([value, count]) => ({
    value,
    count: count * 5 // 放大计数以增加视觉效果
  }));

  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="w-full mb-20 min-h-[calc(100svh-500px)] flex items-center gap-20">
        <div className="w-2/3">
          <Hero />
        </div>
        <div className="w-1/3">
          <Suspense fallback={<Skeleton className="w-full h-[300px]" />}>
            <TagCloudComponent tags={tags} />
          </Suspense>
        </div>
      </section>

      <section className="relative flex flex-col justify-between w-full gap-10 lg:flex-row">
        <div className="w-full">
          <RecentUpdate blogs={recentBlogs} isHome={true} />
        </div>

        <aside className="lg:w-[680px] w-full lg:sticky lg:h-fit lg:-top-10 flex flex-col gap-12 rounded-2xl ">
          <BasisInfo />
          <SkillsBar />
          <Career />
        </aside>
      </section>
    </MotionDivWrapper>
  );
}
