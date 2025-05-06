import { NextResponse } from 'next/server';
import { createProject, getAllProjects } from '@/lib/db/project-service';

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const project = await createProject(data);
    return NextResponse.json(project);
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    );
  }
} 