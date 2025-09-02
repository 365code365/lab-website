import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'

// 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  // 权限验证
  const authError = requireAdmin(request)
  if (authError) return authError
  
  try {
    const user = await db.user.findUnique({
      where: { id: parseInt(resolvedParams.id) },
      select: {
        id: true,
        username: true,
        email: true,
        roleType: true,
        name: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('获取用户失败:', error)
    return NextResponse.json(
      { error: '获取用户失败' },
      { status: 500 }
    )
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  // 权限验证
  const authError = requireAdmin(request)
  if (authError) return authError
  
  try {
    const body = await request.json()
    const { username, email, password, roleType, name, isActive } = body
    const currentUserId = getCurrentUserId(request)

    const updateData: Record<string, unknown> = {
      username,
      email,
      roleType,
      name,
      isActive
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

    // 如果提供了新密码且不为空，则加密后更新
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await db.user.update({
      where: { id: parseInt(resolvedParams.id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        roleType: true,
        name: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('更新用户失败:', error)
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    )
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    await db.user.delete({
      where: { id: parseInt(resolvedParams.id) }
    })

    return NextResponse.json({ message: '用户删除成功' })
  } catch (error: unknown) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}