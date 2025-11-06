'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🌟 رفيق النمو</h1>
              <p className="text-sm text-gray-600">مرحباً، {user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl">👨‍👩‍👧‍👦</div>
              <div className="mr-4">
                <p className="text-gray-600 text-sm">الأسر المسجلة</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl">👶</div>
              <div className="mr-4">
                <p className="text-gray-600 text-sm">الأطفال</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl">💬</div>
              <div className="mr-4">
                <p className="text-gray-600 text-sm">الرسائل اليوم</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl">📱</div>
              <div className="mr-4">
                <p className="text-gray-600 text-sm">حالة WhatsApp</p>
                <p className="text-sm font-medium text-red-600">غير متصل</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/whatsapp"
              className="flex items-center justify-center p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
            >
              <span className="text-2xl ml-3">📱</span>
              <span className="font-medium">ربط WhatsApp</span>
            </Link>

            <Link
              href="/dashboard/families"
              className="flex items-center justify-center p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl ml-3">👨‍👩‍👧‍👦</span>
              <span className="font-medium">إدارة الأسر</span>
            </Link>

            <Link
              href="/dashboard/recipients"
              className="flex items-center justify-center p-4 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <span className="text-2xl ml-3">👥</span>
              <span className="font-medium">إدارة المستقبلين</span>
            </Link>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/children"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">👶</div>
            <h3 className="text-lg font-bold mb-2">إدارة الأطفال</h3>
            <p className="text-gray-600 text-sm">عرض وإدارة بيانات الأطفال والنمو</p>
          </Link>

          <Link
            href="/dashboard/schedules"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-bold mb-2">جدولة الرسائل</h3>
            <p className="text-gray-600 text-sm">إنشاء وإدارة الرسائل المجدولة</p>
          </Link>

          <Link
            href="/dashboard/conversations"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-bold mb-2">المحادثات</h3>
            <p className="text-gray-600 text-sm">عرض وإدارة المحادثات مع الأسر</p>
          </Link>

          <Link
            href="/dashboard/recommendations"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-lg font-bold mb-2">التوصيات</h3>
            <p className="text-gray-600 text-sm">إدارة التوصيات والأنشطة</p>
          </Link>

          <Link
            href="/dashboard/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">التقارير</h3>
            <p className="text-gray-600 text-sm">تقارير وإحصائيات مفصلة</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold mb-2">الإعدادات</h3>
            <p className="text-gray-600 text-sm">إعدادات النظام والذكاء الاصطناعي</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
