import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'

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
    const sortBy = searchParams.get('sortBy') || 'year'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    // 构建查询条件
    const where = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { authors: { contains: search, mode: 'insensitive' as const } },
        { journal: { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.publication.count({ where })
    
    // 获取发表成果列表
    const publications = await db.publication.findMany({
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
      data: publications,
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
    console.error('获取发表成果失败:', error)
    return NextResponse.json(
      { error: '获取发表成果失败' },
      { status: 500 }
    )
  }
}

// 创建新发表成果
export async function POST(request: NextRequest) {
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const { title, authors, journal, year, type, content } = body
    const currentUserId = getCurrentUserId(request)

    // 验证必填字段
    if (!title || !authors || !journal || !year) {
      return NextResponse.json(
        { error: '标题、作者、期刊和年份为必填项' },
        { status: 400 }
      )
    }

    const publication = await db.publication.create({
      data: {
        title,
        authors,
        journal,
        year: parseInt(year),
        type: type || 'paper',
        content,
        createdBy: currentUserId,
        updatedBy: currentUserId
      }
    })

    return NextResponse.json(publication, { status: 201 })
  } catch (error) {
    console.error('创建发表成果失败:', error)
    return NextResponse.json(
      { error: '创建发表成果失败' },
      { status: 500 }
    )
  }
}