"use client";

export default function BasisInfo() {
  return (
    <div className="w-full rounded-lg shadow-[0_0px_1.2px_rgb(140,140,140)] py-6 px-4">
      <h2 className="mb-6 ml-2 text-lg text-muted-foreground">
        💡 About Me
      </h2>
      <ul className="flex flex-col gap-5 pl-6 text-sm list-disc ">
        <li>
          👋 You can call me <span className="font-bold">Cattail</span>{" "}or{" "}
          <span className="font-bold">文博</span>.
        </li>

        <li>
          🌎 Current Location:{" "}
          <a
            className="font-bold"
            href="https://en.wikipedia.org/wiki/Minneapolis"
            target="_blank"
          >
            NanJing,JiangSu,China
          </a>
          .
        </li>
      </ul>
    </div>
  );
}
