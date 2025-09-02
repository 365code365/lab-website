import { NextResponse } from 'next/server'

// 生成测试数据的API路由
export async function POST() {
  try {
    // 执行 Prisma seed 命令
    const projectRoot = process.cwd()
    const command = 'npx prisma db seed'
    
    console.log('开始执行 seed 脚本...')
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      env: { ...process.env }
    })
    
    // 过滤掉 Prisma 和 Node.js 的正常信息输出，只处理真正的错误
    if (stderr) {
      const filteredStderr = stderr
        .split('\n')
        .filter(line => {
          // 忽略各种正常的警告和信息输出
          return !line.includes('Environment variables loaded from') &&
                 !line.includes('ExperimentalWarning') &&
                 !line.includes('DeprecationWarning') &&
                 !line.includes('MODULE_TYPELESS_PACKAGE_JSON') &&
                 !line.includes('Type Stripping is an experimental feature') &&
                 !line.includes('Reparsing as ES module') &&
                 !line.includes('Use `node --trace-warnings') &&
                 !line.includes('For more information, see: https://pris.ly/prisma-config') &&
                 !line.includes('warn') &&
                 !line.startsWith('(node:') &&
                 line.trim() !== ''
        })
        .join('\n')
      
      if (filteredStderr) {
        console.error('Seed 执行错误:', filteredStderr)
        return NextResponse.json(
          { error: 'Seed 脚本执行失败', details: filteredStderr },
          { status: 500 }
        )
      } else {
        // 只有正常的信息输出，记录为调试信息
        console.log('Seed 脚本信息:', stderr)
      }
    }
    
    console.log('Seed 脚本执行成功:', stdout)
    
    return NextResponse.json({
      success: true,
      message: '测试数据生成成功',
      output: stdout
    })
    
  } catch (error) {
    console.error('执行 seed 脚本时发生错误:', error)
    
    return NextResponse.json(
      { 
        error: '执行 seed 脚本失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}