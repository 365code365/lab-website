'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Database, Settings, User, Loader2 } from 'lucide-react'

interface DatabaseConfig {
  host: string
  port: string
  username: string
  password: string
  database: string
}

interface AdminUser {
  username: string
  email: string
  password: string
  confirmPassword: string
  name: string
}

export default function InstallPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checkingInstallation, setCheckingInstallation] = useState(true)
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)
  
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    host: 'localhost',
    port: '3306',
    username: '',
    password: '',
    database: 'lab_website'
  })
  
  const [adminUser, setAdminUser] = useState<AdminUser>({
    username: 'admin',
    email: '',
    password: '',
    confirmPassword: '',
    name: '系统管理员'
  })
  
  const [generateSeedData, setGenerateSeedData] = useState(false)

  // 检查系统是否已安装
  useEffect(() => {
    const checkInstallationStatus = async () => {
      try {
        const response = await fetch('/api/install/check-status')
        const result = await response.json()
        
        if (result.installed) {
          setAlreadyInstalled(true)
          // 3秒后自动重定向到主页
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      } catch (error) {
        console.error('检查安装状态失败:', error)
        // 如果检查失败，继续显示安装页面
      } finally {
        setCheckingInstallation(false)
      }
    }

    checkInstallationStatus()
  }, [router])

  const steps = [
    { id: 1, title: '数据库配置', icon: Database, description: '配置数据库连接信息' },
    { id: 2, title: '管理员账户', icon: User, description: '创建系统管理员账户' },
    { id: 3, title: '系统初始化', icon: Settings, description: '初始化数据库和系统设置' }
  ]

  const handleDbConfigChange = (field: keyof DatabaseConfig, value: string) => {
    setDbConfig(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleAdminUserChange = (field: keyof AdminUser, value: string) => {
    setAdminUser(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const testDatabaseConnection = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/install/test-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSuccess('数据库连接测试成功！')
        setTimeout(() => {
          setCurrentStep(2)
          setSuccess('')
        }, 1500)
      } else {
        setError(result.error || '数据库连接失败')
      }
    } catch (err) {
      console.error('数据库连接测试失败:', err)
      setError('网络错误，请检查服务器状态')
    } finally {
      setLoading(false)
    }
  }

  const validateAdminUser = () => {
    if (!adminUser.username || !adminUser.email || !adminUser.password) {
      setError('请填写所有必填字段')
      return false
    }
    
    if (adminUser.password !== adminUser.confirmPassword) {
      setError('密码确认不匹配')
      return false
    }
    
    if (adminUser.password.length < 6) {
      setError('密码长度至少6位')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminUser.email)) {
      setError('请输入有效的邮箱地址')
      return false
    }
    
    return true
  }

  const proceedToInstallation = () => {
    if (validateAdminUser()) {
      setCurrentStep(3)
      setError('')
    }
  }

  const performInstallation = async () => {
    setLoading(true)
    setError('')
    
    try {
      // 第一步：保存数据库配置
      const configResponse = await fetch('/api/install/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dbConfig })
      })
      
      if (!configResponse.ok) {
        throw new Error('保存数据库配置失败')
      }
      
      // 第二步：初始化数据库
      const initResponse = await fetch('/api/install/init-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!initResponse.ok) {
        throw new Error('数据库初始化失败')
      }
      
      // 第三步：创建管理员账户
      const adminData = {
        username: adminUser.username,
        email: adminUser.email,
        password: adminUser.password,
        name: adminUser.name
      }
      
      const adminResponse = await fetch('/api/install/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminData)
      })
      
      if (!adminResponse.ok) {
        throw new Error('创建管理员账户失败')
      }
      
      // 第四步：生成测试数据（可选）
      if (generateSeedData) {
        const seedResponse = await fetch('/api/install/seed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!seedResponse.ok) {
          throw new Error('生成测试数据失败')
        }
      }
      
      // 第五步：标记安装完成
      const completeResponse = await fetch('/api/install/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!completeResponse.ok) {
        throw new Error('完成安装标记失败')
      }
      
      setSuccess('系统安装完成！正在跳转到登录页面...')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '安装过程中发生错误')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">数据库主机</Label>
                <Input
                  id="host"
                  value={dbConfig.host}
                  onChange={(e) => handleDbConfigChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label htmlFor="port">端口</Label>
                <Input
                  id="port"
                  value={dbConfig.port}
                  onChange={(e) => handleDbConfigChange('port', e.target.value)}
                  placeholder="3306"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={dbConfig.username}
                onChange={(e) => handleDbConfigChange('username', e.target.value)}
                placeholder="数据库用户名"
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={dbConfig.password}
                onChange={(e) => handleDbConfigChange('password', e.target.value)}
                placeholder="数据库密码"
              />
            </div>
            <div>
              <Label htmlFor="database">数据库名</Label>
              <Input
                id="database"
                value={dbConfig.database}
                onChange={(e) => handleDbConfigChange('database', e.target.value)}
                placeholder="lab_website（如不存在将自动创建）"
              />
            </div>
            <Button 
              onClick={testDatabaseConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              测试连接并继续
            </Button>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-username">用户名</Label>
              <Input
                id="admin-username"
                value={adminUser.username}
                onChange={(e) => handleAdminUserChange('username', e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="admin-email">邮箱</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminUser.email}
                onChange={(e) => handleAdminUserChange('email', e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="admin-name">姓名</Label>
              <Input
                id="admin-name"
                value={adminUser.name}
                onChange={(e) => handleAdminUserChange('name', e.target.value)}
                placeholder="系统管理员"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">密码</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminUser.password}
                onChange={(e) => handleAdminUserChange('password', e.target.value)}
                placeholder="至少6位密码"
              />
            </div>
            <div>
              <Label htmlFor="admin-confirm-password">确认密码</Label>
              <Input
                id="admin-confirm-password"
                type="password"
                value={adminUser.confirmPassword}
                onChange={(e) => handleAdminUserChange('confirmPassword', e.target.value)}
                placeholder="再次输入密码"
              />
            </div>
            <Button 
              onClick={proceedToInstallation}
              className="w-full"
            >
              继续安装
            </Button>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4 text-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">准备安装系统</h3>
                <p className="text-gray-600">
                  系统将执行以下操作：
                </p>
                <ul className="text-left space-y-1 text-sm text-gray-600">
                  <li>• 保存数据库配置</li>
                  <li>• 自动创建数据库（如果不存在）</li>
                  <li>• 创建数据库表结构</li>
                  <li>• 初始化基础数据</li>
                  <li>• 创建管理员账户</li>
                  {generateSeedData && <li>• 生成测试数据</li>}
                  <li>• 完成系统安装</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="generateSeedData"
                  checked={generateSeedData}
                  onChange={(e) => setGenerateSeedData(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="generateSeedData" className="text-sm font-medium text-gray-700">
                  生成测试数据（包含示例用户、研究人员、发表论文等数据）
                </label>
              </div>
            </div>
            <Button 
              onClick={performInstallation} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? '正在安装...' : '开始安装'}
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  // 如果正在检查安装状态，显示加载界面
  if (checkingInstallation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">正在检查系统安装状态...</p>
        </div>
      </div>
    )
  }

  // 如果系统已安装，显示已安装提示
  if (alreadyInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <CardTitle className="text-2xl text-green-700">系统已安装</CardTitle>
              <CardDescription>
                Lab Website 系统已经安装完成，正在为您跳转到主页...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>3秒后自动跳转，或者您可以：</p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push('/')}
                    className="w-full"
                  >
                    立即前往主页
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Website 系统安装</h1>
          <p className="text-gray-600">欢迎使用实验室网站管理系统，请按照步骤完成安装</p>
        </div>
        
        {/* 步骤指示器 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            
            {renderStepContent()}
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>安装过程中遇到问题？请检查数据库配置或联系技术支持</p>
        </div>
      </div>
    </div>
  )
}