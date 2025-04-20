"use client";

import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
// import Navbar from "./Navbar"; // Removed Navbar import
import SignInAndOut from "./SignIn";
import GithubIcon from "@/public/icons/GithubIcon";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const page = pathname.split("/").slice(0, 2).join("/");

  return (
    // Adjusted grid columns as Navbar is removed
    <header className="grid w-full grid-flow-col grid-cols-2 sm:grid-cols-[auto_1fr] gap-4 items-center mb-4">
      {/* Avatar now takes the first column */}
      <Avatar page={page} />

      {/* Navbar removed from here */}

      {/* Links and Sign in/out moved to the second column, aligned right */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="https://github.com/OatoneO/Cattail-blog.git"
          target="_blank"
          className="opacity-80 hover:opacity-100"
        >
          <GithubIcon />
        </Link>
        <SignInAndOut pathname={pathname} />
      </div>
    </header>
  );
}
