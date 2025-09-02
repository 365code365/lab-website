import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface AdminUser {
  username: string
  email: string
  password: string
  name: string
}

export async function POST(request: NextRequest) {
  try {
    const adminUser: AdminUser = await request.json()
    
    // 添加调试日志
    console.log('收到创建管理员请求，数据:', {
      username: adminUser.username,
      email: adminUser.email,
      name: adminUser.name,
      hasPassword: !!adminUser.password,
      passwordLength: adminUser.password?.length || 0
    })
    
    // 验证必填字段
    if (!adminUser.username || !adminUser.email || !adminUser.password || !adminUser.name) {
      const missingFields = []
      if (!adminUser.username) missingFields.push('用户名')
      if (!adminUser.email) missingFields.push('邮箱')
      if (!adminUser.password) missingFields.push('密码')
      if (!adminUser.name) missingFields.push('姓名')
      
      console.log('验证失败 - 缺少必填字段:', missingFields)
      return NextResponse.json(
        { error: `请填写所有必填字段: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminUser.email)) {
      console.log('验证失败 - 邮箱格式无效:', adminUser.email)
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }
    
    // 验证密码长度
    if (adminUser.password.length < 6) {
      console.log('验证失败 - 密码长度不足:', adminUser.password.length)
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      )
    }
    
    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: adminUser.username }
    })
    
    if (existingUserByUsername) {
      console.log('管理员用户已存在，跳过创建:', adminUser.username)
      // 如果管理员用户已存在，返回成功（避免重复安装时的错误）
      if (existingUserByUsername.roleType === 'admin') {
        return NextResponse.json({
          message: '管理员账户已存在，跳过创建',
          user: {
            id: existingUserByUsername.id,
            username: existingUserByUsername.username,
            email: existingUserByUsername.email,
            name: existingUserByUsername.name,
            roleType: existingUserByUsername.roleType
          }
        })
      } else {
        console.log('验证失败 - 用户名已存在但不是管理员:', adminUser.username)
        return NextResponse.json(
          { error: '用户名已存在但不是管理员账户' },
          { status: 400 }
        )
      }
    }
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: adminUser.email }
    })
    
    if (existingUserByEmail) {
      console.log('验证失败 - 邮箱已被使用:', adminUser.email)
      return NextResponse.json(
        { error: '邮箱已被使用' },
        { status: 400 }
      )
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(adminUser.password, 12)
    
    // 创建管理员用户
    const newAdmin = await prisma.user.create({
      data: {
        username: adminUser.username,
        email: adminUser.email,
        password: hashedPassword,
        name: adminUser.name,
        roleType: 'admin',
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        roleType: true,
        isActive: true,
        createdAt: true
      }
    })
    
    console.log('管理员账户创建成功:', {
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email
    })
    
    return NextResponse.json(
      { 
        success: true, 
        message: '管理员账户创建成功',
        admin: newAdmin
      },
      { status: 201 }
    )
    
  } catch (error: unknown) {
    const errorObj = error as { code?: string; meta?: { target?: string[] }; message?: string }
    console.error('创建管理员账户失败:', {
      error: error instanceof Error ? error.message : String(error),
      code: errorObj.code,
      meta: errorObj.meta,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    let errorMessage = '创建管理员账户失败'
    
    if (errorObj.code === 'P2002') {
      // Prisma唯一约束错误
      if (errorObj.meta?.target?.includes('username')) {
        errorMessage = '用户名已存在'
      } else if (errorObj.meta?.target?.includes('email')) {
        errorMessage = '邮箱已被使用'
      } else {
        errorMessage = '数据冲突，请检查用户名和邮箱'
      }
    } else if (errorObj.code === 'P2025') {
      errorMessage = '数据库表不存在，请先初始化数据库'
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}