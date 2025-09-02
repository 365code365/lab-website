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
  const [displayMode, setDisplayMode] = useState<'3d' | 'horizontal'>('horizontal')
  const [rotationMode, setRotationMode] = useState<'continuous' | 'smooth'>('continuous')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    fetchNews()
  }, [])

  // 自动播放效果（支持3D和水平滚动模式）
  useEffect(() => {
    if (!isAutoRotating || news.length <= 1) return

    const interval = setInterval(() => {
      if (displayMode === '3d') {
        if (rotationMode === 'continuous') {
          // 3D连续旋转模式：每次旋转0.5度
          setRotationAngle(prev => prev + 0.5)
        } else {
          // 3D平滑切换模式：每3秒切换到下一个
          setCurrentSlideIndex(prev => (prev + 1) % Math.max(news.length, 3))
        }
      } else {
        // 水平滚动模式：每3秒滚动到下一个
        setCurrentSlideIndex(prev => (prev + 1) % news.length)
      }
    }, displayMode === '3d' && rotationMode === 'continuous' ? 50 : 3000)

    return () => clearInterval(interval)
  }, [news.length, isAutoRotating, displayMode, rotationMode])

  // 3D平滑切换模式下的角度计算
  useEffect(() => {
    if (displayMode === '3d' && rotationMode === 'smooth') {
      const totalCards = Math.max(news.length, 3)
      const targetAngle = -(currentSlideIndex * (360 / totalCards))
      setRotationAngle(targetAngle)
    }
  }, [currentSlideIndex, displayMode, rotationMode, news.length])

  // 水平滚动模式下的滚动位置计算
  useEffect(() => {
    if (displayMode === 'horizontal') {
      const cardWidth = 320 // w-80 = 320px
      const gap = 24 // gap-6 = 24px
      const targetPosition = currentSlideIndex * (cardWidth + gap)
      setScrollPosition(targetPosition)
    }
  }, [currentSlideIndex, displayMode])

  // 暂停/恢复旋转
  const toggleRotation = () => {
    setIsAutoRotating(!isAutoRotating)
  }

  // 切换显示模式（3D / 水平滚动）
  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === '3d' ? 'horizontal' : '3d')
    // 切换模式时重置到第一个位置
    setCurrentSlideIndex(0)
    setRotationAngle(0)
    setScrollPosition(0)
  }

  // 切换3D旋转模式（仅在3D模式下有效）
  const toggleRotationMode = () => {
    if (displayMode === '3d') {
      setRotationMode(prev => prev === 'continuous' ? 'smooth' : 'continuous')
      // 切换到平滑模式时，重置到当前最接近的位置
      if (rotationMode === 'continuous') {
        const totalCards = Math.max(news.length, 3)
        const normalizedAngle = ((rotationAngle % 360) + 360) % 360
        const nearestIndex = Math.round(normalizedAngle / (360 / totalCards)) % totalCards
        setCurrentSlideIndex(nearestIndex)
      }
    }
  }

  // 手动切换到指定幻灯片
  const goToSlide = (index: number) => {
    if (displayMode === '3d' && rotationMode === 'continuous') {
      return // 3D连续模式下不支持手动切换
    }
    
    setCurrentSlideIndex(index)
    setIsAutoRotating(false)
    // 5秒后重新开始自动播放
    setTimeout(() => setIsAutoRotating(true), 5000)
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
    <div className={`relative overflow-hidden bg-gradient-to-b from-gray-50 to-white ${
      displayMode === '3d' ? 'h-[500px]' : 'h-auto py-8'
    }`}>
      {displayMode === '3d' ? (
        /* 3D环形旋转容器 */
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
                  className={`absolute w-72 h-80 transition-all ease-out ${
                    rotationMode === 'smooth' ? 'duration-1000' : 'duration-500'
                  }`}
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
      ) : (
        /* 水平滚动容器 */
        <div className="relative">
          <div 
            className="flex gap-6 transition-transform duration-1000 ease-out px-6"
            style={{
              transform: `translateX(-${scrollPosition}px)`
            }}
            onMouseEnter={() => setIsAutoRotating(false)}
            onMouseLeave={() => setIsAutoRotating(true)}
          >
      {news.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-80"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <HorizontalNewsCard 
                  news={item} 
                  index={index} 
                  isActive={index === currentSlideIndex}
                  isHovered={hoveredIndex === index}
                />
              </div>
            ))}
          </div>
          
          {/* 水平滚动导航箭头 */}
          <button
            onClick={() => goToSlide(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center transition-all duration-300 ${
              currentSlideIndex === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:text-blue-600 hover:shadow-xl'
            }`}
          >
            ←
          </button>
          
          <button
            onClick={() => goToSlide(Math.min(news.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex >= news.length - 1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center transition-all duration-300 ${
              currentSlideIndex >= news.length - 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:text-blue-600 hover:shadow-xl'
            }`}
          >
            →
          </button>
        </div>
      )}

      {/* 控制按钮组 */}
      <div className="absolute top-6 right-6 flex flex-col gap-2">
        {/* 显示模式切换按钮 */}
        <button
          onClick={toggleDisplayMode}
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-xl transition-all duration-300 group"
          title={`切换到${displayMode === '3d' ? '水平滚动' : '3D环形'}模式`}
        >
          <div className="text-lg">
            {displayMode === '3d' ? '📐' : '🌀'}
          </div>
        </button>
        
        {/* 3D旋转模式切换按钮（仅在3D模式下显示） */}
        {displayMode === '3d' && (
          <button
            onClick={toggleRotationMode}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-xl transition-all duration-300 group"
            title={`切换到${rotationMode === 'continuous' ? '平滑切换' : '连续旋转'}模式`}
          >
            <div className="text-lg">
              {rotationMode === 'continuous' ? '🔄' : '⏭️'}
            </div>
          </button>
        )}
        
        {/* 播放/暂停按钮 */}
        <button
          onClick={toggleRotation}
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-xl transition-all duration-300 group"
        >
          <div className={`transition-transform duration-300 ${isAutoRotating && displayMode === '3d' && rotationMode === 'continuous' ? 'animate-spin' : ''}`}>
            {isAutoRotating ? '⏸️' : '▶️'}
          </div>
        </button>
      </div>

      {/* 指示器 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          {/* 模式指示 */}
          <div className="text-xs text-gray-500 bg-white/70 px-2 py-1 rounded-full border border-gray-200">
            {displayMode === '3d' 
              ? (rotationMode === 'continuous' ? '3D连续旋转' : '3D平滑切换')
              : '水平滚动'
            }
          </div>
          
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-lg">
          {displayMode === '3d' 
            ? Array.from({ length: Math.max(news.length, 3) }, (_, index) => {
                const totalCards = Math.max(news.length, 3)
                
                // 根据3D模式决定高亮逻辑
                let isActive = false
                if (rotationMode === 'continuous') {
                  const angle = (index * (360 / totalCards) + rotationAngle) % 360
                  const normalizedAngle = ((angle % 360) + 360) % 360
                  isActive = normalizedAngle >= 345 || normalizedAngle <= 15
                } else {
                  isActive = index === currentSlideIndex
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    disabled={displayMode === '3d' && rotationMode === 'continuous'}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      displayMode === '3d' && rotationMode === 'smooth' ? 'cursor-pointer hover:scale-125' : 'cursor-default'
                    } ${
                      isActive
                        ? 'bg-blue-600 scale-150 shadow-lg'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                )
              })
            : news.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
                    index === currentSlideIndex
                      ? 'bg-blue-600 scale-150 shadow-lg'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))
          }
          </div>
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

