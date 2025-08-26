import React, { useState, useEffect } from 'react'
import { Trophy, FileText, Plus, Upload, Download, Filter, File } from 'lucide-react'
import type { Article, Award } from '@/types/admin'
import ArticlesTable from '../tables/ArticlesTable'
import ArticleForm from '../forms/ArticleForm'
import AdminModal from '../modals/AdminModal'
import ConfirmModal from '../modals/ConfirmModal'
import SearchBar from '../common/SearchBar'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorBoundary from '../common/ErrorBoundary'
import AwardManagement from '../team/AwardManagement'
import DocumentUpload from '../DocumentUpload'
import DocumentPreview from '../DocumentPreview'
import { usePagination } from '@/hooks/usePagination'
import { useAdminData } from '@/hooks/useAdminData'

interface AchievementsTabProps {
  className?: string
}

type TabType = 'articles' | 'awards' | 'documents'

const AchievementsTab: React.FC<AchievementsTabProps> = ({ className = '' }) => {
  const {
    articles,
    awards,
    loading,
    fetchArticles,
    fetchAwards,
    createArticle,
    updateArticle,
    deleteArticle,
    exportArticles,
    importArticles
  } = useAdminData()

  // 当前活跃标签
  const [activeTab, setActiveTab] = useState<TabType>('articles')

  // 文档管理状态
  const [documents, setDocuments] = useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)

  // 文章分页
  const {
    getPagination,
    handlePageChange,
    handlePageSizeChange,
    resetPagination
  } = usePagination()

  const articlesPagination = getPagination('articles')
  const { currentPage: articlesCurrentPage, pageSize: articlesPageSize } = articlesPagination



  // 文章状态管理
  const [articlesSearchTerm, setArticlesSearchTerm] = useState('')
  const [articlesFilterCategory, setArticlesFilterCategory] = useState<string>('')
  const [articlesFilterStatus, setArticlesFilterStatus] = useState<string>('')
  const [articlesSortField, setArticlesSortField] = useState<keyof Article>('publishedDate')
  const [articlesSortDirection, setArticlesSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])


  
  // 模态框状态
  const [showArticleModal, setShowArticleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: 'article', item: Article } | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  
  // 操作状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // 初始化数据
  useEffect(() => {
    fetchArticles()
    fetchAwards()
  }, [fetchArticles, fetchAwards])

  // 过滤和排序文章数据
  const filteredAndSortedArticles = React.useMemo(() => {
    if (!articles || !Array.isArray(articles)) {
      return []
    }

    const filtered = articles.filter(article => {
      const matchesSearch = !articlesSearchTerm || 
        article.title.toLowerCase().includes(articlesSearchTerm.toLowerCase()) ||
        (article.abstract && article.abstract.toLowerCase().includes(articlesSearchTerm.toLowerCase())) ||
        article.authors.toLowerCase().includes(articlesSearchTerm.toLowerCase()) ||
        (article.keywords && article.keywords.toLowerCase().includes(articlesSearchTerm.toLowerCase()))
      
      const matchesCategory = !articlesFilterCategory || article.category === articlesFilterCategory
      const matchesStatus = !articlesFilterStatus || 'published' === articlesFilterStatus // 硬编码状态，因为 Article 类型没有 status 属性
      
      return matchesSearch && matchesCategory && matchesStatus
    })

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[articlesSortField]
      const bValue = b[articlesSortField]
      
      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1
      
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }
      
      return articlesSortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [articles, articlesSearchTerm, articlesFilterCategory, articlesFilterStatus, articlesSortField, articlesSortDirection])



  // 计算文章分页数据
  const paginatedArticles = React.useMemo(() => {
    if (!filteredAndSortedArticles || !Array.isArray(filteredAndSortedArticles)) return []
    const startIndex = (articlesCurrentPage - 1) * articlesPageSize
    const endIndex = startIndex + articlesPageSize
    return filteredAndSortedArticles.slice(startIndex, endIndex)
  }, [filteredAndSortedArticles, articlesCurrentPage, articlesPageSize])



  // 重置分页当过滤条件改变时
  useEffect(() => {
    resetPagination('articles')
  }, [articlesSearchTerm, articlesFilterCategory, articlesFilterStatus, resetPagination])



  // 处理标签切换
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSelectedArticles([])
    
    if (tab === 'documents') {
      fetchDocuments()
    }
  }

  // 获取文档列表
  const fetchDocuments = async () => {
    setDocumentsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setDocuments(result.data || [])
      }
    } catch (error) {
      console.error('获取文档列表失败:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }

  // 文档上传成功处理
  const handleDocumentUploadSuccess = (document: any) => {
    setDocuments(prev => [document, ...prev])
    // 定期检查解析状态
    const checkInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/documents?id=${document.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          const updatedDoc = result.data.find((d: any) => d.id === document.id)
          if (updatedDoc && updatedDoc.status !== 'parsing') {
            setDocuments(prev => prev.map(d => d.id === document.id ? updatedDoc : d))
            clearInterval(checkInterval)
          }
        }
      } catch (error) {
        console.error('检查文档状态失败:', error)
        clearInterval(checkInterval)
      }
    }, 2000)
    
    // 30秒后停止检查
    setTimeout(() => clearInterval(checkInterval), 30000)
  }

  // 文档上传失败处理
  const handleDocumentUploadError = (error: string) => {
    console.error('文档上传失败:', error)
  }

  // 删除文档
  const handleDeleteDocument = async (documentId: number) => {
    console.log('开始删除文档，ID:', documentId)
    try {
      const token = localStorage.getItem('token')
      console.log('获取到的token:', token ? '存在' : '不存在')
      if (!token) {
        alert('请先登录')
        return
      }

      console.log('发送删除请求到:', `/api/documents?id=${documentId}`)
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('响应状态:', response.status)
      const result = await response.json()
      console.log('响应结果:', result)
      
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentId))
        alert('文档删除成功')
      } else {
        console.error('删除失败:', result.error)
        alert(result.error || '删除文档失败')
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      alert('删除文档失败，请重试')
    }
  }

  // 导入文章
  const handleImportArticles = async (documentId: number, articleIds: number[]) => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/documents/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ documentId, articleIds })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '导入失败')
    }
    
    // 刷新文档列表
    await fetchDocuments()
  }

  // 文章相关处理函数
  const handleArticlesSearch = (term: string) => {
    setArticlesSearchTerm(term)
  }

  const handleAddArticle = () => {
    setEditingArticle(null)
    setShowArticleModal(true)
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setShowArticleModal(true)
  }

  const handleArticleSubmit = async (articleData: Partial<Article>) => {
    setIsSubmitting(true)
    try {
      if (editingArticle) {
        await updateArticle(articleData, editingArticle.id)
      } else {
        await createArticle(articleData)
      }
      setShowArticleModal(false)
      setEditingArticle(null)
      await fetchArticles()
    } catch (error) {
      console.error('保存文章失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteArticle = (article: Article) => {
    setDeletingItem({ type: 'article', item: article })
    setShowDeleteModal(true)
  }



  // 删除文章处理
  const confirmDelete = async () => {
    if (!deletingItem) return
    
    setIsDeleting(true)
    try {
      await deleteArticle(deletingItem.item.id)
      await fetchArticles()
      setShowDeleteModal(false)
      setDeletingItem(null)
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // 导出文章数据
  const handleExport = async () => {
    if (activeTab !== 'articles') return
    
    setIsExporting(true)
    try {
      await exportArticles()
    } catch (error) {
      console.error('导出失败:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // 导入文章数据
  const handleImport = async (file: File) => {
    if (activeTab !== 'articles') return
    
    setIsImporting(true)
    try {
      await importArticles(file)
      await fetchArticles()
    } catch (error) {
      console.error('导入失败:', error)
    } finally {
      setIsImporting(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 移除 error 检查，因为 useAdminData 没有返回 error 属性

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* 标签导航 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-12">
            <button
              onClick={() => handleTabChange('articles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              文章管理
            </button>
            <button
              onClick={() => handleTabChange('awards')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'awards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4 inline-block mr-2" />
              获奖管理
            </button>
            <button
              onClick={() => handleTabChange('documents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <File className="w-4 h-4 inline-block mr-2" />
              导入文档管理
            </button>
          </nav>
        </div>

        {/* 工具栏 - 仅在文章标签时显示 */}
        {activeTab === 'articles' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <SearchBar
                placeholder="搜索文章..."
                value={articlesSearchTerm}
                onSearch={handleArticlesSearch}
                className="w-full sm:w-64"
              />
              
              {/* 过滤器 */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={articlesFilterCategory}
                  onChange={(e) => setArticlesFilterCategory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">所有分类</option>
                  <option value="Quantum Computing">量子计算</option>
                  <option value="Machine Learning">机器学习</option>
                  <option value="Computer Vision">计算机视觉</option>
                </select>
                <select
                  value={articlesFilterStatus}
                  onChange={(e) => setArticlesFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">所有状态</option>
                  <option value="published">已发表</option>
                  <option value="accepted">已接收</option>
                  <option value="under_review">审稿中</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? '导出中...' : '导出'}
              </button>
              
              <label className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" />
                {isImporting ? '导入中...' : '导入'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImport(file)
                    }
                  }}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
              
              <button
                onClick={handleAddArticle}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                添加文章
              </button>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'articles' ? (
            <ArticlesTable
              articles={paginatedArticles}
              loading={loading}
              error={null}
              pagination={{
                currentPage: articlesCurrentPage,
                pageSize: articlesPageSize,
                total: filteredAndSortedArticles.length,
                totalPages: Math.ceil(filteredAndSortedArticles.length / articlesPageSize)
              }}
              onEdit={handleEditArticle}
              onDelete={handleDeleteArticle}
              onPageChange={(page) => handlePageChange('articles', page)}
              onPageSizeChange={(size) => handlePageSizeChange('articles', size)}
            />
          ) : activeTab === 'awards' ? (
            <AwardManagement
              awards={awards || []}
              loading={loading}
              onDataRefresh={fetchAwards}
            />
          ) : (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">上传文档</h3>
                  <DocumentUpload
                    onUploadSuccess={handleDocumentUploadSuccess}
                    onUploadError={handleDocumentUploadError}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">文档列表</h3>
                  <DocumentPreview
                    documents={documents}
                    loading={documentsLoading}
                    onRefresh={fetchDocuments}
                    onDelete={handleDeleteDocument}
                    onImportArticles={handleImportArticles}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 模态框 */}
        <AdminModal
          isOpen={showArticleModal}
          onClose={() => {
            setShowArticleModal(false)
            setEditingArticle(null)
          }}
          title={editingArticle ? '编辑文章' : '添加文章'}
        >
          <ArticleForm
            article={editingArticle}
            onSubmit={handleArticleSubmit}
            onCancel={() => {
              setShowArticleModal(false)
              setEditingArticle(null)
            }}
            loading={isSubmitting}
          />
        </AdminModal>



        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDeletingItem(null)
          }}
          onConfirm={confirmDelete}
          title="确认删除"
          message="确定要删除这篇文章吗？此操作不可撤销。"
          confirmText="删除"
          cancelText="取消"
          loading={isDeleting}
          // variant="danger" // 移除不存在的 variant 属性
        />
      </div>
    </ErrorBoundary>
  )
}

export default AchievementsTab