import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth-middleware'

// 获取所有毕业生
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
        { name: { contains: search, mode: 'insensitive' as const } },
        { position: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    // 构建排序条件
    const orderBy = { [sortBy]: sortOrder }
    
    // 获取总数
    const total = await db.graduate.count({ where })
    
    // 获取毕业生列表
    const graduates = await db.graduate.findMany({
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
      data: graduates,
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
    console.error('获取毕业生列表失败:', error)
    return NextResponse.json(
      { error: '获取毕业生列表失败' },
      { status: 500 }
    )
  }
}

// 创建新毕业生
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      enrollmentDate, 
      graduationDate, 
      advisor, 
      degree, 
      discipline, 
      thesisTitle, 
      position, 
      email, 
      company, 
      hasPaper, 
      remarks 
    } = body
    const currentUserId = getCurrentUserId(request)

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { error: '姓名为必填项' },
        { status: 400 }
      )
    }

    // 根据姓名+入学时间年份检查是否已存在
    if (name && enrollmentDate) {
      // 提取入学时间的年份
      const enrollmentYear = new Date(enrollmentDate).getFullYear()
      
      // 查找相同姓名且入学时间在同一年的记录
      const existingGraduates = await db.graduate.findMany({
        where: {
          name: name.trim(),
          enrollmentDate: {
            contains: enrollmentYear.toString()
          }
        }
      })
      
      if (existingGraduates.length > 0) {
        return NextResponse.json(
          { error: `毕业生 "${name}" (${enrollmentYear}年入学) 已存在` },
          { status: 400 }
        )
      }
    }

    const graduate = await db.graduate.create({
      data: {
        name: name?.trim(),
        enrollmentDate,
        graduationDate,
        advisor: advisor?.trim(),
        degree: degree?.trim(),
        discipline: discipline?.trim(),
        thesisTitle: thesisTitle?.trim(),
        position: position?.trim(),
        email: email?.trim(),
        company: company?.trim(),
        hasPaper,
        remarks: remarks?.trim(),
        createdBy: currentUserId,
        updatedBy: currentUserId
      }
    })

    return NextResponse.json(graduate, { status: 201 })
  } catch (error) {
    console.error('创建毕业生失败:', error)
    return NextResponse.json(
      { error: '创建毕业生失败' },
      { status: 500 }
    )
  }
}