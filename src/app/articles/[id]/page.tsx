'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, ExternalLink, ArrowLeft, FileText, Users, Tag } from 'lucide-react'
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

const ArticleDetailPage = () => {
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = {
    'research': '研究文章',
    'review': '综述文章',
    'conference': '会议论文',
    'book': '书籍章节',
    'other': '其他'
  }

  // 获取文章详情
  const fetchArticle = useCallback(async () => {
    if (!params?.id) {
      setError('文章ID不存在')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data)
      } else if (response.status === 404) {
        setError('文章不存在')
      } else {
        setError('获取文章详情失败')
      }
    } catch (error) {
      console.error('获取文章详情失败:', error)
      setError('获取文章详情失败')
    } finally {
      setLoading(false)
    }
  }, [params?.id])

  useEffect(() => {
    if (params?.id) {
      fetchArticle()
    }
  }, [fetchArticle, params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error || '文章不存在'}</div>
          <Link
            href="/articles"
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            返回文章列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/articles"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 gap-2"
          >
            <ArrowLeft size={16} />
            返回文章列表
          </Link>
        </div>

        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-4">
            <span className={`text-sm font-medium px-3 py-1 rounded-full mr-4 ${
              article.category === 'research' ? 'bg-blue-100 text-blue-800' :
              article.category === 'review' ? 'bg-green-100 text-green-800' :
              article.category === 'conference' ? 'bg-purple-100 text-purple-800' :
              article.category === 'book' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {categories[article.category as keyof typeof categories] || article.category}
            </span>
            {article.openAccess && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                开放获取
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Article Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-start">
                <Users className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">作者</div>
                  <div className="text-gray-600">{article.authors}</div>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">期刊</div>
                  <div className="text-gray-600">
                    {article.journal}
                    {article.impactFactor && (
                      <span className="ml-2 text-blue-600 font-medium">
                        (IF: {article.impactFactor})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">发表日期</div>
                  <div className="text-gray-600">
                    {new Date(article.publishedDate).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {article.citationCount !== undefined && (
                <div className="flex items-start">
                  <ExternalLink className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">引用次数</div>
                    <div className="text-gray-600">{article.citationCount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DOI and External Links */}
          {article.doi && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">DOI</div>
                  <div className="text-gray-600 font-mono text-sm">{article.doi}</div>
                </div>
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 gap-2"
                >
                  <ExternalLink size={16} />
                  查看原文
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Keywords */}
        {article.keywords && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <Tag className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">关键词</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.keywords.split(',').map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Abstract */}
        {article.abstract && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">摘要</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {(() => {
                try {
                  const parsedData = JSON.parse(article.abstract)
                  if (parsedData.type === 'academic_paper' && parsedData.parsedInfo) {
                    const info = parsedData.parsedInfo
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="font-semibold text-gray-900">标题：</span>
                            <span className="text-gray-700">{info.title || '未知'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">作者：</span>
                            <span className="text-gray-700">{info.authors || '未知'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">期刊：</span>
                            <span className="text-gray-700">{info.journal || '未知'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">发表年份：</span>
                            <span className="text-gray-700">{info.publishedDate || '未知'}</span>
                          </div>
                          {info.volume && (
                            <div>
                              <span className="font-semibold text-gray-900">卷号：</span>
                              <span className="text-gray-700">{info.volume}</span>
                            </div>
                          )}
                          {info.issue && (
                            <div>
                              <span className="font-semibold text-gray-900">期号：</span>
                              <span className="text-gray-700">{info.issue}</span>
                            </div>
                          )}
                          {info.pages && (
                            <div>
                              <span className="font-semibold text-gray-900">页码：</span>
                              <span className="text-gray-700">{info.pages}</span>
                            </div>
                          )}
                          {info.doi && (
                            <div>
                              <span className="font-semibold text-gray-900">DOI：</span>
                              <a 
                                href={`https://doi.org/${info.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {info.doi}
                              </a>
                            </div>
                          )}
                        </div>
                        {parsedData.originalContent && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="font-semibold text-gray-900">原始内容：</span>
                            <div className="mt-2 text-gray-700">{parsedData.originalContent}</div>
                          </div>
                        )}
                      </div>
                    )
                  }
                } catch (e) {
                  // 如果不是JSON格式，显示原始内容
                }
                return article.abstract
              })()} 
            </div>
          </div>
        )}

        {/* Article Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">文章信息</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {new Date(article.publishedDate).getFullYear()}
              </div>
              <div className="text-sm text-gray-600">发表年份</div>
            </div>
            
            {article.impactFactor && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {article.impactFactor}
                </div>
                <div className="text-sm text-gray-600">影响因子</div>
              </div>
            )}
            
            {article.citationCount !== undefined && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {article.citationCount}
                </div>
                <div className="text-sm text-gray-600">引用次数</div>
              </div>
            )}
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {article.openAccess ? '是' : '否'}
              </div>
              <div className="text-sm text-gray-600">开放获取</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 gap-2"
          >
            <ArrowLeft size={16} />
            返回文章列表
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ArticleDetailPage