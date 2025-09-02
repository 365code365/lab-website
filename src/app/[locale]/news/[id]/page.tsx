import React from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Eye } from 'lucide-react';
import Link from 'next/link';
import { RichTextDisplay } from '@/components/RichTextEditor';

interface NewsDetailPageProps {
  params: {
    id: string;
  };
}

// 获取新闻详情
async function getNewsDetail(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/news/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取新闻详情失败:', error);
    return null;
  }
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const news = await getNewsDetail(params.id);
  
  if (!news) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/news" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回新闻列表
            </Link>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 新闻头图 */}
          {news.image && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* 新闻内容 */}
          <div className="p-6 sm:p-8">
            {/* 置顶标识 */}
            {news.isPinned && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  置顶新闻
                </span>
              </div>
            )}
            
            {/* 标题 */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {news.title}
            </h1>
            
            {/* 摘要 */}
            {news.summary && (
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {news.summary}
              </p>
            )}
            
            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                发布时间：{formatDate(news.createdAt)}
              </div>
              
              {news.author && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  作者：{news.author}
                </div>
              )}
              
              {news.views !== undefined && (
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  阅读量：{news.views}
                </div>
              )}
            </div>
            
            {/* 正文内容 */}
            <div className="prose prose-lg max-w-none">
              <RichTextDisplay 
                content={news.content} 
                className="leading-relaxed [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:font-semibold [&_h1]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:font-semibold [&_h5]:text-gray-900 [&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:font-semibold [&_h6]:text-gray-900 [&_p]:mb-4 [&_p]:text-gray-700 [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline"
              />
            </div>
          </div>
        </article>
        
        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <Link 
            href="/news"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回新闻列表
          </Link>
        </div>
      </main>
    </div>
  );
}

// 生成元数据
export async function generateMetadata({ params }: NewsDetailPageProps) {
  const news = await getNewsDetail(params.id);
  
  if (!news) {
    return {
      title: '新闻未找到',
      description: '请求的新闻内容不存在'
    };
  }
  
  return {
    title: news.title,
    description: news.summary || news.title,
    openGraph: {
      title: news.title,
      description: news.summary || news.title,
      images: news.image ? [news.image] : [],
    },
  };
}