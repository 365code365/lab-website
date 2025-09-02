import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码为必填项' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在或已被禁用' },
        { status: 401 }
      )
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // 更新最后登录时间
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roleType: user.roleType
      },
      process.env.NEXTAUTH_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )

    // 返回用户信息和token
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleType: user.roleType,
      name: user.name,
      avatar: user.avatar
    }

    return NextResponse.json({
      user: userInfo,
      token
    })
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}