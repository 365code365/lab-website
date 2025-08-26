import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import * as mammoth from 'mammoth'

// 创建Prisma客户端实例
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

// 解析学术论文格式，提取结构化信息
function parseAcademicPaper(content: string): any {
  // 学术论文正则表达式模式
  const patterns = {
    // 匹配作者列表（包含#标记、*标记等）
    authors: /^([^.]+[#*]*(?:,\s*[^.]+[#*]*)*)\.\s*/,
    // 匹配标题（通常在作者后面，以句号结尾）
    title: /\.\s*([^.]+(?:\.[^.]*)*?)\s*\./,
    // 匹配期刊名称（通常包含大写字母开头的单词）
    journal: /\b([A-Z][a-zA-Z\s&]+(?:Medicine|Science|Journal|Review|Research|Nature|Cell|PNAS|NEJM|Lancet))\b/,
    // 匹配年份
    year: /\b(20\d{2})\b/,
    // 匹配卷号和期号
    volume: /\b(\d+)\s*\(\s*(\d+)\s*\)/,
    // 匹配页码或文章编号
    pages: /:\s*([a-zA-Z]*\d+(?:-\d+)?|e\d+)\s*\./,
    // 匹配DOI
    doi: /doi:\s*([\w.-]+\/[\w.-]+)/i
  }
  
  const result: any = {}
  
  // 提取作者
  const authorsMatch = content.match(patterns.authors)
  if (authorsMatch) {
    result.authors = authorsMatch[1].trim()
  }
  
  // 提取标题（在作者之后的部分）
  const titleMatch = content.match(patterns.title)
  if (titleMatch) {
    result.title = titleMatch[1].trim()
  }
  
  // 提取期刊
  const journalMatch = content.match(patterns.journal)
  if (journalMatch) {
    result.journal = journalMatch[1].trim()
  }
  
  // 提取年份
  const yearMatch = content.match(patterns.year)
  if (yearMatch) {
    result.publishedDate = yearMatch[1]
  }
  
  // 提取卷号和期号
  const volumeMatch = content.match(patterns.volume)
  if (volumeMatch) {
    result.volume = volumeMatch[1]
    result.issue = volumeMatch[2]
  }
  
  // 提取页码
  const pagesMatch = content.match(patterns.pages)
  if (pagesMatch) {
    result.pages = pagesMatch[1]
  }
  
  // 提取DOI
  const doiMatch = content.match(patterns.doi)
  if (doiMatch) {
    result.doi = doiMatch[1]
  }
  
  return result
}

// 解析文档内容，以行首序号分隔为文章
function parseDocumentContent(content: string): string[] {
  // 清理内容，统一换行符并移除多余的空白字符
  const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim()
  
  // 使用更精确的正则表达式匹配行首的序号格式
  // 匹配：换行符 + 可选空白 + 数字 + 点号 + 空白
  const numberPattern = /(^|\n)\s*(\d+)\s*[.。]\s*/g
  
  // 分割内容
  const parts = cleanContent.split(numberPattern)
  const articles: string[] = []
  
  // 重新组合文章，处理分割后的数组
  // parts数组结构：[前置内容, 换行符, 序号, 文章内容, 换行符, 序号, 文章内容, ...]
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    
    // 如果是数字（序号），则获取对应的文章内容
    if (/^\d+$/.test(part)) {
      const articleContent = parts[i + 1]
      if (articleContent && articleContent.trim().length > 10) {
        // 清理文章内容，移除开头和结尾的换行符和空白
        const cleanArticleContent = articleContent.trim().replace(/^\n+|\n+$/g, '')
        
        // 尝试解析学术论文格式
        const paperInfo = parseAcademicPaper(cleanArticleContent)
        
        // 如果成功解析出学术论文信息，则使用结构化格式
        if (paperInfo.authors && paperInfo.title) {
          const structuredContent = JSON.stringify({
            originalContent: cleanArticleContent,
            parsedInfo: paperInfo,
            type: 'academic_paper'
          })
          articles.push(`${part}. ${structuredContent}`)
        } else {
          // 否则使用原始内容
          articles.push(`${part}. ${cleanArticleContent}`)
        }
      }
    }
  }
  
  // 如果没有找到序号格式，尝试按段落分隔
  if (articles.length === 0) {
    // 按双换行符分隔段落，或按单换行符分隔行
    const paragraphs = cleanContent.split(/\n\s*\n/)
      .map(para => para.trim())
      .filter(para => para.length > 20) // 段落长度要求更高
    
    if (paragraphs.length > 1) {
      // 对每个段落尝试解析学术论文格式
      return paragraphs.map(para => {
        const paperInfo = parseAcademicPaper(para)
        if (paperInfo.authors && paperInfo.title) {
          return JSON.stringify({
            originalContent: para,
            parsedInfo: paperInfo,
            type: 'academic_paper'
          })
        }
        return para
      })
    }
    
    // 最后回退到按行分隔
    const lineArticles = cleanContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10)
    
    return lineArticles
  }
  
  return articles
}

