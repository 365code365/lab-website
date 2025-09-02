import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'

// 获取单个毕业生
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const graduate = await db.graduate.findUnique({
      where: { id: parseInt(id) }
    })

    if (!graduate) {
      return NextResponse.json(
        { error: '毕业生不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(graduate)
  } catch (error) {
    console.error('获取毕业生失败:', error)
    return NextResponse.json(
      { error: '获取毕业生失败' },
      { status: 500 }
    )
  }
}

// 更新毕业生
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
    const { name, position, email, company, hasPaper } = body
    const currentUserId = getCurrentUserId(request)

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      name,
      position,
      email,
      company,
      hasPaper
    }
    
    // 验证用户ID是否存在，避免外键约束违反
    if (currentUserId) {
      const userExists = await db.user.findUnique({
        where: { id: currentUserId },
        select: { id: true }
      })
      
      if (userExists) {
        updateData.updatedBy = currentUserId
      }
    }

    const graduate = await db.graduate.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json(graduate)
  } catch (error) {
    console.error('更新毕业生失败:', error)
    return NextResponse.json(
      { error: '更新毕业生失败' },
      { status: 500 }
    )
  }
}

// 删除毕业生
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.graduate.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: '毕业生删除成功' })
  } catch (error) {
    console.error('删除毕业生失败:', error)
    return NextResponse.json(
      { error: '删除毕业生失败' },
      { status: 500 }
    )
  }
}