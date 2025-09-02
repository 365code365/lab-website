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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    // 构建查询条件
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
        { tags: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.tool.count({ where })
    
    // 获取工具列表
    const tools = await db.tool.findMany({
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
      data: tools,
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
    console.error('获取开发工具失败:', error)
    return NextResponse.json(
      { error: '获取开发工具失败' },
      { status: 500 }
    )
  }
}

// 创建新开发工具
export async function POST(request: NextRequest) {
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const {
      name,
      description,
      shortDescription,
      version,
      type,
      category,
      tags,
      authors,
      maintainers,
      license,
      homepage,
      repository,
      documentation,
      downloadUrl,
      demoUrl,
      url,
      image,
      screenshots,
      features,
      requirements,
      installation,
      usage,
      changelog,
      reference,
      status,
      visibility,
      featured,
      downloads,
      stars,
      forks,
      issues,
      releaseDate,
      lastUpdate
    } = body
    const currentUserId = getCurrentUserId(request)

    // 验证必填字段
    if (!name || !description) {
      return NextResponse.json(
        { error: '名称和描述为必填项' },
        { status: 400 }
      )
    }

    const tool = await db.tool.create({
      data: {
        name,
        description,
        category: category || '',
        url,
        image,
        reference,
        tags,
        createdBy: currentUserId,
        updatedBy: currentUserId
      }
    })

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error('创建开发工具失败:', error)
    return NextResponse.json(
      { error: '创建开发工具失败' },
      { status: 500 }
    )
  }
}