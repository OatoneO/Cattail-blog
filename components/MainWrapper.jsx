"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }) {
  const pathname = usePathname();
  const page = pathname.split("/").slice(0, 2).join("/");
  return (
    <main
      className={`duration-1000 w-full  ${page == "/" ? "translate-y-20 mt-20 mb-20" : "mt-16"} min-h-[calc(100svh-350px)]`}
    >
      {children}
    </main>
  );
}
