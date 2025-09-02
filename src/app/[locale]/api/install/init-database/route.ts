import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const projectRoot = process.cwd()
    
    // 运行Prisma数据库推送
    console.log('开始初始化数据库...')
    
    try {
      // 生成Prisma客户端
      console.log('生成Prisma客户端...')
      const { stderr: generateStderr } = await execAsync(
        'npx prisma generate',
        { cwd: projectRoot }
      )
      
      if (generateStderr && !generateStderr.includes('warn')) {
        console.error('Prisma生成错误:', generateStderr)
      }
      
      console.log('Prisma客户端生成完成')
      
      // 推送数据库架构
      console.log('推送数据库架构...')
      const { stderr: pushStderr } = await execAsync(
        'npx prisma db push --force-reset',
        { cwd: projectRoot }
      )
      
      if (pushStderr && !pushStderr.includes('warn')) {
        console.error('数据库推送错误:', pushStderr)
      }
      
      console.log('数据库架构推送完成')
      
      // 运行数据库种子（如果存在）
      try {
        console.log('运行数据库种子...')
        const { stderr: seedStderr } = await execAsync(
          'npx prisma db seed',
          { cwd: projectRoot }
        )
        
        if (seedStderr && !seedStderr.includes('warn')) {
          console.warn('数据库种子警告:', seedStderr)
        }
        
        console.log('数据库种子运行完成')
      } catch {
         // 种子文件可能不存在，这是正常的
         console.log('没有找到种子文件，跳过种子步骤')
       }
      
    } catch (prismaError: unknown) {
      console.error('Prisma操作失败:', prismaError)
      throw new Error(`数据库初始化失败: ${prismaError instanceof Error ? prismaError.message : String(prismaError)}`)
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: '数据库初始化成功',
        details: {
          tablesCreated: true,
          clientGenerated: true,
          schemaApplied: true
        }
      },
      { status: 200 }
    )
    
  } catch (error: unknown) {
    console.error('数据库初始化失败:', error)
    
    let errorMessage = '数据库初始化失败'
    
    if (error.message.includes('Environment variable not found')) {
      errorMessage = '数据库配置环境变量未找到，请先保存数据库配置'
    } else if (error.message.includes('Can\'t reach database server')) {
      errorMessage = '无法连接到数据库服务器，请检查数据库配置'
    } else if (error.message.includes('Access denied')) {
      errorMessage = '数据库访问被拒绝，请检查用户名和密码'
    } else if (error.message.includes('Unknown database')) {
      errorMessage = '数据库连接失败，请检查数据库配置是否正确'
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}