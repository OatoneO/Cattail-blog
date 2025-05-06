import { Github, Linkedin, Mail } from "lucide-react";
import SocialMediaLink from "./SocialMediaLink";

function Socials() {
  return (
    <div className="flex gap-6 ">
      {/* <SocialMediaLink link="https://www.linkedin.com/in/zhihao-lin1/">
        <Linkedin />
      </SocialMediaLink> */}
      <SocialMediaLink link="https://github.com/OatoneO">
        <Github />
      </SocialMediaLink>
      {/* <SocialMediaLink link="mailto:lzh910954163@gmail.com">
        <Mail />
      </SocialMediaLink> */}
    </div>
  );
}

export default Socials;