// 解析docx文件
async function parseDocxFile(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  } catch (error) {
    console.error('解析docx文件失败:', error)
    throw new Error('无法解析docx文件')
  }
}

// 上传文档
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/octet-stream', // 通用二进制文件类型，某些浏览器可能使用
      'application/x-msword', // 另一种.doc MIME类型
      'application/word', // 另一种Word文档MIME类型
      '' // 空MIME类型，某些情况下可能出现
    ]
    
    // 检查文件扩展名作为备用验证
    const fileName = file.name?.toLowerCase() || ''
    const hasValidExtension = fileName.endsWith('.doc') || fileName.endsWith('.docx')
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return NextResponse.json(
        { error: `不支持的文件类型，请上传doc或docx文件。当前文件类型: ${file.type}，文件名: ${file.name || '未知'}` },
        { status: 400 }
      )
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(uploadDir, filename)
    const relativePath = `/uploads/documents/${filename}`

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 创建文档记录
    const document = await prisma.document.create({
      data: {
        filename,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: relativePath,
        status: 'uploaded',
        createdBy: authResult.user!.userId
      }
    })

    // 异步解析文档
    parseDocumentAsync(document.id, filePath)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileSize: document.fileSize,
        status: document.status,
        createdAt: document.createdAt
      }
    })
  } catch (error) {
    console.error('上传文档失败:', error)
    return NextResponse.json(
      { error: '上传文档失败' },
      { status: 500 }
    )
  }
}

// 异步解析文档
async function parseDocumentAsync(documentId: number, filePath: string) {
  try {
    // 更新状态为解析中
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'parsing' }
    })

    // 解析文档内容
    let content: string
    if (filePath.endsWith('.docx')) {
      content = await parseDocxFile(filePath)
    } else {
      throw new Error('不支持的文件格式')
    }

    // 分割为文章
    const articles = parseDocumentContent(content)

    // 保存解析结果
    await prisma.$transaction(async (tx) => {
      // 更新文档记录
      await tx.document.update({
        where: { id: documentId },
        data: {
          content,
          articleCount: articles.length,
          status: 'parsed'
        }
      })

      // 创建文章记录
      for (let i = 0; i < articles.length; i++) {
        await tx.documentArticle.create({
          data: {
            documentId,
            content: articles[i],
            order: i + 1
          }
        })
      }
    })
  } catch (error) {
    console.error('解析文档失败:', error)
    
    // 更新状态为失败
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'failed',
        parseError: error instanceof Error ? error.message : '未知错误'
      }
    })
  }
}

// 获取文档列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === '未提供认证token' || authResult.error === 'token无效或已过期' ? 401 : 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    
    // 获取总数
    const total = await prisma.document.count({ where })
    
    // 获取文档列表
    const documents = await prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        articles: {
          select: {
            id: true,
            content: true,
            order: true,
            isImported: true
          },
          orderBy: { order: 'asc' }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取文档列表失败:', error)
    return NextResponse.json(
      { error: '获取文档列表失败' },
      { status: 500 }
    )
  }
}

// 删除文档
export async function DELETE(request: NextRequest) {
  console.log('收到删除文档请求')
  try {
    // 验证管理员权限
    const authResult = verifyAdminAuth(request)
    console.log('权限验证结果:', authResult)
    if (!authResult.success) {
      console.log('权限验证失败:', authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === '未提供认证token' || authResult.error === 'token无效或已过期' ? 401 : 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    console.log('要删除的文档ID:', id)
    
    if (!id) {
      console.log('未提供文档ID')
      return NextResponse.json(
        { error: '未提供文档ID' },
        { status: 400 }
      )
    }
    
    // 删除文档（级联删除相关文章）
    console.log('开始删除文档，ID:', parseInt(id))
    await prisma.document.delete({
      where: { id: parseInt(id) }
    })
    console.log('文档删除成功')
    
    return NextResponse.json({
      success: true,
      message: '文档删除成功'
    })
  } catch (error) {
    console.error('删除文档失败:', error)
    return NextResponse.json(
      { error: '删除文档失败' },
      { status: 500 }
    )
  }
}