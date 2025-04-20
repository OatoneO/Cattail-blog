"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }) {
  const pathname = usePathname();
  return (
    <main
      className={`duration-1000 w-full  ${pathname === "/" ? "translate-y-20 mt-20 mb-20" : "mt-16"} min-h-[calc(100svh-350px)]`}
    >
      {children}
    </main>
  );
}
