import path from "path";
import fs from "fs";
import matter from "gray-matter";

const rootDirectory = path.join(process.cwd(), "content", "projects");

// 确保目录存在
try {
  if (!fs.existsSync(rootDirectory)) {
    fs.mkdirSync(rootDirectory, { recursive: true });
  }
} catch (error) {
  console.error("Error creating projects directory:", error);
}

export async function getProjects() {
  try {
    // 确保目录存在
    if (!fs.existsSync(rootDirectory)) {
      fs.mkdirSync(rootDirectory, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(rootDirectory);
    
    if (files.length === 0) return [];

    const projects = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(rootDirectory, file);
        const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
        const projectData = JSON.parse(fileContent);
        return {
          ...projectData,
          id: file.replace(/\.json$/, "")
        };
      })
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return projects;
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
}

export async function getProjectById(id) {
  try {
    const filePath = path.join(rootDirectory, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
    const projectData = JSON.parse(fileContent);
    
    return {
      ...projectData,
      id
    };
  } catch (error) {
    console.error(`Error getting project ${id}:`, error);
    return null;
  }
}

export async function saveProject(projectData) {
  try {
    // 确保目录存在
    if (!fs.existsSync(rootDirectory)) {
      fs.mkdirSync(rootDirectory, { recursive: true });
    }
    
    const id = projectData.id || Date.now().toString();
    const filePath = path.join(rootDirectory, `${id}.json`);
    
    // 添加创建时间和更新时间
    const dataToSave = {
      ...projectData,
      updatedAt: new Date().toISOString(),
      createdAt: projectData.createdAt || new Date().toISOString(),
    };
    
    // 移除id，因为它已经是文件名
    delete dataToSave.id;
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    
    return {
      ...dataToSave,
      id
    };
  } catch (error) {
    console.error("Error saving project:", error);
    throw error;
  }
}

export async function deleteProject(id) {
  try {
    const filePath = path.join(rootDirectory, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return false;
  }
}
