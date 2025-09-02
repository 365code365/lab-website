'use client'

import { useState, useEffect } from 'react'
import { Mail, Award, BookOpen, Briefcase } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from '@/contexts/LocaleContext'

interface PI {
  id: number
  name: string
  photo?: string
  title: string
  email: string
  experience?: string
  positions?: string
  awards?: string
  papers?: string
}

interface Researcher {
  id: number
  name: string
  photo?: string
  email: string
  direction?: string
  type: string
}

interface Graduate {
  id: number
  name: string
  position?: string
  email?: string
  company?: string
  enrollmentDate?: string
  graduationDate?: string
  advisor?: string
  degree?: string
  discipline?: string
  thesisTitle?: string
  remarks?: string
}

const TeamPage = () => {
  const t = useTranslations('team')
  const [pi, setPi] = useState<PI | null>(null)
  const [researchers, setResearchers] = useState<Researcher[]>([])
  const [graduates, setGraduates] = useState<Graduate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch('/api/team')
        if (response.ok) {
          const data = await response.json()
          setPi(data.pi)
          setResearchers(data.researchers || [])
          setGraduates(data.graduates || [])
        } else {
          console.error('获取团队数据失败')
        }
      } catch (error) {
        console.error('获取团队数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* PI Section */}
        {pi && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('principalInvestigator')}</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    {pi.photo ? (
                      <Image
                        src={pi.photo}
                        alt={pi.name}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500">{t('photo')}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pi.name}</h3>
                    <p className="text-lg text-blue-600 mb-2">{pi.title}</p>
                    <div className="flex items-center text-gray-600">
                      <Mail size={16} className="mr-2" />
                      <a href={`mailto:${pi.email}`} className="hover:text-blue-600">
                        {pi.email}
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pi.experience && (
                      <div>
                        <div className="flex items-center mb-3">
                          <Briefcase size={20} className="text-blue-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">{t('workExperience')}</h4>
                        </div>
                        <div className="text-gray-600 whitespace-pre-line text-sm">
                          {pi.experience}
                        </div>
                      </div>
                    )}

                    {pi.awards && (
                      <div>
                        <div className="flex items-center mb-3">
                          <Award size={20} className="text-green-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">{t('academicAwards')}</h4>
                        </div>
                        <div className="text-gray-600 whitespace-pre-line text-sm">
                          {pi.awards}
                        </div>
                      </div>
                    )}

                    {pi.positions && (
                      <div>
                        <div className="flex items-center mb-3">
                          <Briefcase size={20} className="text-purple-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">{t('socialPositions')}</h4>
                        </div>
                        <div className="text-gray-600 whitespace-pre-line text-sm">
                          {pi.positions}
                        </div>
                      </div>
                    )}

                    {pi.papers && (
                      <div>
                        <div className="flex items-center mb-3">
                          <BookOpen size={20} className="text-orange-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">{t('representativePapers')}</h4>
                        </div>
                        <div className="text-gray-600 whitespace-pre-line text-sm">
                          {pi.papers}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Researchers Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('researchers')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchers.map((researcher, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {researcher.photo ? (
                    <Image
                      src={researcher.photo}
                      alt={researcher.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">{t('photo')}</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{researcher.name}</h3>
                <p className="text-blue-600 text-sm mb-2">{researcher.type}</p>
                <p className="text-gray-600 text-sm mb-3">{researcher.direction}</p>
                <div className="flex items-center justify-center text-gray-500">
                  <Mail size={14} className="mr-1" />
                  <a href={`mailto:${researcher.email}`} className="text-xs hover:text-blue-600">
                    {researcher.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Graduates Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('graduates')}</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('enrollmentDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('graduationDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('advisor')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('degree')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('discipline')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('thesisTitle')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('remarks')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {graduates.map((graduate, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {graduate.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {graduate.enrollmentDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {graduate.graduationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {graduate.advisor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {graduate.degree}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {graduate.discipline}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={graduate.thesisTitle}>
                        {graduate.thesisTitle}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={graduate.remarks}>
                        {graduate.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default TeamPage