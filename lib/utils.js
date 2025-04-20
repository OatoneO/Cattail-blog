import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "";
  
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("zh-CN", options);
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // 替换空格为-
    .replace(/[^\w\-]+/g, '') // 移除非字母数字字符
    .replace(/\-\-+/g, '-')   // 替换多个-为单个-
    .replace(/^-+/, '')       // 裁剪开头的-
    .replace(/-+$/, '');      // 裁剪结尾的-
}
