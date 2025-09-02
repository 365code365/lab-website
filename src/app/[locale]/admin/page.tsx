'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuth, isAuthenticated, getCurrentUser, isAdmin } from '@/lib/auth'

// 导入布局组件
import AdminLayout from '@/components/admin/layout/AdminLayout'
import UsersTab from '@/components/admin/tabs/UsersTab'
import TeamManagementTab from '@/components/admin/team/TeamManagementTab'
import PublicationsTab from '@/components/admin/tabs/PublicationsTab'
import ToolsTab from '@/components/admin/tabs/ToolsTab'
import NewsTab from '@/components/admin/tabs/NewsTab'
import AchievementsTab from '@/components/admin/tabs/AchievementsTab'
import FooterManagement from '@/components/admin/FooterManagement'
import ContactManagement from '@/components/admin/ContactManagement'

// 导入通用组件
import ErrorBoundary from '@/components/admin/common/ErrorBoundary'
import LoadingSpinner from '@/components/admin/common/LoadingSpinner'

// 仪表板组件
interface DashboardTabProps {
  onTabChange: (tab: string) => void
}

const DashboardTab: React.FC<DashboardTabProps> = ({ onTabChange }) => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('获取统计数据失败')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取统计数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">系统概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">用户总数</h3>
            <p className="text-2xl font-bold text-blue-900">{stats?.overview?.userCount || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">发表成果</h3>
            <p className="text-2xl font-bold text-green-900">{stats?.overview?.publicationCount || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">工具数量</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats?.overview?.toolCount || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">新闻动态</h3>
            <p className="text-2xl font-bold text-purple-900">{stats?.overview?.newsCount || 0}</p>
          </div>
        </div>
      </div>
      
      {/* 最近动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最新新闻 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最新新闻</h3>
          <div className="space-y-3">
            {stats?.recent?.news?.slice(0, 5).map((news: any) => (
              <div key={news.id} className="border-l-4 border-purple-500 pl-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">{news.title}</h4>
                <p className="text-xs text-gray-500">
                  {new Date(news.createdAt).toLocaleDateString()}
                  {news.isPinned && <span className="ml-2 text-red-500">📌</span>}
                </p>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">暂无新闻</p>
            )}
          </div>
        </div>

        {/* 最新发表成果 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最新发表</h3>
          <div className="space-y-3">
            {stats?.recent?.publications?.slice(0, 5).map((pub: any) => (
              <div key={pub.id} className="border-l-4 border-green-500 pl-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">{pub.title}</h4>
                <p className="text-xs text-gray-500">
                  {pub.journal} ({pub.year})
                </p>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">暂无发表成果</p>
            )}
          </div>
        </div>

        {/* 最新工具 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最新工具</h3>
          <div className="space-y-3">
            {stats?.recent?.tools?.slice(0, 5).map((tool: any) => (
              <div key={tool.id} className="border-l-4 border-yellow-500 pl-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">{tool.name}</h4>
                <p className="text-xs text-gray-500 truncate">{tool.description}</p>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">暂无工具</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onTabChange('users')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <h4 className="font-medium text-gray-900">用户管理</h4>
            <p className="text-sm text-gray-500">管理系统用户</p>
          </button>
          <button 
            onClick={() => onTabChange('news')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <h4 className="font-medium text-gray-900">发布新闻</h4>
            <p className="text-sm text-gray-500">发布最新动态</p>
          </button>
          <button 
            onClick={() => onTabChange('analytics')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <h4 className="font-medium text-gray-900">数据分析</h4>
            <p className="text-sm text-gray-500">查看系统统计</p>
          </button>
        </div>
      </div>
    </div>
  )
}

// 分析组件
const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">数据分析</h2>
        <p className="text-gray-600">数据分析功能正在开发中...</p>
      </div>
    </div>
  )
}

// 设置组件
const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">系统设置</h2>
        <div className="space-y-6">
          {/* 页脚管理 */}
          <div>
            <FooterManagement />
          </div>
        </div>
      </div>
    </div>
  )
}

// 主管理页面组件
function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email: string; role: string } | null>(null)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // 权限检查
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      const user = getCurrentUser()
      const adminAccess = isAdmin()

      // 将UserInfo的roleType映射为role
      if (user) {
        setCurrentUser({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.roleType
        })
      } else {
        setCurrentUser(null)
      }
      setHasAdminAccess(adminAccess)
      setAuthChecked(true)

      // 如果未登录，跳转到登录页
      if (!authenticated) {
        router.push('/login')
        return
      }

      // 如果不是管理员，显示权限不足提示
      if (!adminAccess) {
        return
      }
    }

    checkAuth()
  }, [router])

  // 退出登录
  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  // 标签页切换处理
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // 渲染标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onTabChange={setActiveTab} />
      case 'users':
        return <UsersTab />
      case 'team':
          return <TeamManagementTab />
      case 'publications':
        return <PublicationsTab />
      case 'tools':
        return <ToolsTab />
      case 'news':
        return <NewsTab />
      case 'achievements':
        return <AchievementsTab />
      case 'contacts':
        return <ContactManagement />
      case 'analytics':
        return <AnalyticsTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <DashboardTab onTabChange={setActiveTab} />
    }
  }

  // 如果还在检查认证状态，显示加载界面
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // 如果没有管理员权限，显示权限不足界面
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-4">您没有访问管理后台的权限。</p>
          <button
            onClick={handleLogout}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            返回登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AdminLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </AdminLayout>
    </ErrorBoundary>
  )
}

export default AdminPage