import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    const projectRoot = process.cwd()
    const envPath = path.join(projectRoot, '.env')
    
    // 读取现有的.env文件
    let envContent = ''
    try {
      envContent = await fs.readFile(envPath, 'utf8')
    } catch {
      // 如果.env文件不存在，创建基本内容
      envContent = '# Environment Variables\n'
    }
    
    // 更新SYSTEM_INSTALLED状态
    if (envContent.includes('SYSTEM_INSTALLED=')) {
      // 替换现有的SYSTEM_INSTALLED值
      envContent = envContent.replace(
        /SYSTEM_INSTALLED="?[^"\n]*"?/g,
        'SYSTEM_INSTALLED="true"'
      )
    } else {
      // 添加SYSTEM_INSTALLED配置
      envContent += '\n# Installation Status\nSYSTEM_INSTALLED="true"\n'
    }
    
    // 写入更新后的.env文件
    await fs.writeFile(envPath, envContent, 'utf8')
    
    // 创建安装完成标记文件
    const installFlagPath = path.join(projectRoot, '.installed')
    const installInfo = {
      installedAt: new Date().toISOString(),
      version: '1.0.0',
      status: 'completed'
    }
    
    await fs.writeFile(
      installFlagPath, 
      JSON.stringify(installInfo, null, 2), 
      'utf8'
    )
    
    return NextResponse.json(
      { 
        success: true, 
        message: '系统安装完成',
        installedAt: installInfo.installedAt
      },
      { status: 200 }
    )
    
  } catch (error: unknown) {
    console.error('标记安装完成失败:', error)
    
    return NextResponse.json(
      { error: '标记安装完成失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}