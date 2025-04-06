import MotionDivWrapper from "@/components/MotionDivWrapper";
// import { getBlogs } from "@/lib/blog";
import Hero from "@/components/Hero";
import SkillsBar from "@/components/SkillsBar";
import RecentUpdate from "@/components/RecentUpdate";
import BasisInfo from "@/components/BasicInfo";
// import Spotify from "@/components/Spotify";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Page() {
  // 使用模拟数据替代数据库数据
  const mockBlogs = [
    {
      title: "示例博客 1",
      description: "这是一个示例博客描述",
      date: "2024-03-10",
      slug: "example-1"
    },
    {
      title: "示例博客 2",
      description: "这是另一个示例博客描述",
      date: "2024-03-09",
      slug: "example-2"
    },
    {
      title: "示例博客 3",
      description: "这是第三个示例博客描述",
      date: "2024-03-08",
      slug: "example-3"
    }
  ];
  const recentBlogs = mockBlogs.slice(0, 3);

  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <section className="w-full mb-20 lg:w-2/3 min-h-[calc(100svh-500px)] flex items-center gap-20">
        <Hero />
      </section>

      <section className="relative flex flex-col justify-between w-full gap-10 lg:flex-row">
        <div className="w-full">
          <RecentUpdate blogs={recentBlogs} isHome={true} />
        </div>

        <aside className="lg:w-[680px] w-full lg:sticky lg:h-fit lg:-top-10 flex flex-col gap-12 rounded-2xl ">
          <BasisInfo />
          <SkillsBar />
          <Suspense fallback={<Skeleton />}>
            {/* <Spotify /> */}
          </Suspense>
        </aside>
      </section>
    </MotionDivWrapper>
  );
}
