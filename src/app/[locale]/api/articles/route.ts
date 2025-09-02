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
    
    // 筛选参数
    const journal = searchParams.get('journal') || ''
    const year = searchParams.get('year')
    const category = searchParams.get('category') || ''
    
    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'publishedDate'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    // 构建查询条件
    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { authors: { contains: search, mode: 'insensitive' as const } },
        { journal: { contains: search, mode: 'insensitive' as const } },
        { abstract: { contains: search, mode: 'insensitive' as const } },
        { keywords: { contains: search, mode: 'insensitive' as const } }
      ]
    }
    
    if (journal) {
      where.journal = { contains: journal, mode: 'insensitive' as const }
    }
    
    if (year) {
      const yearInt = parseInt(year)
      if (!isNaN(yearInt)) {
        where.publishedDate = {
          gte: new Date(`${yearInt}-01-01`),
          lt: new Date(`${yearInt + 1}-01-01`)
        }
      }
    }
    
    if (category) {
      where.category = category
    }
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.article.count({ where })
    
    // 获取文章列表
    const articles = await db.article.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        creator: {
          select: { id: true, username: true }
        },
        updater: {
          select: { id: true, username: true }
        }
      }
    })
    
    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return NextResponse.json({
      data: articles,
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
    console.error('获取文章失败:', error)
    return NextResponse.json(
      { error: '获取文章失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// 创建新文章
export async function POST(request: NextRequest) {
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const { 
      title, 
      authors, 
      journal, 
      publishedDate, 
      doi, 
      abstract, 
      keywords, 
      category, 
      impactFactor, 
      citationCount, 
      url, 
      pdfUrl, 
      isOpenAccess 
    } = body
    const currentUserId = getCurrentUserId(request)

    // 验证必填字段
    if (!title || !authors || !journal) {
      return NextResponse.json(
        { error: '标题、作者和期刊为必填项' },
        { status: 400 }
      )
    }

    // 构建创建数据
    const createData: Record<string, unknown> = {
      title,
      authors,
      journal,
      publishedDate: publishedDate ? new Date(publishedDate) : null,
      doi,
      abstract,
      keywords,
      category: category || 'research',
      impactFactor: impactFactor ? parseFloat(impactFactor) : null,
      citationCount: citationCount ? parseInt(citationCount) : 0,
      url,
      pdfUrl,
      isOpenAccess: isOpenAccess || false
    }
    
    // 安全地设置createdBy和updatedBy字段
    await safeSetCreatedAndUpdatedBy(createData, currentUserId)

    const article = await db.article.create({
      data: createData,
      include: {
        creator: {
          select: { id: true, username: true }
        },
        updater: {
          select: { id: true, username: true }
        }
      }
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error: unknown) {
    console.error('创建文章失败:', error)
    return NextResponse.json(
      { error: '创建文章失败' },
      { status: 500 }
    )
  }
}