'use client'
import { ArrowRight, Beaker, Users, BookOpen, Code, Sparkles, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import NewsSection from '@/components/NewsSection'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [particles, setParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([])

  useEffect(() => {
    setIsVisible(true)
    // Generate particles on client side only
    const newParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with Enhanced Gradient */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-spin-slow"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-full">
                <div className="bg-slate-900 rounded-full p-3">
                  <Sparkles className="text-blue-400" size={32} />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight text-center">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                智能化药物研发
              </span>
              <br />
              <span className="text-white text-3xl md:text-4xl lg:text-5xl">创新实验室</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              融合人工智能、计算生物学与分子设计技术，
              <br className="hidden md:block" />
              <span className="text-blue-400 font-semibold">加速新药发现进程</span>，为人类健康事业贡献突破性力量
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/team"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105"
              >
                <Zap size={20} className="group-hover:animate-pulse" />
                探索团队
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/tools"
                className="group border-2 border-blue-400 text-blue-400 px-10 py-4 rounded-xl font-semibold hover:bg-blue-400 hover:text-slate-900 transition-all duration-300 backdrop-blur-sm bg-white/5 shadow-xl hover:shadow-blue-400/25 transform hover:scale-105"
              >
                <Target size={20} className="inline mr-2" />
                研究工具
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>
      </section>

      {/* Features Section with Enhanced Cards */}
      <section className="py-32 bg-gradient-to-b from-slate-50 to-white relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 rounded-full mb-6">
              <Sparkles className="text-blue-600" size={20} />
              <span className="text-blue-800 font-semibold">核心研究领域</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
              前沿科技驱动创新
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              融合计算药物设计、分子模拟与人工智能技术，
              <br className="hidden md:block" />
              构建下一代药物发现生态系统
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className={`group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '400ms'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Beaker className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">药物设计</h3>
                <p className="text-gray-600 leading-relaxed">
                  基于AI的分子设计与优化，精准预测分子相互作用，加速先导化合物发现
                </p>
              </div>
            </div>

            <div className={`group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '500ms'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">团队协作</h3>
                <p className="text-gray-600 leading-relaxed">
                  跨学科团队合作，整合生物学、化学、计算机科学专业知识
                </p>
              </div>
            </div>

            <div className={`group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '600ms'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BookOpen className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">学术成果</h3>
                <p className="text-gray-600 leading-relaxed">
                  高质量论文发表与专利申请，推动学术界与产业界深度交流合作
                </p>
              </div>
            </div>

            <div className={`group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-orange-200 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '700ms'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Code className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">工具开发</h3>
                <p className="text-gray-600 leading-relaxed">
                  开源软件工具开发，服务全球科研社区，推动技术普及与应用
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 px-6 py-2 rounded-full mb-6">
              <BookOpen className="text-green-600" size={20} />
              <span className="text-green-800 font-semibold">最新动态</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
              新闻资讯
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              了解实验室最新研究进展、学术成果与重要活动
            </p>
          </div>
          
          <NewsSection />
          
          <div className="text-center mt-12">
            <Link
              href="/news"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-green-500/25 transform hover:scale-105"
            >
              <BookOpen size={20} className="group-hover:animate-pulse" />
              查看更多新闻
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">数据驱动</span>
              <br />创新成果
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className={`text-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">50+</div>
              <div className="text-gray-300 font-medium">研究项目</div>
            </div>
            <div className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">100+</div>
              <div className="text-gray-300 font-medium">学术论文</div>
            </div>
            <div className={`text-center transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">20+</div>
              <div className="text-gray-300 font-medium">团队成员</div>
            </div>
            <div className={`text-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">5+</div>
              <div className="text-gray-300 font-medium">开源工具</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 md:p-16 border border-white/50">
            <div className={`text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 rounded-full mb-8">
                <Sparkles className="text-blue-600" size={20} />
                <span className="text-blue-800 font-semibold">加入我们</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
                共同推动药物发现革命
              </h2>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                如果您对计算药物设计、人工智能在生物医学中的应用充满热情，
                <br className="hidden md:block" />
                欢迎加入我们的创新团队，共同开创医药科技的未来
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/team"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105"
                >
                  <Users size={20} className="group-hover:animate-pulse" />
                  了解团队
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="group border-2 border-slate-300 text-slate-700 px-10 py-4 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 backdrop-blur-sm shadow-xl transform hover:scale-105"
                >
                  <Sparkles size={20} className="inline mr-2" />
                  联系我们
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
