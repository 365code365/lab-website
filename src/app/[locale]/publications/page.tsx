'use client'

import { useState, useEffect } from 'react'
import { Calendar, Award, FileText } from 'lucide-react'
import { useTranslations } from '@/contexts/LocaleContext'

interface Publication {
  id: number
  title: string
  authors: string
  journal: string
  year: number
  type: string
  content?: string
}

const PublicationsPage = () => {
  const [activeTab, setActiveTab] = useState('papers')
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('publications')

  // 获取发表成果数据
  const fetchPublications = async () => {
    try {
      const response = await fetch('/api/publications')
      if (response.ok) {
        const data = await response.json()
        // 处理分页数据格式，提取实际的publications数组
        if (data && Array.isArray(data.data)) {
          setPublications(data.data)
        } else if (Array.isArray(data)) {
          setPublications(data)
        } else {
          console.error('API返回的数据格式不正确:', data)
          setPublications([])
        }
      }
    } catch (error) {
      console.error('获取发表成果失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublications()
  }, [])

  // 分离论文和专利
  const papers = publications.filter(pub => pub.type === 'paper')
  const patents = publications.filter(pub => pub.type === 'patent')



  // 按年份统计
  const yearStats = papers.reduce((acc, paper) => {
    acc[paper.year] = (acc[paper.year] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const years = Object.keys(yearStats).map(Number).sort((a, b) => b - a)

  if (loading) {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">发表成果</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            展示课题组在智能化药物研发领域的研究论文和知识产权成果
          </p>
        </div>

        {/* Timeline Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">发表时间线</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-wrap justify-center gap-8">
              {years.map(year => (
                <div key={year} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{year}</div>
                  <div className="text-sm text-gray-600">{yearStats[year]} 篇论文</div>
                </div>
              ))}
            </div>
          </div>
        </div>



        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex justify-center space-x-8">
              <button
                onClick={() => setActiveTab('papers')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'papers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="inline-block w-4 h-4 mr-2" />
                学术论文 ({papers.length})
              </button>
              <button
                onClick={() => setActiveTab('patents')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'patents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Award className="inline-block w-4 h-4 mr-2" />
                专利成果 ({patents.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Papers Tab */}
        {activeTab === 'papers' && (
          <div className="space-y-6">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-3">
                        论文
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar size={14} className="mr-1" />
                        {paper.year}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {paper.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">作者：</span>{paper.authors}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">期刊：</span>
                      <span className="italic">{paper.journal}</span>
                      <span>, {paper.year}</span>
                    </p>
                    {paper.content && (
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">摘要：</span>{paper.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Patents Tab */}
        {activeTab === 'patents' && (
          <div className="space-y-6">
            {patents.map((patent) => (
              <div key={patent.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-3">
                        专利
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar size={14} className="mr-1" />
                        {patent.year}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {patent.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">发明人：</span>{patent.authors}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">期刊/会议：</span>
                      <span className="italic">{patent.journal}</span>
                      <span>, {patent.year}</span>
                    </p>
                    {patent.content && (
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">描述：</span>{patent.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">成果统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{papers.length}</div>
              <div className="text-gray-600">发表论文</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">{patents.length}</div>
              <div className="text-gray-600">专利申请</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {new Set(publications.map(p => p.journal)).size}
              </div>
              <div className="text-gray-600">合作期刊</div>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}

export default PublicationsPage