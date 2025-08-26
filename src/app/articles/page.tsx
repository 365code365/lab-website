'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, ExternalLink, Search } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: number
  title: string
  authors: string
  journal: string
  publishedDate: string
  doi?: string
  abstract?: string
  keywords?: string
  impactFactor?: number
  category: string
  citationCount?: number
  openAccess: boolean
  createdAt: string
  updatedAt: string
}

const ArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('publishedDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const categories = [
    { value: '', label: '全部类别' },
    { value: 'research', label: '研究文章' },
    { value: 'review', label: '综述文章' },
    { value: 'conference', label: '会议论文' },
    { value: 'book', label: '书籍章节' },
    { value: 'other', label: '其他' }
  ]

  // 获取文章数据
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory })
      })

      const response = await fetch(`/api/articles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      } else {
        console.error('获取文章失败')
        setArticles([])
      }
    } catch (error) {
      console.error('获取文章失败:', error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy, sortOrder])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1)
    fetchArticles()
  }

  // 按年份统计
  const yearStats = articles.reduce((acc, article) => {
    const year = new Date(article.publishedDate).getFullYear()
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const years = Object.keys(yearStats).map(Number).sort((a, b) => b - a)

  // 按类别统计（暂时注释掉未使用的变量）
  // const categoryStats = articles.reduce((acc, article) => {
  //   acc[article.category] = (acc[article.category] || 0) + 1
  //   return acc
  // }, {} as Record<string, number>)

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">学术文章</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            展示课题组在智能化药物研发领域的最新研究文章和学术成果
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜索文章标题、作者或关键词..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
            </div>

            {/* 类别筛选 */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 排序 */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="publishedDate-desc">发表时间 (最新)</option>
                <option value="publishedDate-asc">发表时间 (最早)</option>
                <option value="citationCount-desc">引用次数 (高到低)</option>
                <option value="impactFactor-desc">影响因子 (高到低)</option>
                <option value="title-asc">标题 (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
            <div className="text-sm text-gray-600">
              共找到 {total} 篇文章
            </div>
          </div>
        </div>

        {/* Timeline Stats */}
        {years.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">发表时间线</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap justify-center gap-8">
                {years.slice(0, 8).map(year => (
                  <div key={year} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{year}</div>
                    <div className="text-sm text-gray-600">{yearStats[year]} 篇文章</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="space-y-6 mb-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded mr-3 ${
                      article.category === 'research' ? 'bg-blue-100 text-blue-800' :
                      article.category === 'review' ? 'bg-green-100 text-green-800' :
                      article.category === 'conference' ? 'bg-purple-100 text-purple-800' :
                      article.category === 'book' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {categories.find(c => c.value === article.category)?.label || article.category}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar size={14} className="mr-1" />
                      {new Date(article.publishedDate).toLocaleDateString('zh-CN')}
                    </div>
                    {article.openAccess && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                        开放获取
                      </span>
                    )}
                  </div>
                  
                  <Link href={`/articles/${article.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                      {article.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">作者：</span>{article.authors}
                  </p>
                  
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">期刊：</span>
                    <span className="italic">{article.journal}</span>
                    {article.impactFactor && (
                      <span className="ml-2 text-sm text-blue-600">
                        (IF: {article.impactFactor})
                      </span>
                    )}
                  </p>
                  
                  {article.keywords && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">关键词：</span>
                      <span className="text-sm">{article.keywords}</span>
                    </p>
                  )}
                  
                  {article.abstract && (
                    <div className="text-gray-600 text-sm line-clamp-3">
                      <span className="font-medium">摘要：</span>
                      {(() => {
                        try {
                          const parsedData = JSON.parse(article.abstract)
                          if (parsedData.type === 'academic_paper' && parsedData.parsedInfo) {
                            const info = parsedData.parsedInfo
                            return (
                              <span>
                                {info.title && `标题: ${info.title}. `}
                                {info.authors && `作者: ${info.authors}. `}
                                {info.journal && `期刊: ${info.journal}. `}
                                {info.publishedDate && `年份: ${info.publishedDate}.`}
                              </span>
                            )
                          }
                        } catch (e) {
                          // 如果不是JSON格式，显示原始内容
                        }
                        return article.abstract
                      })()} 
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {article.citationCount !== undefined && (
                        <span>引用: {article.citationCount}</span>
                      )}
                      {article.doi && (
                        <a
                          href={`https://doi.org/${article.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          DOI
                        </a>
                      )}
                    </div>
                    
                    <Link
                      href={`/articles/${article.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      查看详情 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mb-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">文章统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{total}</div>
              <div className="text-gray-600">总文章数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {articles.filter(a => a.openAccess).length}
              </div>
              <div className="text-gray-600">开放获取</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {new Set(articles.map(a => a.journal)).size}
              </div>
              <div className="text-gray-600">合作期刊</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {articles.reduce((sum, a) => sum + (a.citationCount || 0), 0)}
              </div>
              <div className="text-gray-600">总引用数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArticlesPage