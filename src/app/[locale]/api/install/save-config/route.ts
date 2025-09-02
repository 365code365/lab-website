import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface DatabaseConfig {
  host: string
  port: string
  username: string
  password: string
  database: string
}

export async function POST(request: NextRequest) {
  try {
    const { dbConfig }: { dbConfig: DatabaseConfig } = await request.json()
    
    // 验证必填字段
    if (!dbConfig.host || !dbConfig.port || !dbConfig.username || !dbConfig.database) {
      return NextResponse.json(
        { error: '请填写所有必填的数据库配置字段' },
        { status: 400 }
      )
    }
    
    // 构建数据库URL
    const databaseUrl = `mysql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
    
    // 准备环境变量内容
    const envContent = `# Database Configuration
DATABASE_URL="${databaseUrl}"

# NextAuth Configuration
NEXTAUTH_SECRET="${generateRandomSecret()}"
NEXTAUTH_URL="http://localhost:3000"

# Installation Status
SYSTEM_INSTALLED="false"
`
    
    // 获取项目根目录
    const projectRoot = process.cwd()
    const envPath = path.join(projectRoot, '.env')
    
    // 写入.env文件
    await fs.writeFile(envPath, envContent, 'utf8')
    
    return NextResponse.json(
      { success: true, message: '数据库配置已保存' },
      { status: 200 }
    )
    
  } catch (error: unknown) {
    console.error('保存数据库配置失败:', error)
    
    return NextResponse.json(
      { error: '保存配置文件失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// 生成随机密钥
function generateRandomSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}