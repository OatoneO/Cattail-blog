"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProjectCard({ project }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    if (project.link) {
      window.open(project.link, "_blank");
    }
  };

  return (
    <li>
      <div 
        onClick={handleClick}
        className="relative flex flex-col items-start justify-center gap-6 p-5 border-dashed border-[0.8px] border-transparent rounded-2xl hover:border-muted-foreground hover:bg-muted cursor-pointer"
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden">
          <Image
            src={imageError ? "/images/image_loading.jpeg" : project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>

        <div>
          <h2 className="mb-4 font-semibold">{project.title}</h2>
          <p className="text-sm font-light text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies?.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-white/10 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
} 