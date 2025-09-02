import { NextRequest, NextResponse } from 'next/server'

// 生成占位符图片
export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    // 解析参数：width/height 或 width
    const resolvedParams = await params
    const [width, height] = resolvedParams.params
    const w = parseInt(width) || 400
    const h = parseInt(height) || w
    
    // 限制图片尺寸
    const maxSize = 2000
    const finalWidth = Math.min(w, maxSize)
    const finalHeight = Math.min(h, maxSize)
    
    // 创建SVG占位符
    const svg = `
      <svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
          ${finalWidth} × ${finalHeight}
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('生成占位符图片失败:', error)
    return NextResponse.json(
      { error: '生成占位符图片失败' },
      { status: 500 }
    )
  }
}