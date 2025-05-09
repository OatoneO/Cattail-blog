import MotionDivWrapper from "@/components/common/MotionDivWrapper";
import { getAllBlogs } from "@/lib/db/blog-service";
import Hero from "@/components/common/Hero";
import SkillsBar from "@/components/common/SkillsBar";
import RecentUpdate from "@/components/common/RecentUpdate";
import BasisInfo from "@/components/common/BasicInfo";
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

  return (
    <MotionDivWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }} // 减少动画时间为0.5秒
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
