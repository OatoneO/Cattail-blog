import Link from "next/link";

export default function SocialMediaLink({ children, link }) {
  return (
    <Link
      className="flex items-center justify-center w-8 h-8 p-[5px] duration-500 opacity-60 hover:opacity-100 border-muted-foreground "
      href={link}
      target="_blank"
    >
      {children}
    </Link>
  );
}
