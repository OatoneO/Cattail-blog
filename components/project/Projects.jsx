"use client";

import ProjectCard from "./ProjectCard";

export default function Projects({ projects }) {
  return (
    <section>
      <ul className="grid w-full grid-cols-1 gap-5 mx-auto sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ul>
    </section>
  );
}
