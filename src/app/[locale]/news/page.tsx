'use client'

import { Calendar, User } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from '@/contexts/LocaleContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface News {
  id: number
  title: string
  summary?: string
  content: string
  image?: string
  isPinned?: boolean
  createdAt: string
  updatedAt?: string
}

const NewsPage = () => {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('news')
  const [error, setError] = useState<string | null>(null)

  // 从API获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        console.log('开始获取新闻数据...')
        const response = await fetch('/api/news')
        console.log('API响应状态:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url
        })
        
        if (!response.ok) {
          throw new Error(`获取新闻数据失败: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('获取到的数据:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          data: data
        })
        // 确保data是数组，如果不是则设置为空数组

        console.log('data',data)
        setNews(data?.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '获取新闻数据失败'
        setError(errorMessage)
        console.error('获取新闻数据失败:', err)
        console.error('错误详情:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  // 示例数据 - 作为后备数据
  const fallbackNews = [
    {
      id: 1,
      title: "课题组在Nature Computational Science发表重要研究成果",
      summary: "我们的最新研究'Leveraging Electron Clouds as a Latent Variable to Scale Up Structure: Insect Molecular Design'被Nature Computational Science接收发表。",
      content: "这项研究提出了一种创新的分子设计方法，通过将电子云作为潜在变量来扩展结构设计，在昆虫分子设计领域取得了重要突破。该方法能够显著提高分子设计的效率和准确性，为药物发现提供了新的思路和工具。",
      image: "/api/placeholder/400/250",
      isPinned: true,
      createdAt: "2024-12-15",
      updatedAt: "2024-12-15"
    },
    {
      id: 2,
      title: "课题组获得国家自然科学基金重点项目资助",
      summary: "我们申请的'基于人工智能的智能化药物设计关键技术研究'项目获得国家自然科学基金重点项目资助，资助金额300万元。",
      content: "该项目将重点研究基于深度学习的分子生成算法、药物-靶点相互作用预测模型以及多目标药物优化方法。项目执行期为4年，预期将在智能化药物设计领域取得重要进展，培养一批高水平研究人才。",
      image: "/api/placeholder/400/250",
      isPinned: false,
      createdAt: "2024-11-20",
      updatedAt: "2024-11-20"
    },
    {
      id: 3,
      title: "第三届智能化药物设计国际研讨会成功举办",
      summary: "由我们课题组主办的第三届智能化药物设计国际研讨会在北京成功举办，来自全球20多个国家的200余名专家学者参会。",
      content: "本次研讨会以'AI驱动的药物发现：机遇与挑战'为主题，邀请了多位国际知名专家作主题报告，深入探讨了人工智能在药物设计中的最新进展和未来发展方向。会议促进了国际合作与交流，推动了领域发展。",
      image: "/api/placeholder/400/250",
      isPinned: false,
      createdAt: "2024-10-15",
      updatedAt: "2024-10-15"
    },
    {
      id: 4,
      title: "课题组博士生获得优秀学位论文奖",
      summary: "我们课题组博士生李明的学位论文'基于图神经网络的药物分子性质预测研究'获得校级优秀博士学位论文奖。",
      content: "李明同学在博士期间专注于图神经网络在药物分子性质预测中的应用研究，提出了多项创新算法，发表高质量论文5篇，其中SCI一区论文3篇。该研究成果已被多个制药公司采用，具有重要的实用价值。",
      image: "/api/placeholder/400/250",
      createdAt: "2024-09-10",
      author: "教务处",
      tags: ["学生获奖", "学位论文", "图神经网络"]
    },
    {
      id: 5,
      title: "课题组与知名制药公司建立战略合作关系",
      summary: "我们课题组与某知名制药公司签署战略合作协议，将在AI药物设计、临床前研究等方面开展深度合作。",
      content: "此次合作将充分发挥双方优势，课题组提供先进的AI算法和技术支持，制药公司提供丰富的数据资源和产业化平台。合作期间将共同开发新的药物设计工具，推进多个候选药物的研发进程。",
      image: "/api/placeholder/400/250",
      createdAt: "2024-08-25",
      author: "合作办",
      tags: ["产业合作", "战略协议", "药物研发"]
    },
    {
      id: 6,
      title: "课题组开源工具BioMedR获得广泛关注",
      summary: "我们开发的生物医学数据分析工具BioMedR在GitHub上获得1000+星标，被全球多个研究机构采用。",
      content: "BioMedR是一个集成的生物医学数据分析R包，提供了从数据预处理到统计分析的完整流水线。该工具已被下载超过10万次，在生物信息学和药物研发领域得到广泛应用，为开源科研软件发展做出了重要贡献。",
      image: "/api/placeholder/400/250",
      createdAt: "2024-07-30",
      author: "开发团队",
      tags: ["开源软件", "工具发布", "数据分析"]
    }
  ]

  // 如果加载中，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载新闻数据...</p>
        </div>
      </div>
    )
  }

  // 如果出错，显示错误信息
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 使用API数据，如果没有数据则使用后备数据
  const displayNews = news.length > 0 ? news : fallbackNews
  
  // 分离置顶新闻和普通新闻
  const pinnedNews = displayNews.filter(item => item.isPinned)
  const regularNews = displayNews.filter(item => !item.isPinned)
  
  // 合并数组：置顶新闻在前，普通新闻在后
  const sortedNews = [...pinnedNews, ...regularNews]
  console.log('sortedNews',sortedNews)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Featured News - 显示第一条置顶新闻或第一条新闻 */}
        {sortedNews.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full bg-gray-200 flex items-center justify-center relative">
                    {sortedNews[0].image ? (
                      <Image 
                        src={sortedNews[0].image} 
                        alt={sortedNews[0].title}
                        width={400}
                        height={250}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="text-gray-500">暂无图片</div>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar size={14} className="mr-1" />
                      {new Date(sortedNews[0].createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {sortedNews[0].title}
                  </h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {sortedNews[0].summary || sortedNews[0].content.substring(0, 150) + '...'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500 text-sm">
                      <User size={14} className="mr-1" />
                      管理员
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedNews.slice(1).map(item => (
            <article key={item.id} className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
              item.isPinned ? 'ring-2 ring-red-200' : ''
            }`}>
              {/* News Image */}
              <div className="h-48 bg-gray-200 flex items-center justify-center relative">


                {item.image ? (
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-gray-500">新闻图片</span>
                )}
              </div>

              <div className="p-6">
                {/* Meta Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar size={14} className="mr-1" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <User size={14} className="mr-1" />
                    管理员
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.summary || item.content.substring(0, 100) + '...'}
                </p>

                {/* Read More */}
                <Link 
                  href={`/news/${item.id}`}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors inline-block"
                >
                  阅读更多 →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            加载更多新闻
          </button>
        </div>

        {/* News Categories */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">新闻分类</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl font-bold text-blue-600 mb-2">12</div>
              <div className="text-gray-600 text-sm">学术成果</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl font-bold text-green-600 mb-2">8</div>
              <div className="text-gray-600 text-sm">项目资助</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl font-bold text-purple-600 mb-2">6</div>
              <div className="text-gray-600 text-sm">学术会议</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl font-bold text-orange-600 mb-2">4</div>
              <div className="text-gray-600 text-sm">合作交流</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsPage