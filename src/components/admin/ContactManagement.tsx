'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Edit, Trash2 } from 'lucide-react'
import Pagination from './common/Pagination'

interface Contact {
  id: number
  name: string | null
  phone: string | null
  email: string | null
  reason: string
  status: 'pending' | 'processed' | 'closed'
  ipAddress: string
  userAgent: string
  adminNote: string | null
  createdAt: string
  updatedAt: string
  processor: {
    id: number
    username: string
    name: string | null
  } | null
}

interface ContactsResponse {
  success: boolean
  data: {
    contacts: Contact[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  error?: string
}

interface UpdateContactData {
  id: number
  status?: string
  adminNote?: string
}

export default function ContactManagement() {
  const { currentUser, isLoading, isAdminUser } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  })
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    adminNote: ''
  })
  const [updating, setUpdating] = useState(false)

  // 获取联系记录
  const fetchContacts = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      })
      
      const response = await fetch(`/api/contact?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result: ContactsResponse = await response.json()
      
      if (result.success) {
        setContacts(result.data.contacts)
        setPagination(result.data.pagination)
      } else {
        setError(result.error || '获取联系记录失败')
      }
    } catch (error) {
      console.error('获取联系记录失败:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 更新联系记录
  const updateContact = async (data: UpdateContactData) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setUpdating(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 更新本地状态
        setContacts(prev => prev.map(contact => 
          contact.id === data.id ? { ...contact, ...result.data } : contact
        ))
        setEditingContact(null)
        setEditForm({ status: '', adminNote: '' })
      } else {
        setError(result.error || '更新联系记录失败')
      }
    } catch (error) {
      console.error('更新联系记录失败:', error)
      setError('网络错误，请重试')
    } finally {
      setUpdating(false)
    }
  }

  // 删除联系记录
  const deleteContact = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token || !confirm('确定要删除这条联系记录吗？')) return
    
    try {
      const response = await fetch(`/api/contact?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setContacts(prev => prev.filter(contact => contact.id !== id))
        // 如果当前页没有数据了，回到上一页
        if (contacts.length === 1 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }))
        }
      } else {
        setError(result.error || '删除联系记录失败')
      }
    } catch (error) {
      console.error('删除联系记录失败:', error)
      setError('网络错误，请重试')
    }
  }

  // 开始编辑
  const startEdit = (contact: Contact) => {
    setEditingContact(contact)
    setEditForm({
      status: contact.status,
      adminNote: contact.adminNote || ''
    })
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingContact(null)
    setEditForm({ status: '', adminNote: '' })
  }

  // 保存编辑
  const saveEdit = () => {
    if (!editingContact) return
    
    updateContact({
      id: editingContact.id,
      status: editForm.status,
      adminNote: editForm.adminNote
    })
  }

  // 处理筛选变化
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理'
      case 'processed': return '已处理'
      case 'closed': return '已关闭'
      default: return status
    }
  }

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processed': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  useEffect(() => {
    fetchContacts()
  }, [pagination.page, pagination.limit, filters])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">联系记录管理</h1>
        <div className="text-sm text-gray-500">
          共 {pagination.total} 条记录
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">关闭</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态筛选
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processed">已处理</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              搜索
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="搜索姓名、邮箱、电话或理由..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchContacts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 联系记录列表 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {contacts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无联系记录</h3>
            <p className="mt-1 text-sm text-gray-500">还没有用户提交联系信息</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    联系信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    联系理由
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    处理人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.name && <div className="font-medium">{contact.name}</div>}
                        {contact.email && <div className="text-blue-600">{contact.email}</div>}
                        {contact.phone && <div className="text-gray-600">{contact.phone}</div>}
                        <div className="text-xs text-gray-400 mt-1">
                          IP: {contact.ipAddress}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={contact.reason}>
                        {contact.reason}
                      </div>
                      {contact.adminNote && (
                        <div className="text-xs text-gray-500 mt-1">
                          备注: {contact.adminNote}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(contact.status)}`}>
                        {getStatusText(contact.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.processor ? (
                        <div>
                          <div className="font-medium">{contact.processor.name || contact.processor.username}</div>
                          <div className="text-xs text-gray-400">{contact.processor.username}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">未处理</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEdit(contact)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="编辑联系记录"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="删除联系记录"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {contacts.length > 0 && (
        <Pagination
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.pages,
            pageSize: pagination.limit,
            total: pagination.total
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={(pageSize) => {
            setPagination(prev => ({ ...prev, limit: pageSize, page: 1 }))
          }}
          showQuickJumper={true}
          showSizeChanger={true}
        />
      )}

      {/* 编辑模态框 */}
      {editingContact && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                编辑联系记录
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    状态
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">待处理</option>
                    <option value="processed">已处理</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    管理员备注
                  </label>
                  <textarea
                    value={editForm.adminNote}
                    onChange={(e) => setEditForm(prev => ({ ...prev, adminNote: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="添加处理备注..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={saveEdit}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}