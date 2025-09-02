import { NextResponse } from 'next/server'
import { isSystemInstalled, getInstallationInfo } from '@/lib/install-check'

export async function GET() {
  try {
    const installed = await isSystemInstalled()
    
    if (installed) {
      const installInfo = await getInstallationInfo()
      return NextResponse.json({
        installed: true,
        installInfo
      })
    } else {
      return NextResponse.json({
        installed: false
      })
    }
  } catch (error: unknown) {
    console.error('检查安装状态失败:', error)
    return NextResponse.json(
      { error: '检查安装状态失败' },
      { status: 500 }
    )
  }
}