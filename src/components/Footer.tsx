'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from '@/contexts/LocaleContext'

interface FooterLink {
  name: string
  url: string
}

interface FooterConfig {
  id: number
  title: string
  description: string
  copyright: string
  icp?: string
  email?: string
  phone?: string
  address?: string
  links?: FooterLink[]
  isActive: boolean
}

const Footer = () => {
  const t = useTranslations('footer')
  const locale = useLocale()
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取页脚配置
  useEffect(() => {
    const fetchFooterConfig = async () => {
      try {
        const response = await fetch('/api/footer')
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            const config = data.data
            // 解析links字段
            if (config.links) {
              try {
                // 处理双重JSON编码问题
                const parsedLinks = typeof config.links === 'string' ? JSON.parse(config.links) : config.links
                config.links = typeof parsedLinks === 'string' ? JSON.parse(parsedLinks) : parsedLinks
              } catch {
                config.links = []
              }
            }
            setFooterConfig(config)
          }
        }
      } catch (error) {
        console.error('获取页脚配置失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFooterConfig()
  }, [])

  // 如果正在加载或没有配置，使用默认内容
  if (loading || !footerConfig) {
    return (
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 默认课题组信息 */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">{t('title')}</h3>
              <p className="text-gray-300 mb-4">
                {t('description')}
              </p>
              <div className="text-sm text-gray-400">
                <p>{t('copyright')}</p>
                <p>备案号: 京ICP备xxxxxxxx号</p>
              </div>
            </div>

            {/* 默认联系方式 */}
            <div>
              <h4 className="text-md font-semibold mb-4">{t('contactInfo')}</h4>
              <div className="text-gray-300 space-y-2">
                <p>邮箱: contact@lab.edu.cn</p>
                <p>电话: +86-xxx-xxxx-xxxx</p>
                <p>地址: 北京市海淀区xxx路xxx号</p>
              </div>
            </div>

            {/* 默认友情链接 */}
            <div>
              <h4 className="text-md font-semibold mb-4">{t('relatedLinks')}</h4>
              <div className="space-y-2">
                <Link 
                  href="https://cran.r-project.org/web/packages/BioMedR/" 
                  className="block text-gray-300 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  BioMedR
                </Link>
                <Link 
                  href="https://github.com/kotorl-y/Scopy/" 
                  className="block text-gray-300 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Scopy
                </Link>
                <Link 
                  href="/tools" 
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  {t('moreTools')}
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>{t('poweredBy')}</p>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 动态课题组信息 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">{footerConfig.title}</h3>
            <p className="text-gray-300 mb-4">
              {footerConfig.description}
            </p>
            <div className="text-sm text-gray-400">
              <p>{footerConfig.copyright}</p>
              {footerConfig.icp && <p>备案号: {footerConfig.icp}</p>}
            </div>
          </div>

          {/* 动态联系方式 */}
          <div>
            <h4 className="text-md font-semibold mb-4">{t('contactInfo')}</h4>
            <div className="text-gray-300 space-y-2">
              {footerConfig.email && <p>邮箱: {footerConfig.email}</p>}
              {footerConfig.phone && <p>电话: {footerConfig.phone}</p>}
              {footerConfig.address && <p>地址: {footerConfig.address}</p>}
            </div>
          </div>

          {/* 动态友情链接 */}
          <div>
            <h4 className="text-md font-semibold mb-4">{t('relatedLinks')}</h4>
            <div className="space-y-2">
              {footerConfig.links && footerConfig.links.length > 0 ? (
                footerConfig.links.map((link, index) => (
                  <Link 
                    key={index}
                    href={link.url} 
                    className="block text-gray-300 hover:text-white transition-colors"
                    target={link.url.startsWith('http') ? '_blank' : '_self'}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.name}
                  </Link>
                ))
              ) : (
                // 如果没有配置链接，显示默认链接
                <>
                  <Link 
                    href="https://cran.r-project.org/web/packages/BioMedR/" 
                    className="block text-gray-300 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    BioMedR
                  </Link>
                  <Link 
                    href="https://github.com/kotorl-y/Scopy/" 
                    className="block text-gray-300 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Scopy
                  </Link>
                  <Link 
                    href="/tools" 
                    className="block text-gray-300 hover:text-white transition-colors"
                  >
                    {t('moreTools')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>{t('poweredBy')}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer