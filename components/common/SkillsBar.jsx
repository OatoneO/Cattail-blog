import CSSIcon from "@/public/icons/CSSIcon";
import ExpressIcon from "@/public/icons/ExpressIcon";
import HtmlIcon from "@/public/icons/HtmlIcon";
import JavaIcon from "@/public/icons/JavaIcon";
import JSIcon from "@/public/icons/JSIcon";
import MySQLIcon from "@/public/icons/MySQLIcon";
import NextIcon from "@/public/icons/NextIcon";
import NodeIcon from "@/public/icons/NodeIcon";
import PrismaIcon from "@/public/icons/PrismaIcon";
import ReactIcon from "@/public/icons/ReactIcon";
import TailwindIcon from "@/public/icons/TailwindIcon";
import ViteIcon from "@/public/icons/ViteIcon";

export default function SkillsBar() {
  return (
    <div className="flex flex-col w-full gap-6 px-6 py-4 shadow-[0_0px_1.2px_rgb(140,140,140)] rounded-lg ">
      <h2 className="text-lg text-muted-foreground">
        ⚙️ <span className="text-muted-foreground">技术栈</span>
      </h2>
      <div className="flex flex-col items-center justify-center gap-5">
        <div className="flex justify-between w-full">
          <HtmlIcon className="skillsIcon" />
          <CSSIcon className="skillsIcon" />
          <JSIcon className="skillsIcon" />
          <ReactIcon className="skillsIcon" />
          <ViteIcon className="skillsIcon" />
          <TailwindIcon className="skillsIcon" />

        </div>
        <div className="flex justify-between w-full">
          <NodeIcon className="skillsIcon" />
          <NextIcon className="skillsIcon" />
          <JavaIcon className="skillsIcon" />
          <MySQLIcon className="skillsIcon" />
          <PrismaIcon className="skillsIcon" />
          <ExpressIcon className="skillsIcon" />
        </div>
      </div>
    </div>
  );
}
