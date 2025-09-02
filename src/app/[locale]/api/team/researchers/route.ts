import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth-middleware'

// 获取所有研究人员
export async function GET(request: NextRequest) {
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
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { direction: { contains: search, mode: 'insensitive' as const } },
        { type: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.researcher.count({ where })
    
    // 获取研究人员列表
    const researchers = await db.researcher.findMany({
      where,
      orderBy,
      skip,
      take: limit
    })
    
    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return NextResponse.json({
      data: researchers,
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
    console.error('获取研究人员列表失败:', error)
    return NextResponse.json(
      { error: '获取研究人员列表失败' },
      { status: 500 }
    )
  }
}

// 创建新研究人员
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, photo, email, direction, type } = body
    const currentUserId = getCurrentUserId(request)

    // 验证必填字段
    if (!name || !email) {
      return NextResponse.json(
        { error: '姓名和邮箱为必填项' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingResearcher = await db.researcher.findUnique({
      where: { email }
    })

    if (existingResearcher) {
      return NextResponse.json(
        { error: '邮箱已存在' },
        { status: 400 }
      )
    }

    const researcher = await db.researcher.create({
      data: {
        name,
        photo,
        email,
        direction,
        type: type || 'researcher',
        createdBy: currentUserId,
        updatedBy: currentUserId
      }
    })

    return NextResponse.json(researcher, { status: 201 })
  } catch (error) {
    console.error('创建研究人员失败:', error)
    return NextResponse.json(
      { error: '创建研究人员失败' },
      { status: 500 }
    )
  }
}