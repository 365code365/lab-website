import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth-middleware'

// 获取所有获奖记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const skip = (page - 1) * limit
    
    // 搜索参数
    const search = searchParams.get('search') || ''
    
    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    // 构建查询条件
    const where = search ? {
      OR: [
        { awardee: { contains: search, mode: 'insensitive' as const } },
        { awardName: { contains: search, mode: 'insensitive' as const } },
        { advisor: { contains: search, mode: 'insensitive' as const } },
        { remarks: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.award.count({ where })
    
    // 获取获奖记录列表
    const awards = await db.award.findMany({
      where,
      orderBy,
      skip,
      take: limit
    })
    
    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return NextResponse.json({
      data: awards,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error('获取获奖记录失败:', error)
    return NextResponse.json(
      { error: '获取获奖记录失败' },
      { status: 500 }
    )
  }
}

// 创建新获奖记录
export async function POST(request: NextRequest) {
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

    const award = await db.award.create({
      data: {
        serialNumber,
        awardee,
        awardDate: awardDate || null,
        awardName,
        advisor,
        remarks,
        createdBy: currentUserId,
        updatedBy: currentUserId
      }
    })

    return NextResponse.json(award, { status: 201 })
  } catch (error) {
    console.error('创建获奖记录失败:', error)
    return NextResponse.json(
      { error: '创建获奖记录失败' },
      { status: 500 }
    )
  }
}