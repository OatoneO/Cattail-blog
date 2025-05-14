import { cn } from "@/lib/utils";

export function Tag({ children, className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
} 