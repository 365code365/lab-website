import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'

// 获取仪表盘统计数据
export async function GET(request: NextRequest) {
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult

  try {
    // 并行获取各项统计数据
    const [userCount, publicationCount, toolCount, newsCount, researcherCount] = await Promise.all([
      db.user.count(),
      db.publication.count(),
      db.tool.count(),
      db.news.count(),
      db.researcher.count()
    ])

    // 获取最近的新闻（最新5条）
    const recentNews = await db.news.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        isPinned: true
      }
    })

    // 获取最近的发表成果（最新5条）
    const recentPublications = await db.publication.findMany({
      orderBy: { year: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        year: true,
        journal: true
      }
    })

    // 获取最近的工具（最新5条）
    const recentTools = await db.tool.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    })

    const stats = {
      overview: {
        userCount,
        publicationCount,
        toolCount,
        newsCount,
        researcherCount
      },
      recent: {
        news: recentNews,
        publications: recentPublications,
        tools: recentTools
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error)
    return NextResponse.json(
      { error: '获取仪表盘统计数据失败' },
      { status: 500 }
    )
  }
}