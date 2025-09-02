'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from '@/contexts/LocaleContext'
import { Award, Upload, Search, Calendar, User, Trophy, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AwardRecord {
  id: string
  serialNumber?: string
  awardee: string
  awardDate?: Date
  awardName: string
  advisor?: string
  remarks?: string
  createdAt: Date
  updatedAt: Date
}

const AwardsPage = () => {
  const [awards, setAwards] = useState<AwardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const t = useTranslations('awards')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    errors?: string[];
    details?: string[];
  } | null>(null)
  const [showImportForm, setShowImportForm] = useState(false)

  // 获取获奖记录
  const fetchAwards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/awards')
      if (response.ok) {
        const data = await response.json()
        // 处理分页数据格式，确保awards是数组
        const awardsData = data.data || data
        setAwards(Array.isArray(awardsData) ? awardsData : [])
      } else {
        console.error('获取获奖记录失败')
      }
    } catch (error) {
      console.error('获取获奖记录失败:', error)
      setAwards([]) // 确保在错误情况下awards是空数组
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAwards()
  }, [])

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  // 处理Excel导入
  const handleImport = async () => {
    if (!selectedFile) {
      alert('请选择要导入的Excel文件')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/awards/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setImportResult(result)

      if (response.ok) {
        // 导入成功，刷新数据
        await fetchAwards()
        setSelectedFile(null)
        setShowImportForm(false)
      }
    } catch (error) {
      console.error('导入失败:', error)
      setImportResult({
        success: false,
        error: '导入过程中发生错误，请重试'
      })
    } finally {
      setImporting(false)
    }
  }

  // 过滤获奖记录
  const filteredAwards = awards.filter(award =>
    award.awardee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    award.awardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (award.advisor && award.advisor.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // 格式化日期
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '未设置'
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
                <p className="text-gray-600 mt-1">实验室成员获奖记录展示</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Excel导入表单 */}
        {showImportForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Excel文件导入</span>
              </CardTitle>
              <CardDescription>
                支持导入包含以下字段的Excel文件：序号、获奖人员、获奖时间、获奖名称及等级、指导老师、备注
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    已选择文件: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? '导入中...' : '开始导入'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportForm(false)
                    setSelectedFile(null)
                    setImportResult(null)
                  }}
                >
                  取消
                </Button>
              </div>

              {/* 导入结果 */}
              {importResult && (
                <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                    {importResult.success ? (
                      <div>
                        <p className="font-medium">{importResult.message}</p>
                        {importResult.errors && importResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm">警告信息:</p>
                            <ul className="text-sm list-disc list-inside">
                              {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                              {importResult.errors.length > 5 && (
                                <li>...还有 {importResult.errors.length - 5} 个警告</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">导入失败: {importResult.error}</p>
                        {importResult.details && (
                          <div className="mt-2">
                            <p className="text-sm">详细信息:</p>
                            <ul className="text-sm list-disc list-inside">
                              {importResult.details.slice(0, 5).map((detail: string, index: number) => (
                                <li key={index}>{detail}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{awards.length}</p>
                  <p className="text-gray-600">总获奖数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(awards.map(award => award.awardee)).size}
                  </p>
                  <p className="text-gray-600">获奖人数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {awards.filter(award => award.awardDate && new Date(award.awardDate).getFullYear() === new Date().getFullYear()).length}
                  </p>
                  <p className="text-gray-600">本年获奖</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 获奖记录列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Award size={48} className="mx-auto animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载中...</h3>
            <p className="text-gray-600">正在获取获奖记录</p>
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Trophy size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t('noRecordsFound') : t('noRecords')}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? '请尝试其他搜索关键词' : '使用Excel导入功能添加获奖记录'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAwards.map((award) => (
              <Card key={award.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {award.awardName}
                        </h3>
                        {award.serialNumber && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                            #{award.serialNumber}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">获奖人员:</span>
                          <span className="font-medium">{award.awardee}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">获奖时间:</span>
                          <span>{formatDate(award.awardDate)}</span>
                        </div>
                        
                        {award.advisor && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">指导老师:</span>
                            <span>{award.advisor}</span>
                          </div>
                        )}
                      </div>
                      
                      {award.remarks && (
                        <div className="mt-3 flex items-start space-x-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-600 text-sm">备注:</span>
                            <p className="text-gray-800 text-sm mt-1">{award.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AwardsPage