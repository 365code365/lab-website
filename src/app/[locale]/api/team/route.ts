import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [pi, researchers, graduates] = await Promise.all([
      db.pI.findFirst(),
      db.researcher.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      db.graduate.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({
      pi,
      researchers,
      graduates
    })
  } catch (error) {
    console.error('获取团队数据失败:', error)
    return NextResponse.json(
      { error: '获取团队数据失败' },
      { status: 500 }
    )
  }
}