import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 max-w-4xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          🌟 رفيق النمو
        </h1>

        <p className="text-2xl text-gray-700 mb-8">
          نظام ذكي لمتابعة تطور الأطفال عبر WhatsApp
        </p>

        <div className="space-y-4">
          <p className="text-lg text-gray-600">
            مرافقة يومية • ذكاء اصطناعي • محتوى مخصص • ذاكرة طويلة المدى
          </p>
        </div>

        {/* بيانات الدخول التجريبية */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-green-800">
            <h3 className="text-xl font-bold mb-3">🚀 جاهز للاستخدام مباشرة!</h3>
            <p className="mb-3">استخدم بيانات الدخول التجريبية:</p>
            <div className="bg-white rounded-lg p-4 text-right font-mono text-sm">
              <p className="mb-2"><span className="font-bold">اسم المستخدم:</span> admin</p>
              <p><span className="font-bold">كلمة المرور:</span> 123456</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            تسجيل الدخول
          </Link>

          <Link
            href="/register"
            className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-4 px-8 rounded-lg text-lg border-2 border-blue-600 transition-colors"
          >
            إنشاء حساب جديد
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">ذكاء اصطناعي متقدم</h3>
            <p className="text-gray-600">
              محادثات ذكية مدعومة بـ GPT-4 تفهم احتياجات طفلك
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">عبر WhatsApp</h3>
            <p className="text-gray-600">
              تواصل سهل عبر التطبيق المفضل لديك
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">متابعة شاملة</h3>
            <p className="text-gray-600">
              تقارير مفصلة عن نمو وتطور طفلك
            </p>
          </div>
        </div>

        <div className="mt-12 text-gray-500 text-sm">
          <p>نسخة 1.0.0 • مبني بكل ❤️ للآباء والأمهات</p>
        </div>
      </div>
    </main>
  )
}
