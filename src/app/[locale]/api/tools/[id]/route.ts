import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'

// 获取单个开发工具
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const tool = await db.tool.findUnique({
      where: { id: parseInt(resolvedParams.id) }
    })

    if (!tool) {
      return NextResponse.json(
        { error: '开发工具不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(tool)
  } catch (error) {
    console.error('获取开发工具失败:', error)
    return NextResponse.json(
      { error: '获取开发工具失败' },
      { status: 500 }
    )
  }
}

// 更新开发工具
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    const body = await request.json()
    const {
      name,
      description,
      shortDescription,
      version,
      type,
      category,
      tags,
      authors,
      maintainers,
      license,
      homepage,
      repository,
      documentation,
      downloadUrl,
      demoUrl,
      url,
      image,
      screenshots,
      features,
      requirements,
      installation,
      usage,
      changelog,
      reference,
      status,
      visibility,
      featured,
      downloads,
      stars,
      forks,
      issues,
      releaseDate,
      lastUpdate
    } = body

    // 准备更新数据
    const updateData: Record<string, unknown> = {}
    
    // 只更新提供的字段
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (version !== undefined) updateData.version = version
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (authors !== undefined) updateData.authors = authors
    if (maintainers !== undefined) updateData.maintainers = maintainers
    if (license !== undefined) updateData.license = license
    if (homepage !== undefined) updateData.homepage = homepage
    if (repository !== undefined) updateData.repository = repository
    if (documentation !== undefined) updateData.documentation = documentation
    if (downloadUrl !== undefined) updateData.downloadUrl = downloadUrl
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl
    if (url !== undefined) updateData.url = url
    if (image !== undefined) updateData.image = image
    if (screenshots !== undefined) updateData.screenshots = screenshots
    if (features !== undefined) updateData.features = features
    if (requirements !== undefined) updateData.requirements = requirements
    if (installation !== undefined) updateData.installation = installation
    if (usage !== undefined) updateData.usage = usage
    if (changelog !== undefined) updateData.changelog = changelog
    if (reference !== undefined) updateData.reference = reference
    if (status !== undefined) updateData.status = status
    if (visibility !== undefined) updateData.visibility = visibility
    if (featured !== undefined) updateData.featured = featured
    if (downloads !== undefined) updateData.downloads = downloads
    if (stars !== undefined) updateData.stars = stars
    if (forks !== undefined) updateData.forks = forks
    if (issues !== undefined) updateData.issues = issues
    if (releaseDate !== undefined) updateData.releaseDate = new Date(releaseDate)
    if (lastUpdate !== undefined) updateData.lastUpdate = new Date(lastUpdate)

    const tool = await db.tool.update({
      where: { id: parseInt(resolvedParams.id) },
      data: updateData
    })

    return NextResponse.json(tool)
  } catch (error) {
    console.error('更新开发工具失败:', error)
    return NextResponse.json(
      { error: '更新开发工具失败' },
      { status: 500 }
    )
  }
}

// 删除开发工具
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  // 验证管理员权限
  const authResult = await requireAdmin(request)
  if (authResult) return authResult
  
  try {
    await db.tool.delete({
      where: { id: parseInt(resolvedParams.id) }
    })

    return NextResponse.json({ message: '开发工具删除成功' })
  } catch (error) {
    console.error('删除开发工具失败:', error)
    return NextResponse.json(
      { error: '删除开发工具失败' },
      { status: 500 }
    )
  }
}