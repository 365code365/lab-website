import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getCurrentUserId } from '@/lib/auth-middleware'

// 获取单个获奖记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const award = await db.award.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!award) {
      return NextResponse.json(
        { error: '获奖记录不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(award)
  } catch (error) {
    console.error('获取获奖记录失败:', error)
    return NextResponse.json(
      { error: '获取获奖记录失败' },
      { status: 500 }
    )
  }
}

// 更新获奖记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const { serialNumber, awardee, awardDate, awardName, advisor, remarks } = body
    const currentUserId = getCurrentUserId(request)
    
    // 验证必填字段
    if (!awardee) {
      return NextResponse.json(
        { error: '获奖人员为必填项' },
        { status: 400 }
      )
    }
    
    if (!awardName) {
      return NextResponse.json(
        { error: '获奖名称为必填项' },
        { status: 400 }
      )
    }
    
    const award = await db.award.update({
      where: { id: parseInt(id) },
      data: {
        serialNumber,
        awardee,
        awardDate: awardDate || null,
        awardName,
        advisor,
        remarks,
        updatedBy: currentUserId
      }
    })
    
    return NextResponse.json(award)
  } catch (error) {
    console.error('更新获奖记录失败:', error)
    return NextResponse.json(
      { error: '更新获奖记录失败' },
      { status: 500 }
    )
  }
}

// 删除获奖记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    await db.award.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ message: '获奖记录删除成功' })
  } catch (error) {
    console.error('删除获奖记录失败:', error)
    return NextResponse.json(
      { error: '删除获奖记录失败' },
      { status: 500 }
    )
  }
}