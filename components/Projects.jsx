"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

export default function Projects({ projects }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <section>
      <ul className="grid w-full grid-cols-1 gap-5 mx-auto sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={project.link} target="_blank">
              <div className="relative flex flex-col items-start justify-center gap-6 p-5 border-dashed border-[0.8px] border-transparent rounded-2xl hover:border-muted-foreground hover:bg-muted">
                <div className="relative flex items-center justify-center w-12 h-12 shadow-[0_0px_3px_rgb(180,180,180)] rounded-full">
                  <Image
                    src={imageErrors[project.id] ? "/images/image_loading.jpeg" : project.imageUrl}
                    alt={project.title}
                    width={36}
                    height={36}
                    className="object-contain"
                    onError={() => handleImageError(project.id)}
                  />
                </div>

                <div>
                  <h2 className="mb-4 font-semibold">{project.title}</h2>
                  <p className="text-sm font-light text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 text-xs bg-white/10 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <p>{new URL(project.link).host}</p>
                  <ExternalLink className="size-4" />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
