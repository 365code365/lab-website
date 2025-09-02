'use client'
import { useState, useEffect } from 'react'
import { Calendar, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  image: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: string
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  // 环形3D自动旋转效果
  useEffect(() => {
    if (!isAutoRotating || news.length <= 1) return

    const interval = setInterval(() => {
      setRotationAngle(prev => prev + 0.5) // 每次旋转0.5度，更平滑
    }, 50) // 每50毫秒更新一次，创造连续旋转效果

    return () => clearInterval(interval)
  }, [news.length, isAutoRotating])

  // 暂停/恢复旋转
  const toggleRotation = () => {
    setIsAutoRotating(!isAutoRotating)
  }

  // 计算每个卡片的3D位置
  const getCardTransform = (index: number) => {
    const totalCards = Math.max(news.length, 3) // 确保至少显示3个
    const anglePerCard = 360 / totalCards
    const cardAngle = (index * anglePerCard + rotationAngle) % 360
    const radius = 300 // 稍微增大环形半径
    
    // 计算是否在中间位置（前方）
    const normalizedAngle = ((cardAngle % 360) + 360) % 360
    const isCenterFront = normalizedAngle >= 345 || normalizedAngle <= 15 // 中间30度范围
    
    // 根据位置计算缩放比例
    const distanceFromCenter = Math.min(
      Math.abs(normalizedAngle),
      Math.abs(normalizedAngle - 360)
    )
    const scale = isCenterFront ? 1.2 : Math.max(0.7, 1 - distanceFromCenter / 180 * 0.3)
    
    // 计算透明度
    const opacity = isCenterFront ? 1 : Math.max(0.4, 1 - distanceFromCenter / 180 * 0.6)
    
    return {
      transform: `rotateY(${cardAngle}deg) translateZ(${radius}px) scale(${scale})`,
      opacity: opacity,
      zIndex: isCenterFront ? 10 : Math.round((1 - distanceFromCenter / 180) * 5)
    }
  }

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/news?limit=6')
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      const data = await response.json()
      setNews(data.data || [])
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Failed to load news')
      // 使用模拟数据作为后备
      setNews([
        {
          id: '1',
          title: 'AI驱动的药物分子设计新突破',
          summary: '我们的研究团队在人工智能辅助药物分子设计领域取得重大进展，成功开发出新型深度学习模型，能够显著提高药物候选分子的预测准确性。',
          content: '',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20molecular%20drug%20design%20breakthrough%20laboratory%20research%20modern%20scientific%20equipment&image_size=landscape_4_3',
          isPinned: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          author: '张教授'
        },
        {
          id: '2',
          title: '国际合作项目启动仪式成功举办',
          summary: '实验室与多个国际知名研究机构签署合作协议，共同推进计算生物学与药物发现领域的前沿研究。',
          content: '',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=international%20collaboration%20ceremony%20laboratory%20scientists%20handshake%20modern%20conference%20room&image_size=landscape_4_3',
          isPinned: false,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          author: '李博士'
        },
        {
          id: '3',
          title: '新型抗癌药物候选分子发现',
          summary: '通过计算机辅助药物设计，我们发现了一系列具有潜在抗癌活性的新型化合物，目前正在进行进一步的实验验证。',
          content: '',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=anticancer%20drug%20discovery%20molecular%20structure%20laboratory%20research%20scientific%20breakthrough&image_size=landscape_4_3',
          isPinned: false,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          author: '王研究员'
        },
        {
          id: '4',
          title: '学术论文在顶级期刊发表',
          summary: '实验室最新研究成果在Nature Biotechnology期刊发表，为计算药物设计领域提供了新的理论基础和方法学指导。',
          content: '',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=scientific%20publication%20journal%20research%20paper%20academic%20achievement%20laboratory&image_size=landscape_4_3',
          isPinned: false,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          author: '陈教授'
        }
      ])
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="relative h-[500px] flex items-center justify-center">
        <div className="w-72 bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
          <div className="h-40 bg-gray-200"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && news.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">暂时无法加载新闻内容</p>
      </div>
    )
  }

  return (
    <div className="relative h-[500px] overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* 环形3D旋转容器 */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '1200px' }}
        onMouseEnter={() => setIsAutoRotating(false)}
        onMouseLeave={() => setIsAutoRotating(true)}
      >
        <div 
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 确保至少显示3个新闻，如果新闻不足则重复显示 */}
          {Array.from({ length: Math.max(news.length, 3) }, (_, index) => {
            const newsIndex = index % news.length
            const item = news[newsIndex]
            const cardStyle = getCardTransform(index)
            
            return (
              <div
                key={`${item?.id || 'placeholder'}-${index}`}
                className="absolute w-72 h-80 transition-all duration-500 ease-out"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: '-144px', // w-72 的一半
                  marginTop: '-160px',  // h-80 的一半
                  transform: cardStyle.transform,
                  opacity: cardStyle.opacity,
                  zIndex: cardStyle.zIndex,
                  backfaceVisibility: 'hidden'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {item ? (
                  <RingNewsCard 
                    news={item} 
                    index={index} 
                    isHovered={hoveredIndex === index}
                    rotationAngle={rotationAngle}
                    totalCards={Math.max(news.length, 3)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                    <div className="text-gray-400 text-lg">加载中...</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 旋转控制按钮 */}
      <button
        onClick={toggleRotation}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-xl transition-all duration-300 group"
      >
        <div className={`transition-transform duration-300 ${isAutoRotating ? 'animate-spin' : ''}`}>
          {isAutoRotating ? '⏸️' : '▶️'}
        </div>
      </button>

      {/* 环形指示器 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-lg">
          {Array.from({ length: Math.max(news.length, 3) }, (_, index) => {
            const totalCards = Math.max(news.length, 3)
            const angle = (index * (360 / totalCards) + rotationAngle) % 360
            const normalizedAngle = ((angle % 360) + 360) % 360
            const isCenterFront = normalizedAngle >= 345 || normalizedAngle <= 15
            
            return (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isCenterFront
                    ? 'bg-blue-600 scale-150 shadow-lg'
                    : 'bg-gray-300'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* 装饰性背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 border border-gray-200/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 border border-gray-200/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 border border-gray-200/10 rounded-full"></div>
      </div>
    </div>
  )
}

interface RingNewsCardProps {
  news: NewsItem
  index: number
  isHovered: boolean
  rotationAngle: number
  totalCards: number
}

function RingNewsCard({ news, isHovered, rotationAngle, index, totalCards }: RingNewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 计算卡片是否在中间前方位置（用于突出显示）
  const cardAngle = (index * (360 / totalCards) + rotationAngle) % 360
  const normalizedAngle = ((cardAngle % 360) + 360) % 360
  const isCenterFront = normalizedAngle >= 345 || normalizedAngle <= 15 // 中间30度范围
  
  // 计算距离中心的程度，用于渐变效果
  const distanceFromCenter = Math.min(
    Math.abs(normalizedAngle),
    Math.abs(normalizedAngle - 360)
  )
  const centerProximity = Math.max(0, 1 - distanceFromCenter / 45) // 45度内渐变

  return (
    <div className={`w-full h-full bg-white rounded-2xl overflow-hidden border transition-all duration-500 ${
      isCenterFront 
        ? 'shadow-2xl shadow-blue-500/30 border-blue-300' 
        : isHovered 
          ? 'shadow-xl shadow-gray-500/20 border-gray-300'
          : centerProximity > 0.3
            ? 'shadow-lg shadow-blue-500/10 border-blue-100'
            : 'shadow-md border-gray-200'
    }`}>
      <div className="relative h-40 overflow-hidden">
        {news.image ? (
          <Image
            src={news.image}
            alt={news.title}
            fill
            className={`object-cover transition-transform duration-500 ${
              isCenterFront || isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className={`text-blue-500 font-bold transition-all duration-300 ${
              isCenterFront ? 'text-3xl' : 'text-2xl'
            }`}>新闻</div>
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-500 ${
          isCenterFront || isHovered ? 'opacity-100' : 'opacity-60'
        }`}></div>
        
        {/* 中间位置的特殊标识 */}
        {isCenterFront && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
        
        {/* 接近中心的渐变边框效果 */}
        {centerProximity > 0.3 && !isCenterFront && (
          <div 
            className="absolute inset-0 border-2 border-blue-400/30 rounded-2xl transition-opacity duration-500"
            style={{ opacity: centerProximity * 0.5 }}
          ></div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className={`font-bold mb-2 line-clamp-2 transition-all duration-300 ${
          isCenterFront 
            ? 'text-blue-600 text-lg' 
            : isHovered 
              ? 'text-gray-900 text-base'
              : centerProximity > 0.5
                ? 'text-blue-500 text-base'
                : 'text-gray-800 text-sm'
        }`}>
          {news.title}
        </h3>
        
        <p className={`text-gray-600 leading-relaxed mb-3 transition-all duration-300 ${
          isCenterFront 
            ? 'text-sm line-clamp-3' 
            : 'text-xs line-clamp-2'
        }`}>
          {news.summary}
        </p>
        
        <div className={`flex items-center justify-between text-gray-500 mb-3 transition-all duration-300 ${
          isCenterFront ? 'text-sm' : 'text-xs'
        }`}>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(news.createdAt)}</span>
          </div>
          <span className="text-blue-600 font-medium">{news.author}</span>
        </div>
        
        <Link
          href={`/news/${news.id}`}
          className={`inline-flex items-center gap-1 font-medium transition-all duration-300 ${
            isCenterFront 
              ? 'text-blue-600 hover:text-blue-700 text-sm' 
              : isHovered
                ? 'text-blue-500 hover:text-blue-600 text-sm'
                : centerProximity > 0.5
                  ? 'text-blue-400 hover:text-blue-600 text-sm'
                  : 'text-gray-500 hover:text-blue-600 text-xs'
          }`}
        >
          阅读更多
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}