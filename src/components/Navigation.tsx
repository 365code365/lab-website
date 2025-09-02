'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Globe } from 'lucide-react'
import { useTranslations, useLocale } from '@/contexts/LocaleContext'
import { usePathname, useRouter } from 'next/navigation'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const t = useTranslations('navigation')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: t('home'), href: '/' },
    { name: t('team'), href: '/team' },
    { name: t('publications'), href: '/publications' },
    { name: t('articles'), href: '/articles' },
    { name: t('tools'), href: '/tools' },
    { name: t('awards'), href: '/awards' },
    { name: t('news'), href: '/news' },
    { name: t('contact'), href: '/contact' },
  ]

  const switchLanguage = (newLocale: string) => {
    const currentPath = pathname.replace(`/${locale}`, '') || '/'
    router.push(`/${newLocale}${currentPath}`)
    setLangMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16 relative">
          {/* Logo - positioned absolutely to the left */}
          <div className="absolute left-0 flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">
                {locale === 'en' ? 'Intelligent Drug Discovery Accelerator' : '智能化药物研发加速器'}
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation - centered */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out rounded-lg group hover:bg-blue-50 hover:shadow-md transform hover:scale-105 hover:-translate-y-0.5"
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300 ease-out"></div>
              </Link>
            ))}
          </div>

          {/* Language switcher and mobile menu - positioned absolutely to the right */}
          <div className="absolute right-0 flex items-center space-x-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="relative text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-50 hover:shadow-md transform hover:scale-110 group flex items-center space-x-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-1">
                  <Globe size={20} />
                  <span className="text-sm font-medium">{locale.toUpperCase()}</span>
                </div>
              </button>
              
              {/* Language dropdown */}
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => switchLanguage('zh')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${locale === 'zh' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      中文
                    </button>
                    <button
                      onClick={() => switchLanguage('en')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${locale === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      English
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-50 hover:shadow-md transform hover:scale-110 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative z-10 transition-transform duration-300 group-hover:rotate-180">
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative text-gray-700 hover:text-blue-600 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out hover:bg-blue-50 hover:shadow-md transform hover:scale-105 hover:translate-x-2 group"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0 h-6 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-1 transition-all duration-300 ease-out rounded-r"></div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation