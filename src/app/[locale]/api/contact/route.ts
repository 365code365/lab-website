import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// JWT payload 接口
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

// 从请求头获取token
function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  const cookieToken = request.cookies.get('token')?.value
  if (cookieToken) {
    return cookieToken
  }
  
  return null
}

// 验证管理员权限
function verifyAdminAuth(request: NextRequest): { success: boolean; user?: JWTPayload; error?: string } {
  const token = getTokenFromRequest(request)
  
  if (!token) {
    return { success: false, error: '未提供认证token' }
  }
  
  const payload = verifyToken(token)
  if (!payload) {
    return { success: false, error: 'token无效或已过期' }
  }
  
  if (payload.roleType !== 'admin') {
    return { success: false, error: '权限不足，需要管理员权限' }
  }
  
  return { success: true, user: payload }
}

// 获取客户端IP地址
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr
  }
  
  return 'unknown'
}

// 检查IP提交限制
async function checkIPLimit(ipAddress: string): Promise<{ allowed: boolean; count: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const count = await prisma.contact.count({
    where: {
      ipAddress,
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  })
  
  return {
    allowed: count < 5,
    count
  }
}

// 获取联系记录（管理员）
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
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { reason: { contains: search } }
      ]
    }
    
    // 获取总数
    const total = await prisma.contact.count({ where })
    
    // 获取联系记录
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        processor: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取联系记录失败:', error)
    return NextResponse.json(
      { error: '获取联系记录失败' },
      { status: 500 }
    )
  }
}

// 提交联系表单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, reason } = body
    
    // 验证必填字段
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: '联系理由为必填项' },
        { status: 400 }
      )
    }
    
    // 验证至少提供电话或邮箱
    if (!phone && !email) {
      return NextResponse.json(
        { error: '请至少提供电话或邮箱联系方式' },
        { status: 400 }
      )
    }
    
    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      )
    }
    
    // 验证电话格式（简单验证）
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return NextResponse.json(
        { error: '电话格式不正确' },
        { status: 400 }
      )
    }
    
    // 获取客户端IP
    const ipAddress = getClientIP(request)
    
    // 检查IP提交限制
    const ipCheck = await checkIPLimit(ipAddress)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `您今日已提交${ipCheck.count}次，已达到每日最大提交次数限制（5次）` },
        { status: 429 }
      )
    }
    
    // 获取用户代理
    const userAgent = request.headers.get('user-agent') || ''
    
    // 创建联系记录
    const contact = await prisma.contact.create({
      data: {
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        reason: reason.trim(),
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json({
      success: true,
      data: contact,
      message: '联系信息提交成功，我们会尽快与您联系'
    })
  } catch (error) {
    console.error('提交联系信息失败:', error)
    return NextResponse.json(
      { error: '提交联系信息失败' },
      { status: 500 }
    )
  }
}

// 更新联系记录状态（管理员）
export async function PUT(request: NextRequest) {
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
    const { id, status, adminNote } = body
    
    // 验证必填字段
    if (!id) {
      return NextResponse.json(
        { error: 'ID为必填项' },
        { status: 400 }
      )
    }
    
    // 验证状态值
    if (status && !['pending', 'processed', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: '状态值无效' },
        { status: 400 }
      )
    }
    
    // 更新联系记录
    const contact = await prisma.contact.update({
      where: {
        id: parseInt(id)
      },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
        processedBy: authResult.user!.userId
      },
      include: {
        processor: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: contact,
      message: '联系记录更新成功'
    })
  } catch (error) {
    console.error('更新联系记录失败:', error)
    return NextResponse.json(
      { error: '更新联系记录失败' },
      { status: 500 }
    )
  }
}

// 删除联系记录（管理员）
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID为必填项' },
        { status: 400 }
      )
    }
    
    // 删除联系记录
    await prisma.contact.delete({
      where: {
        id: parseInt(id)
      }
    })

    return NextResponse.json({
      success: true,
      message: '联系记录删除成功'
    })
  } catch (error) {
    console.error('删除联系记录失败:', error)
    return NextResponse.json(
      { error: '删除联系记录失败' },
      { status: 500 }
    )
  }
}