'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Search, Code, Database, Brain, Microscope } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from '@/contexts/LocaleContext'

interface Tool {
  id: number
  name: string
  description: string
  category: string
  url?: string
  image?: string
  reference?: string
  tags?: string
  createdAt: string
  updatedAt: string
}

const ToolsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('tools')

  // 从API获取工具数据
  const fetchTools = async () => {
    try {
      const response = await fetch('/api/tools')
      if (response.ok) {
        const result = await response.json()
        // 处理分页格式的API响应，提取实际的tools数组
        const toolsData = result.data || result
        // 确保toolsData是数组格式
        if (Array.isArray(toolsData)) {
          setTools(toolsData)
        } else {
          console.error('API返回的数据格式不正确，期望数组格式')
          setTools([])
        }
      } else {
        console.error('获取工具数据失败')
      }
    } catch (error) {
      console.error('获取工具数据失败:', error)
      setTools([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [])

  const categories = [
    { id: 'all', name: '全部', icon: Code },
    { id: '数据分析', name: '数据分析', icon: Database },
    { id: '分子设计', name: '分子设计', icon: Microscope },
    { id: '人工智能', name: '人工智能', icon: Brain },
    { id: '数据库', name: '数据库', icon: Database },
    { id: '结构预测', name: '结构预测', icon: Microscope },
    { id: '可视化', name: '可视化', icon: Code }
  ]

  // 过滤工具
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">程序开发</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            展示课题组开发的科研工具和系统平台，突出技术成果与可用性
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="搜索工具名称或描述..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <IconComponent size={16} className="mr-2" />
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载中...</h3>
            <p className="text-gray-600">正在获取工具数据</p>
          </div>
        ) : (
          <>
            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredTools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Tool Image */}
              <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                {tool.image ? (
                  <Image 
                    src={tool.image} 
                    alt={tool.name}
                    width={400}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">工具截图</span>
                )}
              </div>

              <div className="p-6">
                {/* Tool Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{tool.name}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {tool.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {tool.description}
                </p>

                {/* Tags */}
                {tool.tags && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {tool.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Reference */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 italic">
                    {tool.reference}
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex gap-2">
                  {tool.url ? (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      查看详情
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <div className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium text-center">
                      开发中
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
            </div>

            {/* No Results */}
            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关工具</h3>
                <p className="text-gray-600">请尝试调整搜索关键词或筛选条件</p>
              </div>
            )}
          </>
        )}


        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">开发统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{tools.length}</div>
              <div className="text-gray-600">开发工具</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {new Set(tools.map(t => t.category)).size}
              </div>
              <div className="text-gray-600">技术领域</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600">下载次数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">50+</div>
              <div className="text-gray-600">合作用户</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolsPage