import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth-middleware'
import * as XLSX from 'xlsx'

// Excel导入获奖数据
export async function POST(request: NextRequest) {
  try {
    const currentUserId = getCurrentUserId(request)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sheetName = formData.get('sheetName') as string

    if (!file) {
      return NextResponse.json(
        { error: '请选择要导入的Excel文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '请上传Excel文件(.xlsx或.xls格式)' },
        { status: 400 }
      )
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    // 使用指定的工作表名称，如果没有指定则使用第一个工作表
    const targetSheetName = sheetName || workbook.SheetNames[0]
    
    // 验证工作表是否存在
    if (!workbook.SheetNames.includes(targetSheetName)) {
      return NextResponse.json(
        { error: `工作表 "${targetSheetName}" 不存在` },
        { status: 400 }
      )
    }
    
    const worksheet = workbook.Sheets[targetSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json(
        { error: 'Excel文件中没有数据' },
        { status: 400 }
      )
    }

    // 验证Excel表头
    const requiredHeaders = ['序号', '获奖人员', '获奖时间', '获奖名称及等级', '指导老师']
    const firstRow = jsonData[0] as Record<string, unknown>
    const headers = Object.keys(firstRow)
    
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Excel文件缺少必要的表头: ${missingHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    // 处理数据并逐条检查重复
    const errors = []
    let insertedCount = 0
    let duplicateCount = 0
    const duplicateRecords: any[] = []

    // 处理日期字段 - 直接存储原始字符串格式
    const parseDate = (dateValue: unknown) => {
      if (!dateValue) return null
      
      // 直接返回字符串格式，保持原始数据
      return String(dateValue).trim()
    }

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, unknown>
      
      try {
        // 验证必填字段
        if (!row['获奖人员']) {
          errors.push(`第${i + 2}行: 获奖人员不能为空`)
          continue
        }

        if (!row['获奖名称及等级']) {
          errors.push(`第${i + 2}行: 获奖名称及等级不能为空`)
          continue
        }

        const awardData = {
          serialNumber: row['序号'] ? String(row['序号']) : null,
          awardee: String(row['获奖人员']).trim(),
          awardDate: parseDate(row['获奖时间']),
          awardName: String(row['获奖名称及等级']).trim(),
          advisor: row['指导老师'] ? String(row['指导老师']).trim() : null,
          remarks: row['备注'] ? String(row['备注']).trim() : null,
          createdBy: currentUserId,
          updatedBy: currentUserId
        }
        
        console.log(`处理第${i + 2}行数据:`, awardData)

        // 检查重复记录 - 支持多获奖者顺序判断
        const normalizedAwardee = normalizeAwardeeNames(awardData.awardee)
        
        const existingAwards = await db.award.findMany({
          where: {
            awardName: awardData.awardName
          }
        })
        
        // 检查是否存在相同的获奖者组合
        const isDuplicate = existingAwards.some(existing => {
          const existingNormalized = normalizeAwardeeNames(existing.awardee)
          return existingNormalized === normalizedAwardee
        })

        if (isDuplicate) {
          duplicateRecords.push({
            awardee: awardData.awardee,
            awardName: awardData.awardName,
            row: i + 2
          })
          duplicateCount++
          console.log(`跳过重复记录: ${awardData.awardee} - ${awardData.awardName}`)
          continue
        }

        // 插入新记录
        await db.award.create({
          data: awardData
        })
        insertedCount++
        
      } catch (error) {
        console.error(`插入第${i + 2}行数据失败:`, error)
        errors.push(`第${i + 2}行: 插入失败 - ${error}`)
      }
    }

    console.log(`数据库插入完成: ${insertedCount} 条记录，跳过重复记录 ${duplicateCount} 条`)

    // 构建返回消息
    let message = `成功导入 ${insertedCount} 条获奖记录`
    if (duplicateCount > 0) {
      message += `，跳过重复记录 ${duplicateCount} 条`
    }
    if (errors.length > 0) {
      message += `，${errors.length} 条记录导入失败`
    }

    return NextResponse.json({
      success: true,
      message,
      insertedCount,
      duplicateCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      duplicateRecords: duplicateRecords.length > 0 ? duplicateRecords : undefined
    })

  } catch (error) {
    console.error('Excel导入失败:', error)
    return NextResponse.json(
      { error: '导入失败，请检查文件格式和内容' },
      { status: 500 }
    )
  }
}

// 标准化获奖者姓名，处理多获奖者顺序问题
function normalizeAwardeeNames(awardee: string): string {
  if (!awardee) return ''
  
  // 分割获奖者姓名（支持中文顿号、英文逗号、中文逗号等分隔符）
  const names = awardee.split(/[、，,]/).map(name => name.trim()).filter(name => name.length > 0)
  
  // 按字母顺序排序，确保相同的获奖者组合有相同的标准化结果
  return names.sort().join('、')
}