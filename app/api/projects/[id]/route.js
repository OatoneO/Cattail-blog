import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/db/project-service';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const project = await getProjectById(id);
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json(
      { error: '获取项目失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    const project = await updateProject(id, data);
    return NextResponse.json(project);
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json(
      { error: '更新项目失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json(
      { error: '删除项目失败' },
      { status: 500 }
    );
  }
} 