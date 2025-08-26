import React, { useState, useEffect } from 'react'
import { Table, Button, message, Modal, Tag, Space, Tooltip, Card, Typography, Checkbox, Divider } from 'antd'
import { EyeOutlined, ImportOutlined, DeleteOutlined, FileWordOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { DeleteConfirmModal } from './modals/ConfirmModal'

const { Text, Paragraph } = Typography

interface DocumentArticle {
  id: number
  content: string
  order: number
  isImported: boolean
  importedArticleId?: number
}

interface Document {
  id: number
  filename: string
  originalName: string
  fileSize: number
  status: string
  articleCount: number
  parseError?: string
  createdAt: string
  creator: {
    id: number
    username: string
    name: string
  }
  articles: DocumentArticle[]
}

interface DocumentPreviewProps {
  documents: Document[]
  loading: boolean
  onRefresh: () => void
  onDelete: (documentId: number) => void
  onImportArticles: (documentId: number, articleIds: number[]) => void
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documents,
  loading,
  onRefresh,
  onDelete,
  onImportArticles
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([])
  const [importing, setImporting] = useState(false)

  const getStatusTag = (status: string) => {
    const statusConfig = {
      uploaded: { color: 'blue', text: '已上传' },
      parsing: { color: 'orange', text: '解析中' },
      parsed: { color: 'green', text: '解析完成' },
      failed: { color: 'red', text: '解析失败' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const handlePreview = (document: Document) => {
    setSelectedDocument(document)
    setSelectedArticleIds([])
    setPreviewVisible(true)
  }

  const handleImport = async () => {
    if (!selectedDocument || selectedArticleIds.length === 0) {
      message.warning('请选择要导入的文章')
      return
    }

    setImporting(true)
    try {
      await onImportArticles(selectedDocument.id, selectedArticleIds)
      message.success(`成功导入 ${selectedArticleIds.length} 篇文章`)
      setPreviewVisible(false)
      setSelectedArticleIds([])
      onRefresh()
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入文章失败')
    } finally {
      setImporting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (!selectedDocument) return
    
    if (checked) {
      const availableIds = selectedDocument.articles
        .filter(article => !article.isImported)
        .map(article => article.id)
      setSelectedArticleIds(availableIds)
    } else {
      setSelectedArticleIds([])
    }
  }

  const handleSelectArticle = (articleId: number, checked: boolean) => {
    if (checked) {
      setSelectedArticleIds(prev => [...prev, articleId])
    } else {
      setSelectedArticleIds(prev => prev.filter(id => id !== articleId))
    }
  }

  const columns: ColumnsType<Document> = [
    {
      title: '文档名称',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text: string, record: Document) => (
        <Space>
          <FileWordOutlined style={{ color: '#1890ff' }} />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {(record.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: Document) => (
        <div>
          {getStatusTag(status)}
          {record.parseError && (
            <Tooltip title={record.parseError}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '文章数量',
      dataIndex: 'articleCount',
      key: 'articleCount',
      width: 100,
      render: (count: number, record: Document) => {
        const importedCount = record.articles?.filter(a => a.isImported).length || 0
        return (
          <div>
            <div>{count || 0} 篇</div>
            {importedCount > 0 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                已导入 {importedCount} 篇
              </Text>
            )}
          </div>
        )
      }
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: any) => creator?.name || creator?.username || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: Document) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            disabled={record.status !== 'parsed'}
          >
            预览
          </Button>
          <Button
            type="link"
            icon={<ImportOutlined />}
            onClick={() => handlePreview(record)}
            disabled={record.status !== 'parsed' || record.articles?.every(a => a.isImported)}
          >
            导入
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setDeletingDocument(record)
              setShowDeleteModal(true)
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const availableArticles = selectedDocument?.articles?.filter(article => !article.isImported) || []
  const allSelected = availableArticles.length > 0 && selectedArticleIds.length === availableArticles.length
  const indeterminate = selectedArticleIds.length > 0 && selectedArticleIds.length < availableArticles.length

  return (
    <div className="document-preview">
      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个文档`
        }}
      />

      <Modal
        title={(
          <Space>
            <FileWordOutlined />
            文档预览 - {selectedDocument?.originalName}
          </Space>
        )}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            icon={<ImportOutlined />}
            loading={importing}
            disabled={selectedArticleIds.length === 0}
            onClick={handleImport}
          >
            导入选中文章 ({selectedArticleIds.length})
          </Button>
        ]}
      >
        {selectedDocument && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div><strong>文档信息：</strong></div>
                <div>文件名：{selectedDocument.originalName}</div>
                <div>文件大小：{(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                <div>解析状态：{getStatusTag(selectedDocument.status)}</div>
                <div>文章总数：{selectedDocument.articleCount} 篇</div>
                <div>已导入：{selectedDocument.articles.filter(a => a.isImported).length} 篇</div>
              </Space>
            </Card>

            {availableArticles.length > 0 && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Checkbox
                    indeterminate={indeterminate}
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  >
                    全选可导入文章 ({availableArticles.length} 篇)
                  </Checkbox>
                </div>
                <Divider style={{ margin: '12px 0' }} />
              </div>
            )}

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {selectedDocument.articles.map((article, index) => (
                <Card
                  key={article.id}
                  size="small"
                  style={{ marginBottom: 12 }}
                  title={
                    <Space>
                      {!article.isImported ? (
                        <Checkbox
                          checked={selectedArticleIds.includes(article.id)}
                          onChange={(e) => handleSelectArticle(article.id, e.target.checked)}
                        />
                      ) : (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      )}
                      <span>文章 {article.order}</span>
                      {article.isImported && (
                        <Tag color="green">已导入</Tag>
                      )}
                    </Space>
                  }
                >
                  {(() => {
                    try {
                      const parsedData = JSON.parse(article.content)
                      if (parsedData.type === 'academic_paper' && parsedData.parsedInfo) {
                        const info = parsedData.parsedInfo
                        return (
                          <div style={{ margin: 0 }}>
                            <div style={{ marginBottom: 8 }}>
                              <strong>标题：</strong>{info.title || '未知'}
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <strong>作者：</strong>{info.authors || '未知'}
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <strong>期刊：</strong>{info.journal || '未知'}
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                              <span><strong>年份：</strong>{info.publishedDate || '未知'}</span>
                              {info.volume && <span><strong>卷：</strong>{info.volume}</span>}
                              {info.issue && <span><strong>期：</strong>{info.issue}</span>}
                              {info.pages && <span><strong>页码：</strong>{info.pages}</span>}
                            </div>
                            {info.doi && (
                              <div style={{ marginBottom: 8 }}>
                                <strong>DOI：</strong>{info.doi}
                              </div>
                            )}
                          </div>
                        )
                      }
                    } catch (e) {
                      // 如果不是JSON格式，显示原始内容
                    }
                    return (
                      <Paragraph
                        ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                        style={{ margin: 0 }}
                      >
                        {article.content}
                      </Paragraph>
                    )
                  })()}
                </Card>
              ))}
            </div>

            {selectedDocument.articles.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无解析出的文章内容
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingDocument(null)
        }}
        onConfirm={() => {
          if (deletingDocument) {
            onDelete(deletingDocument.id)
          }
        }}
        itemName={`文档 "${deletingDocument?.originalName}"`}
      />
    </div>
  )
}

export default DocumentPreview