"use client";

import { useRouter, usePathname } from "next/navigation";

// AdminLayout 现在只负责检查路径，如果需要，可以添加特定于管理区域的容器或样式
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // 中间件应该处理认证和重定向，这里可以简化或移除
  // if (!pathname.startsWith("/admin")) {
  //   router.push("/sign-in"); // 或者根据中间件的行为调整
  //   return null;
  // }

  // 可以保留一个简单的容器，或者直接渲染children
  return <div className="w-full pt-16">{children}</div>;
} 