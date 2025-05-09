import { Github, Linkedin, Mail } from "lucide-react";
import SocialMediaLink from "./SocialMediaLink";

function Socials() {
  return (

    
    <div className="flex justify-center items-center gap-1 ">
      <p className="text-center text-sm justify-center ">Follow me on 👉</p>
      <SocialMediaLink link="https://github.com/OatoneO">
        <Github />
      </SocialMediaLink>
    </div>
  );
}

export default Socials;
