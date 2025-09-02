import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要安装检查的路径
const publicPaths = [
  '/install',
  '/api/install',
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
  '/icons'
]

// 检查路径是否为公共路径
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path))
}

// 在Edge Runtime中检查系统是否已安装
function isSystemInstalled(): boolean {
  // 只检查环境变量，因为Edge Runtime不支持文件系统操作
  return process.env.SYSTEM_INSTALLED === 'true'
}

// 创建国际化中间件
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'zh'
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 跳过公共路径和静态资源
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }
  
  try {
    // 检查系统是否已安装
    const installed = isSystemInstalled()
    
    if (!installed) {
      // 如果未安装且不在安装页面，重定向到安装页面
      if (!pathname.includes('/install')) {
        const installUrl = new URL('/install', request.url)
        return NextResponse.redirect(installUrl)
      }
    } else {
      // 如果已安装但访问安装页面，重定向到首页
      if (pathname.includes('/install')) {
        const homeUrl = new URL('/', request.url)
        return NextResponse.redirect(homeUrl)
      }
    }
    
    // 应用国际化中间件
    return intlMiddleware(request);
  } catch (error) {
    console.error('中间件检查安装状态失败:', error)
    // 发生错误时，允许继续访问
    return intlMiddleware(request);
  }
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的路径：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}