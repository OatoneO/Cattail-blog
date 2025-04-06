import Link from "next/link";

export default function OpenToWork() {
  return (
    <div className="flex flex-col items-start justify-center w-full gap-2 p-6 mb-16 border border-dashed rounded-lg bg-muted">
      {/* <IntroScrollMouse /> */}
      <h2 className="text-xl text-green-200 opacity-60">Open to Work!</h2>
      <div>
        <p>
          I am actively looking for Software Engineer Internship for Summer
          2025. Welcome to check out my{" "}
          <Link
            className="underline"
            href="/pdf/Zhihao-Lin-Resume.pdf"
            target="_blank"
          >
            Resume
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
