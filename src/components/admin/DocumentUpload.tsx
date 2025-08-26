import React, { useState } from 'react'
import { Upload, Button, message, Progress } from 'antd'
import { UploadOutlined, FileWordOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'

interface DocumentUploadProps {
  onUploadSuccess: (document: any) => void
  onUploadError: (error: string) => void
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请选择要上传的文件')
      return
    }

    const file = fileList[0]
    const formData = new FormData()
    // 确保使用原始文件对象，保持所有属性
    const actualFile = file.originFileObj || file
    formData.append('file', actualFile as File)

    setUploading(true)
    setUploadProgress(0)

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '上传失败')
      }

      const result = await response.json()
      
      if (result.success) {
        message.success('文档上传成功，正在解析中...')
        setFileList([])
        onUploadSuccess(result.document)
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      message.error(errorMessage)
      onUploadError(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      // 检查文件类型
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const isDoc = file.type === 'application/msword'
      
      if (!isDocx && !isDoc) {
        message.error('只支持上传 .doc 或 .docx 文件！')
        return false
      }

      // 检查文件大小（限制为10MB）
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！')
        return false
      }

      setFileList([file])
      return false // 阻止自动上传
    },
    fileList,
    onRemove: () => {
      setFileList([])
    },
    multiple: false,
    accept: '.doc,.docx',
    showUploadList: {
      showPreviewIcon: false,
      showDownloadIcon: false,
      showRemoveIcon: true
    }
  }

  return (
    <div className="document-upload">
      <div className="upload-area">
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            disabled={uploading}
            size="large"
          >
            选择文档文件
          </Button>
        </Upload>
        
        {fileList.length > 0 && (
          <div className="file-info" style={{ marginTop: 16 }}>
            <div className="file-item">
              <FileWordOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              <span>{fileList[0].name}</span>
              <span style={{ marginLeft: 8, color: '#666' }}>
                ({(fileList[0].size! / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </div>
        )}
        
        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Progress 
              percent={uploadProgress} 
              status={uploadProgress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <p style={{ marginTop: 8, color: '#666' }}>
              {uploadProgress < 90 ? '正在上传...' : uploadProgress === 100 ? '上传完成，正在解析文档...' : '正在上传...'}
            </p>
          </div>
        )}
        
        <Button 
          type="primary" 
          onClick={handleUpload}
          disabled={fileList.length === 0 || uploading}
          loading={uploading}
          style={{ marginTop: 16 }}
          size="large"
        >
          {uploading ? '上传中...' : '开始上传'}
        </Button>
      </div>
      
      <div className="upload-tips" style={{ marginTop: 24, padding: 16, backgroundColor: '#f6f8fa', borderRadius: 6 }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#24292e' }}>上传说明：</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#586069' }}>
          <li>支持 .doc 和 .docx 格式的文档文件</li>
          <li>文件大小不能超过 10MB</li>
          <li>文档内容将以句号（.）作为分隔符自动分割为多篇文章</li>
          <li>上传后系统会自动解析文档内容，请耐心等待</li>
          <li>解析完成后可以预览和选择性导入文章到系统中</li>
        </ul>
      </div>
    </div>
  )
}

export default DocumentUpload