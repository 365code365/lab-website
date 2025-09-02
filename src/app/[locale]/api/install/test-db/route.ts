import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

interface DatabaseConfig {
  host: string
  port: string
  username: string
  password: string
  database: string
}

export async function POST(request: NextRequest) {
  try {
    const config: DatabaseConfig = await request.json()
    
    // 验证必填字段
    if (!config.host || !config.port || !config.username || !config.database) {
      return NextResponse.json(
        { error: '请填写所有必填的数据库配置字段' },
        { status: 400 }
      )
    }
    
    // 首先连接到MySQL服务器（不指定数据库）
    const serverConnection = await mysql.createConnection({
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password,
      connectTimeout: 10000, // 10秒超时
      acquireTimeout: 10000,
      timeout: 10000
    })
    
    try {
      // 测试服务器连接
      await serverConnection.execute('SELECT 1')
      
      // 检查数据库是否存在
      const escapedDbName = mysql.escape(config.database)
      const [databases] = await serverConnection.execute(
        `SHOW DATABASES LIKE ${escapedDbName}`
      ) as unknown[]
      
      // 如果数据库不存在，则创建它
      if (databases.length === 0) {
        console.log(`数据库 ${config.database} 不存在，正在创建...`)
        await serverConnection.execute(
          `CREATE DATABASE \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        )
        console.log(`数据库 ${config.database} 创建成功`)
      } else {
        console.log(`数据库 ${config.database} 已存在`)
      }
      
    } finally {
      await serverConnection.end()
    }
    
    // 现在连接到指定的数据库进行最终测试
    const dbConnection = await mysql.createConnection({
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000
    })
    
    // 测试数据库连接
    await dbConnection.execute('SELECT 1')
    
    // 关闭连接
    await dbConnection.end()
    
    return NextResponse.json(
      { success: true, message: '数据库连接测试成功，数据库已准备就绪' },
      { status: 200 }
    )
    
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }
    console.error('数据库连接测试失败:', error)
    
    let errorMessage = '数据库连接失败'
    
    if (err.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到数据库服务器，请检查主机和端口'
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = '数据库用户名或密码错误'
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      errorMessage = '指定的数据库不存在'
    } else if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
      errorMessage = '用户没有创建数据库的权限，请联系数据库管理员'
    } else if (err.code === 'ER_DB_CREATE_EXISTS') {
      errorMessage = '数据库已存在'
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = '数据库连接超时'
    } else if (err.message && err.message.includes('CREATE')) {
      errorMessage = '创建数据库失败，请检查用户权限'
    } else if (err.message) {
      errorMessage = err.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}