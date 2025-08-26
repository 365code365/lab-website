import React, { useState } from 'react'
import { 
  Users, 
  UserCheck, 
  FileText, 
  Wrench, 
  Newspaper, 
  Trophy, 
  BarChart3, 
  Settings, 
  Home,
  ChevronDown,
  ChevronRight,
  Award,
  BookOpen,
  MessageSquare
} from 'lucide-react'

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
  className?: string
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: MenuItem[]
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isCollapsed = false, 
  onToggle,
  activeTab = 'dashboard',
  onTabChange,
  className = '' 
}) => {
  // const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>(['achievements'])

  // 菜单项配置
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: '仪表板',
      icon: Home,
      badge: ''
    },
    {
      id: 'users',
      label: '用户管理',
      icon: Users,
      badge: ''
    },
    {
      id: 'team',
      label: '团队管理',
      icon: UserCheck,
      badge: ''
    },
    {
      id: 'publications',
      label: '发表成果',
      icon: FileText,
      badge: ''
    },
    {
      id: 'tools',
      label: '工具管理',
      icon: Wrench,
      badge: ''
    },
    {
      id: 'news',
      label: '新闻管理',
      icon: Newspaper,
      badge: ''
    },
    {
      id: 'contacts',
      label: '联系记录',
      icon: MessageSquare,
      badge: ''
    },
    {
      id: 'achievements',
      label: '成果管理',
      icon: Trophy,
      badge: ''
    },

    {
      id: 'analytics',
      label: '数据分析',
      icon: BarChart3,
      badge: ''
    },
    {
      id: 'settings',
      label: '系统设置',
      icon: Settings,
      badge: ''
    }
  ]

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      // 处理有子菜单的项目
      setExpandedItems(prev => 
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      )
    } else {
      // 处理普通菜单项
      onTabChange?.(item.id)
    }
  }

  const handleSubItemClick = (parentId: string, subItem: MenuItem) => {
    // 对于成果管理的子项，需要特殊处理
    if (parentId === 'achievements') {
      onTabChange?.('achievements')
      // 这里可以添加额外的逻辑来设置子标签
    } else {
      onTabChange?.(subItem.id)
    }
  }

  const isItemActive = (itemId: string) => {
    return activeTab === itemId
  }

  const isParentActive = (item: MenuItem) => {
    if (!item.children) return false
    return item.children.some(child => isItemActive(child.id)) || activeTab === item.id
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = isItemActive(item.id)
    const isParentActiveItem = isParentActive(item)
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0
    const Icon = item.icon

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            isActive || isParentActiveItem
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } ${level > 0 ? 'ml-4' : ''}`}
          title={isCollapsed ? item.label : ''}
        >
          <Icon className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} />
          
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              
              {/* 徽章 */}
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {item.badge}
                </span>
              )}
              
              {/* 展开/收起图标 */}
              {hasChildren && (
                <div className="ml-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </>
          )}
        </button>

        {/* 子菜单 */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(subItem => {
              const SubIcon = subItem.icon
              const isSubActive = isItemActive(subItem.id)
              
              return (
                <button
                  key={subItem.id}
                  onClick={() => handleSubItemClick(item.id, subItem)}
                  className={`w-full flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isSubActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <SubIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="flex-1 text-left">{subItem.label}</span>
                  
                  {subItem.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      {subItem.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* 侧边栏头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">实验室管理</h1>
              <p className="text-xs text-gray-500">管理后台</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="mx-auto">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* 侧边栏底部 */}
      <div className="border-t border-gray-200 p-3">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center">
            <div>实验室管理系统</div>
            <div className="mt-1">v1.0.0</div>
          </div>
        )}
        
        {/* 折叠/展开按钮 */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="w-full mt-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <div className={`transform transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}>
              <ChevronRight className="h-4 w-4 mx-auto" />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export default AdminSidebar