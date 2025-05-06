import HeroAnimation from "./HeroAnimation";
import Socials from "./Socials";

export default function Hero() {
  return (
    <div>
      <p className="mb-6 font-semibold">
        <span className="text-transparent sm:bg-gradient-to-r to-foreground bg-gradient-to-t from-muted-foreground bg-clip-text lg:text-[54px] text-[40px]">
          Hi, I&apos;m Cattail
        </span>
      </p>
      <div className="h-10 mb-8 sm:mb-10">
        <HeroAnimation text1={"<Developer />"} text2="<Student />" />
      </div>
      <p className="mb-8 text-xl text-transparent sm:mb-10 sm:text-[26px] bg-gradient-to-r from-green-200 via-green-100 opacity-60 to-green-200 bg-clip-text w-fit">
        #Frontend #Backend #Fullstack
      </p>

      <p className="mb-4 text-sm text-transparent sm:mb-6 sm:text-base bg-gradient-to-b to-muted-foreground from-foreground bg-clip-text">
        I&apos;m an undergraduate student at NJTECH 
        <br />
        majoring in Computer Science and Technology.
        <br />
        Passionate about developing applications
      </p>

      <Socials />
    </div>
  );
}
