import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'

// 获取PI信息
export async function GET() {
  try {
    const pi = await db.pI.findFirst()
    return NextResponse.json(pi)
  } catch (error) {
    console.error('获取PI信息失败:', error)
    return NextResponse.json(
      { error: '获取PI信息失败' },
      { status: 500 }
    )
  }
}

// 创建或更新PI信息
export async function POST(request: NextRequest) {
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const { name, photo, title, email, experience, positions, awards, papers } = body
    const currentUserId = getCurrentUserId(request)

    // 检查是否已存在PI
    const existingPI = await db.pI.findFirst()
    
    let pi
    if (existingPI) {
      // 更新现有PI
      pi = await db.pI.update({
        where: { id: existingPI.id },
        data: {
          name,
          photo,
          title,
          email,
          experience,
          positions,
          awards,
          papers,
          updatedBy: currentUserId
        }
      })
    } else {
      // 创建新PI
      pi = await db.pI.create({
        data: {
          name,
          photo,
          title,
          email,
          experience,
          positions,
          awards,
          papers,
          createdBy: currentUserId,
          updatedBy: currentUserId
        }
      })
    }

    return NextResponse.json(pi)
  } catch (error) {
    console.error('保存PI信息失败:', error)
    return NextResponse.json(
      { error: '保存PI信息失败' },
      { status: 500 }
    )
  }
}