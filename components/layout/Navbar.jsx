"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { GithubIcon } from "lucide-react";
import SocialMediaLink from "@/components/common/SocialMediaLink";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  const navigationItems = [
    { href: "/", key: "home", label: "主页" },
    { href: "/blog", key: "blog", label: "博客" },
    { href: "/project", key: "project", label: "项目" },
    { href: "/knowledge-graph", key: "knowledgeGraph", label: "知识图谱" },
    { href: "/message", key: "messageBoard", label: "留言板" },
  ];

  const adminNavigationItems = [
    { href: "/admin/blogs", key: "adminBlogs", label: "博客管理" },
    { href: "/admin/projects", key: "adminProjects", label: "项目管理" },
  ];

  const allNavItems = isSignedIn ? [...navigationItems, ...adminNavigationItems] : navigationItems;

  return (
    <nav className="z-20 container inset-x-0 top-0 bg-background/80 backdrop-blur border-b border-border py-2 mb-4">
      <div className="flex justify-between items-center">
        {/* Logo or Site Name */}
        <Link href="/" className="text-lg font-bold text-primary">
          Cattail
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center bg-secondary/50 rounded-full h-12 px-2 shadow-sm">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "transition-colors text-sm font-medium hover:text-primary px-4 py-2 rounded-full",
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-foreground/80"
              )}
            >
              {item.label}
            </Link>
          ))}
          {isSignedIn && adminNavigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "transition-colors text-sm font-medium hover:text-primary px-4 py-2 rounded-full",
                pathname.startsWith(item.href) ? "bg-blue-600 text-white" : "text-blue-400"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side: Links, Theme Toggle, Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* GitHub Link for Desktop */}
          <div className="hidden md:block">
            <UserButton />
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <MobileMenu navItems={allNavItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}