interface HorizontalNewsCardProps {
  news: NewsItem
  index: number
  isActive: boolean
  isHovered: boolean
}

function HorizontalNewsCard({ news, isActive, isHovered }: HorizontalNewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={`group w-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border transform hover:-translate-y-2 ${
      isActive 
        ? 'border-blue-200 shadow-blue-500/20 scale-105' 
        : isHovered 
          ? 'border-gray-300 shadow-gray-500/20'
          : 'border-gray-200'
    }`}>
      <div className="relative h-48 overflow-hidden">
        {news.image ? (
          <Image
            src={news.image}
            alt={news.title}
            fill
            className={`object-cover transition-transform duration-500 ${
              isActive || isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className={`text-blue-500 font-bold transition-all duration-300 ${
              isActive ? 'text-4xl' : 'text-3xl'
            }`}>新闻</div>
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 ${
          isActive || isHovered ? 'opacity-100' : 'opacity-0'
        }`}></div>
        
        {/* 活跃状态指示器 */}
        {isActive && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className={`font-bold mb-3 line-clamp-2 transition-colors duration-300 ${
          isActive 
            ? 'text-blue-600 text-xl' 
            : isHovered 
              ? 'text-gray-900 text-lg'
              : 'text-gray-800 text-lg'
        }`}>
          {news.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {news.summary}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(news.createdAt)}</span>
          </div>
          <span className="text-blue-600 font-medium">{news.author}</span>
        </div>
        
        <Link
          href={`/news/${news.id}`}
          className={`inline-flex items-center gap-2 font-medium transition-all duration-300 ${
            isActive 
              ? 'text-blue-600 hover:text-blue-700' 
              : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          阅读更多
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}