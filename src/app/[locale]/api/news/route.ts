import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'
import { safeSetCreatedAndUpdatedBy } from '@/lib/user-validation'

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
        { title: { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } },
        { summary: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件 - 保持置顶新闻优先
    const orderBy = sortBy === 'createdAt' ? [
      { isPinned: 'desc' as 'asc' | 'desc' },
      { createdAt: sortOrder as 'asc' | 'desc' }
    ] : [
      { isPinned: 'desc' as 'asc' | 'desc' },
      { [sortBy]: sortOrder as 'asc' | 'desc' }
    ]
    
    // 获取总数
    const total = await db.news.count({ where })
    
    // 获取新闻列表
    const news = await db.news.findMany({
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
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error: unknown) {
    console.error('获取新闻失败:', error)
    return NextResponse.json(
      { error: '获取新闻失败' },
      { status: 500 }
    )
  }
}

// 创建新新闻
export async function POST(request: NextRequest) {
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const { title, content, summary, image, isPinned } = body
    const currentUserId = getCurrentUserId(request)

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容为必填项' },
        { status: 400 }
      )
    }

    // 构建创建数据，只有在有有效用户ID时才包含createdBy和updatedBy
    const createData: Record<string, unknown> = {
      title,
      content,
      summary: summary || '',
      image: image || '',
      isPinned: isPinned || false
    }
    
    // 安全地设置createdBy和updatedBy字段
    await safeSetCreatedAndUpdatedBy(createData, currentUserId)

    const news = await db.news.create({
      data: createData
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error: unknown) {
    console.error('创建新闻失败:', error)
    return NextResponse.json(
      { error: '创建新闻失败' },
      { status: 500 }
    )
  }
}