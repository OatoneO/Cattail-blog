"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";
import { navigationItems } from "./Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileMenu() {
  const pathname = usePathname();
  const page = pathname.split("/").slice(0, 2)[1];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={(state) => setOpen(state)}>
      <SheetTrigger asChild>
        <Button className="bg-secondary text-muted-foreground shadow-[0_0px_3px_0.5px_#2f2f2f] hover:bg-[#f2f2f20d] rounded-full pr-2">
          <span className="pr-1">
            {pathname === "/" ? "Home" : page[0].toUpperCase() + page.slice(1)}
          </span>
          <ChevronDown size={15} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="mt-10 ml-6 mr-10 border-none text-muted-foreground rounded-xl"
        side="top"
      >
        <ul className="flex flex-col pl-5 mt-5 space-y-1">
          {navigationItems.map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                className={cn(
                  pathname === item.href ? "font-bold" : "",
                  "flex items-center py-3"
                )}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
