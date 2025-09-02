import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'
import { safeSetUpdatedBy } from '@/lib/user-validation'

// 获取单个新闻
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const news = await db.news.findUnique({
      where: { id: parseInt(id) }
    })

    if (!news) {
      return NextResponse.json(
        { error: '新闻不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error('获取新闻失败:', error)
    return NextResponse.json(
      { error: '获取新闻失败' },
      { status: 500 }
    )
  }
}

// 更新新闻
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const { title, content, summary, image, isPinned } = body
    const currentUserId = getCurrentUserId(request)

    // 构建更新数据，只有在有有效用户ID时才包含updatedBy
    const updateData: Record<string, unknown> = {
      title,
      content,
      summary,
      image,
      isPinned: isPinned !== undefined ? isPinned : false
    }
    
    // 安全地设置updatedBy字段
    await safeSetUpdatedBy(updateData, currentUserId)

    const news = await db.news.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('更新新闻失败:', error)
    return NextResponse.json(
      { error: '更新新闻失败' },
      { status: 500 }
    )
  }
}

// 删除新闻
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    await db.news.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: '新闻删除成功' })
  } catch (error) {
    console.error('删除新闻失败:', error)
    return NextResponse.json(
      { error: '删除新闻失败' },
      { status: 500 }
    )
  }
}