'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import io from 'socket.io-client'

export default function WhatsAppPage() {
  const router = useRouter()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // الاتصال بـ Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000')
    setSocket(newSocket)

    // الاستماع لأحداث WhatsApp
    newSocket.on('whatsapp:qr', (data: any) => {
      console.log('QR Code received:', data)
      setQrCode(data.qrCode)
    })

    newSocket.on('whatsapp:connected', (data: any) => {
      console.log('WhatsApp connected:', data)
      fetchStatus()
      setQrCode(null)
    })

    newSocket.on('whatsapp:disconnected', (data: any) => {
      console.log('WhatsApp disconnected:', data)
      fetchStatus()
    })

    newSocket.on('whatsapp:error', (data: any) => {
      console.error('WhatsApp error:', data)
      alert('حدث خطأ: ' + data.error)
    })

    // جلب الحالة الأولية
    fetchStatus()

    return () => {
      newSocket.close()
    }
  }, [router])

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
        if (data.data.qrCode) {
          setQrCode(data.data.qrCode)
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
      } else {
        alert('فشل التهيئة: ' + data.error)
      }
    } catch (error: any) {
      alert('خطأ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('هل أنت متأكد من قطع الاتصال؟')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
        fetchStatus()
      }
    } catch (error: any) {
      alert('خطأ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !status) {
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← العودة للداشبورد
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📱 ربط WhatsApp</h1>
          <p className="text-gray-600 mt-2">قم بربط حساب WhatsApp الخاص بك لبدء الإرسال</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-2">حالة الاتصال</h2>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ml-2 ${status?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${status?.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {status?.isConnected ? 'متصل' : 'غير متصل'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {!status?.isConnected ? (
                <button
                  onClick={handleInitialize}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري التهيئة...' : 'بدء الاتصال'}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  قطع الاتصال
                </button>
              )}
            </div>
          </div>

          {/* Connection Info */}
          {status?.isConnected && status?.phoneNumber && (
            <div className="border-t pt-6">
              <h3 className="font-bold mb-3">معلومات الاتصال:</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">رقم الهاتف:</span> {status.phoneNumber}</p>
                <p><span className="font-medium">آخر اتصال:</span> {new Date(status.lastConnected).toLocaleString('ar-EG')}</p>
                {status.statistics && (
                  <>
                    <p><span className="font-medium">الرسائل المرسلة:</span> {status.statistics.totalMessagesSent}</p>
                    <p><span className="font-medium">الرسائل المستقبلة:</span> {status.statistics.totalMessagesReceived}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* QR Code */}
        {qrCode && !status?.isConnected && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold mb-4">مسح رمز QR</h2>
            <p className="text-gray-600 mb-6">
              افتح WhatsApp على هاتفك → الإعدادات → الأجهزة المرتبطة → ربط جهاز
            </p>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg border-4 border-gray-200">
                {qrCode.startsWith('data:image') ? (
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                ) : (
                  <QRCodeSVG value={qrCode} size={256} />
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 سيتم تحديث الرمز تلقائياً كل 30 ثانية
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!status?.isConnected && !qrCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold mb-3 text-blue-900">📝 كيفية الربط:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>اضغط على زر "بدء الاتصال"</li>
              <li>انتظر ظهور رمز QR</li>
              <li>افتح WhatsApp على هاتفك</li>
              <li>اذهب إلى: الإعدادات ← الأجهزة المرتبطة ← ربط جهاز</li>
              <li>امسح رمز QR المعروض على الشاشة</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
