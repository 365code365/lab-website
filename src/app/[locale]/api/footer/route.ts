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

// 获取页脚配置
export async function GET() {
  try {
    // 获取当前启用的页脚配置
    const footer = await prisma.footer.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: footer
    })
  } catch (error) {
    console.error('获取页脚配置失败:', error)
    return NextResponse.json(
      { error: '获取页脚配置失败' },
      { status: 500 }
    )
  }
}

// 创建或更新页脚配置
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
    const {
      title,
      description,
      copyright,
      icp,
      email,
      phone,
      address,
      links
    } = body

    // 验证必填字段
    if (!title || !description || !copyright) {
      return NextResponse.json(
        { error: '标题、描述和版权信息为必填项' },
        { status: 400 }
      )
    }

    // 验证用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: authResult.user!.userId }
    })

    // 先将所有现有配置设为非活跃状态
    await prisma.footer.updateMany({
      where: {
        isActive: true
      },
      data: {
        isActive: false,
        updatedBy: userExists ? authResult.user!.userId : null
      }
    })

    // 创建新的页脚配置
    const footer = await prisma.footer.create({
      data: {
        title,
        description,
        copyright,
        icp,
        email,
        phone,
        address,
        links: links ? (typeof links === 'string' ? links : JSON.stringify(links)) : null,
        isActive: true,
        createdBy: userExists ? authResult.user!.userId : null,
        updatedBy: userExists ? authResult.user!.userId : null
      }
    })

    return NextResponse.json({
      success: true,
      data: footer,
      message: '页脚配置保存成功'
    })
  } catch (error) {
    console.error('保存页脚配置失败:', error)
    return NextResponse.json(
      { error: '保存页脚配置失败' },
      { status: 500 }
    )
  }
}

// 更新页脚配置
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
    const {
      id,
      title,
      description,
      copyright,
      icp,
      email,
      phone,
      address,
      links
    } = body

    // 验证必填字段
    if (!id || !title || !description || !copyright) {
      return NextResponse.json(
        { error: 'ID、标题、描述和版权信息为必填项' },
        { status: 400 }
      )
    }

    // 验证用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: authResult.user!.userId }
    })

    // 更新页脚配置
    const footer = await prisma.footer.update({
      where: {
        id: parseInt(id)
      },
      data: {
        title,
        description,
        copyright,
        icp,
        email,
        phone,
        address,
        links: links ? (typeof links === 'string' ? links : JSON.stringify(links)) : null,
        updatedBy: userExists ? authResult.user!.userId : null
      }
    })

    return NextResponse.json({
      success: true,
      data: footer,
      message: '页脚配置更新成功'
    })
  } catch (error) {
    console.error('更新页脚配置失败:', error)
    return NextResponse.json(
      { error: '更新页脚配置失败' },
      { status: 500 }
    )
  }
}

// 删除页脚配置
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
        { error: '缺少页脚配置ID' },
        { status: 400 }
      )
    }

    // 删除页脚配置
    await prisma.footer.delete({
      where: {
        id: parseInt(id)
      }
    })

    return NextResponse.json({
      success: true,
      message: '页脚配置删除成功'
    })
  } catch (error) {
    console.error('删除页脚配置失败:', error)
    return NextResponse.json(
      { error: '删除页脚配置失败' },
      { status: 500 }
    )
  }
}