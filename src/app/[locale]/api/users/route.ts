import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth-middleware'

// 获取所有用户（仅管理员）
export async function GET(request: NextRequest) {
  // 权限验证
  const authError = requireAdmin(request)
  if (authError) return authError
  
  try {
    const { searchParams } = new URL(request.url)
    
    // 分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const skip = (page - 1) * limit
    
    // 搜索参数
    const search = searchParams.get('search') || ''
    
    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    // 构建查询条件
    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.user.count({ where })
    
    // 获取用户列表
    const users = await db.user.findMany({
      where,
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
      },
      orderBy,
      skip,
      take: limit
    })
    
    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

// 创建新用户
export async function POST(request: NextRequest) {
  // 权限验证
  const authError = requireAdmin(request)
  if (authError) return authError
  
  try {
    const body = await request.json()
    const { 
      name, 
      username, 
      email, 
      password, 
      role = 'user', 
      roleType, 
      status = 'active', 
      isActive,
      phone 
    } = body

    // 支持前端字段格式：name作为username，role作为roleType，status作为isActive
    const finalUsername = username || name
    const finalRoleType = roleType || role
    const finalIsActive = isActive !== undefined ? isActive : (status === 'active')

    // 验证必填字段
    if (!finalUsername || !email || !password) {
      return NextResponse.json(
        { error: '用户名、邮箱和密码为必填项' },
        { status: 400 }
      )
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: finalUsername },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名或邮箱已存在' },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await db.user.create({
      data: {
        username: finalUsername,
        email,
        password: hashedPassword,
        roleType: finalRoleType,
        name: name || finalUsername,
        isActive: finalIsActive
      },
      select: {
        id: true,
        username: true,
        email: true,
        roleType: true,
        name: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    )
  }
}