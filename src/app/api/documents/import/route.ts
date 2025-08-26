import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

interface JWTPayload {
  userId: number
  username: string
  roleType: string
  iat?: number
  exp?: number
}

// 验证JWT token
function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'default-secret'
    ) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Token验证失败:', error)
    return null
  }
}

// 从请求中获取token
function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

// 验证管理员权限
function verifyAdminAuth(request: NextRequest): { success: boolean; user?: JWTPayload; error?: string } {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { success: false, error: '未提供认证token' }
  }

  const user = verifyToken(token)
  if (!user) {
    return { success: false, error: 'token无效或已过期' }
  }

  if (user.roleType !== 'admin') {
    return { success: false, error: '权限不足，需要管理员权限' }
  }

  return { success: true, user }
}

// 导入文档文章到文章表
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === '未提供认证token' || authResult.error === 'token无效或已过期' ? 401 : 403 }
      )
    }

    const body = await request.json()
    const { documentId, articleIds } = body
    
    if (!documentId) {
      return NextResponse.json(
        { error: '未提供文档ID' },
        { status: 400 }
      )
    }

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: '未提供要导入的文章ID列表' },
        { status: 400 }
      )
    }

    // 获取要导入的文档文章
    const documentArticles = await prisma.documentArticle.findMany({
      where: {
        documentId: parseInt(documentId),
        id: { in: articleIds.map((id: string) => parseInt(id)) },
        isImported: false
      }
    })

    if (documentArticles.length === 0) {
      return NextResponse.json(
        { error: '没有找到可导入的文章' },
        { status: 400 }
      )
    }

    const importedArticles: Array<{
      documentArticleId: number
      articleId: number
      title: string
    }> = []
    
    // 使用事务导入文章
    await prisma.$transaction(async (tx) => {
      for (const docArticle of documentArticles) {
        // 解析文章内容，提取标题和其他信息
        const content = docArticle.content
        let title = ''
        let authors = ''
        let journal = ''
        let publishedDate = new Date()
        let doi = ''
        let volume = ''
        let issue = ''
        let pages = ''
        
        // 检查是否为JSON格式的学术论文数据
        try {
          const parsedData = JSON.parse(content)
          if (parsedData.type === 'academic_paper' && parsedData.parsedInfo) {
            const info = parsedData.parsedInfo
            title = info.title || ''
            authors = info.authors || ''
            journal = info.journal || ''
            doi = info.doi || ''
            volume = info.volume || ''
            issue = info.issue || ''
            pages = info.pages || ''
            
            // 处理发表日期
            if (info.publishedDate) {
              const year = parseInt(info.publishedDate)
              if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
                publishedDate = new Date(year, 0, 1)
              }
            }
            
            // 如果没有提取到标题，使用原始内容的前50个字符
            if (!title) {
              title = parsedData.originalContent.substring(0, 50) + (parsedData.originalContent.length > 50 ? '...' : '')
            }
          } else {
            throw new Error('Not academic paper format')
          }
        } catch (e) {
          // 如果不是JSON格式，使用原有的简单解析逻辑
          const parts = content.split('.')
          if (parts.length >= 3) {
            authors = parts[0].trim()
            title = parts[1].trim()
            
            // 尝试从第三部分提取期刊和年份
            const journalPart = parts[2].trim()
            const yearMatch = journalPart.match(/(\d{4})/)
            if (yearMatch) {
              const year = parseInt(yearMatch[1])
              publishedDate = new Date(year, 0, 1) // 设置为该年的1月1日
              journal = journalPart.replace(yearMatch[0], '').replace(/[,\s]+/g, ' ').trim()
            } else {
              journal = journalPart
            }
          } else {
            // 如果格式不匹配，使用内容的前50个字符作为标题
            title = content.substring(0, 50) + (content.length > 50 ? '...' : '')
            authors = '未知作者'
            journal = '未知期刊'
          }
        }
        
        // 创建文章记录
        const article = await tx.article.create({
          data: {
            title,
            authors,
            journal,
            volume,
            issue,
            pages,
            publishedDate,
            doi,
            abstract: content,
            keywords: '',
            impactFactor: null,
            citationCount: 0,
            status: 'published',
            createdBy: authResult.user!.userId,
            updatedBy: authResult.user!.userId
          }
        })
        
        // 更新文档文章状态
        await tx.documentArticle.update({
          where: { id: docArticle.id },
          data: {
            isImported: true,
            articleId: article.id
          }
        })
        
        importedArticles.push({
          documentArticleId: docArticle.id,
          articleId: article.id,
          title: article.title
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `成功导入 ${importedArticles.length} 篇文章`,
      importedArticles
    })
  } catch (error) {
    console.error('导入文章失败:', error)
    return NextResponse.json(
      { error: '导入文章失败' },
      { status: 500 }
    )
  }
}