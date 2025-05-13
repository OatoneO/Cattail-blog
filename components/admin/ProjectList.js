'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2 } from 'lucide-react';
import DeleteProjectDialog from './DeleteProjectDialog';

function Tag({ children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md">
      {children}
    </span>
  );
}

export default function ProjectList({ projects }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleDeleteClick = (project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-2 text-left">标题</th>
            <th className="px-4 py-2 text-left">描述</th>
            <th className="px-4 py-2 text-left">技术栈</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-gray-700 hover:bg-gray-800/50">
              <td className="px-4 py-3">{project.title}</td>
              <td className="px-4 py-3 max-w-md truncate">{project.description}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {project.technologies?.map((tech, index) => (
                    <Tag key={index}>{tech}</Tag>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/projects/edit/${project.id}`}
                    className="p-1 text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(project)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        project={selectedProject}
      />
    </div>
  );
} 