import prisma from '@/lib/prisma';

// 创建新项目
export async function createProject({ title, description, link, imageUrl, technologies }) {
  try {
    if (!prisma?.project) {
      throw new Error('Prisma Client 未正确初始化');
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        link,
        imageUrl,
        technologies: JSON.stringify(technologies)
      }
    });
    
    return {
      ...project,
      technologies: JSON.parse(project.technologies)
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

// 获取所有项目
export async function getAllProjects() {
  try {
    if (!prisma?.project) {
      throw new Error('Prisma Client 未正确初始化');
    }

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return projects.map(project => ({
      ...project,
      technologies: JSON.parse(project.technologies)
    }));
  } catch (error) {
    console.error('Error getting all projects:', error);
    throw error;
  }
}

// 根据 ID 获取项目
export async function getProjectById(id) {
  try {
    if (!prisma?.project) {
      throw new Error('Prisma Client 未正确初始化');
    }

    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (project) {
      return {
        ...project,
        technologies: JSON.parse(project.technologies)
      };
    }
    
    return project;
  } catch (error) {
    console.error(`Error getting project with id ${id}:`, error);
    throw error;
  }
}

// 更新项目
export async function updateProject(id, { title, description, link, imageUrl, technologies }) {
  try {
    if (!prisma?.project) {
      throw new Error('Prisma Client 未正确初始化');
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        link,
        imageUrl,
        technologies: JSON.stringify(technologies)
      }
    });
    
    return {
      ...project,
      technologies: JSON.parse(project.technologies)
    };
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    throw error;
  }
}

// 删除项目
export async function deleteProject(id) {
  try {
    if (!prisma?.project) {
      throw new Error('Prisma Client 未正确初始化');
    }

    await prisma.project.delete({
      where: { id }
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
} 