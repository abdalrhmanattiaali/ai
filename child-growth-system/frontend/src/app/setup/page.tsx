'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SetupStep {
  id: number;
  title: string;
  description: string;
}

interface SetupData {
  // Database Type
  dbType: 'sqlite' | 'mysql' | 'mongodb';

  // Database Mode (for MySQL)
  dbMode: 'create' | 'connect';

  // MySQL/MongoDB fields
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;

  // For creating new MySQL database
  rootUser: string;
  rootPassword: string;

  // API Keys
  openaiKey: string;
  weatherKey: string;

  // Email
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;

  // Admin
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
}

const STEPS: SetupStep[] = [
  {
    id: 1,
    title: 'قاعدة البيانات',
    description: 'اختر نوع قاعدة البيانات'
  },
  {
    id: 2,
    title: 'مفاتيح API',
    description: 'OpenAI و Weather API'
  },
  {
    id: 3,
    title: 'البريد الإلكتروني',
    description: 'إعدادات SMTP للإشعارات'
  },
  {
    id: 4,
    title: 'المستخدم الإداري',
    description: 'إنشاء حساب المدير'
  },
  {
    id: 5,
    title: 'WhatsApp',
    description: 'ربط حساب واتساب'
  }
];

export default function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [setupData, setSetupData] = useState<SetupData>({
    dbType: 'sqlite', // SQLite كخيار افتراضي
    dbMode: 'connect',
    dbHost: '',
    dbPort: '3306',
    dbName: '',
    dbUser: '',
    dbPassword: '',
    rootUser: 'root',
    rootPassword: '',
    openaiKey: '',
    weatherKey: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: ''
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/setup/status');
      const data = await res.json();
      if (data.isSetup) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    }
  };

  const updateData = (field: string, value: string) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const createDatabase = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/setup/create-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbType: setupData.dbType,
          dbHost: setupData.dbHost,
          dbPort: setupData.dbPort,
          dbName: setupData.dbName,
          rootUser: setupData.rootUser,
          rootPassword: setupData.rootPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setSetupData(prev => ({
          ...prev,
          dbUser: setupData.rootUser,
          dbPassword: setupData.rootPassword
        }));
      } else {
        setError(data.message || data.error);
      }
    } catch (error: any) {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/setup/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbType: setupData.dbType,
          dbHost: setupData.dbHost,
          dbPort: setupData.dbPort,
          dbName: setupData.dbName,
          dbUser: setupData.dbUser,
          dbPassword: setupData.dbPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.message || data.error);
      }
    } catch (error: any) {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const testOpenAI = async () => {
    if (!setupData.openaiKey) {
      setError('يرجى إدخال مفتاح OpenAI API');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/setup/test-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: setupData.openaiKey })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // SQLite لا يحتاج validation
      if (setupData.dbType === 'mysql' || setupData.dbType === 'mongodb') {
        if (!setupData.dbHost || !setupData.dbName) {
          setError('يرجى ملء جميع حقول قاعدة البيانات المطلوبة');
          return;
        }
        if (setupData.dbMode === 'connect' && (!setupData.dbUser || !setupData.dbPassword)) {
          setError('يرجى إدخال اسم المستخدم وكلمة المرور');
          return;
        }
      }
    } else if (currentStep === 4) {
      if (!setupData.adminUsername || !setupData.adminEmail || !setupData.adminPassword) {
        setError('يرجى ملء جميع حقول المستخدم الإداري');
        return;
      }
      if (setupData.adminPassword !== setupData.adminPasswordConfirm) {
        setError('كلمات المرور غير متطابقة');
        return;
      }
      if (setupData.adminPassword.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }
    }

    setError('');
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setError('');
    setSuccess('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/setup/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('تم حفظ الإعدادات بنجاح!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'فشل حفظ الإعدادات');
      }
    } catch (error) {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🗄️ اختر نوع قاعدة البيانات
            </h2>

            {/* اختيار نوع قاعدة البيانات */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                اختر نوع قاعدة البيانات:
              </label>
              <div className="grid grid-cols-3 gap-4">
                {/* SQLite */}
                <button
                  onClick={() => updateData('dbType', 'sqlite')}
                  className={`p-4 border-2 rounded-lg text-center transition ${
                    setupData.dbType === 'sqlite'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-3xl mb-2">📁</div>
                  <div className="font-bold">SQLite</div>
                  <div className="text-xs text-gray-600 mt-1">
                    مجرد ملف محلي
                  </div>
                  <div className="text-xs text-green-600 mt-1 font-bold">
                    ⚡ الأسهل!
                  </div>
                </button>

                {/* MySQL */}
                <button
                  onClick={() => updateData('dbType', 'mysql')}
                  className={`p-4 border-2 rounded-lg text-center transition ${
                    setupData.dbType === 'mysql'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="text-3xl mb-2">🗄️</div>
                  <div className="font-bold">MySQL</div>
                  <div className="text-xs text-gray-600 mt-1">
                    قاعدة تقليدية
                  </div>
                </button>

                {/* MongoDB */}
                <button
                  onClick={() => updateData('dbType', 'mongodb')}
                  className={`p-4 border-2 rounded-lg text-center transition ${
                    setupData.dbType === 'mongodb'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400'
                  }`}
                >
                  <div className="text-3xl mb-2">🍃</div>
                  <div className="font-bold">MongoDB</div>
                  <div className="text-xs text-gray-600 mt-1">
                    NoSQL
                  </div>
                </button>
              </div>
            </div>

            {/* SQLite - لا يحتاج إعدادات! */}
            {setupData.dbType === 'sqlite' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    جاهز للاستخدام!
                  </h3>
                  <p className="text-gray-700 mb-4">
                    SQLite لا يحتاج أي إعدادات - مجرد ملف محلي بسيط
                  </p>
                  <div className="bg-white rounded p-3 text-sm text-gray-600">
                    <div className="font-bold mb-1">📁 سيتم إنشاء الملف:</div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      backend/database.sqlite
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* MySQL - يحتاج إعدادات */}
            {setupData.dbType === 'mysql' && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    طريقة الإعداد:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateData('dbMode', 'create')}
                      className={`p-4 border-2 rounded-lg text-center transition ${
                        setupData.dbMode === 'create'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">🆕</div>
                      <div className="font-bold">إنشاء قاعدة جديدة</div>
                    </button>

                    <button
                      onClick={() => updateData('dbMode', 'connect')}
                      className={`p-4 border-2 rounded-lg text-center transition ${
                        setupData.dbMode === 'connect'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">🔗</div>
                      <div className="font-bold">الاتصال بقاعدة موجودة</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الخادم (Host) *
                  </label>
                  <input
                    type="text"
                    value={setupData.dbHost}
                    onChange={(e) => updateData('dbHost', e.target.value)}
                    placeholder="localhost"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المنفذ (Port)
                    </label>
                    <input
                      type="text"
                      value={setupData.dbPort}
                      onChange={(e) => updateData('dbPort', e.target.value)}
                      placeholder="3306"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم قاعدة البيانات *
                    </label>
                    <input
                      type="text"
                      value={setupData.dbName}
                      onChange={(e) => updateData('dbName', e.target.value)}
                      placeholder="child_growth_system"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {setupData.dbMode === 'create' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        مستخدم Root *
                      </label>
                      <input
                        type="text"
                        value={setupData.rootUser}
                        onChange={(e) => updateData('rootUser', e.target.value)}
                        placeholder="root"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        كلمة مرور Root *
                      </label>
                      <input
                        type="password"
                        value={setupData.rootPassword}
                        onChange={(e) => updateData('rootPassword', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={createDatabase}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {loading ? '⏳ جاري الإنشاء...' : '🆕 إنشاء قاعدة البيانات'}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم المستخدم *
                      </label>
                      <input
                        type="text"
                        value={setupData.dbUser}
                        onChange={(e) => updateData('dbUser', e.target.value)}
                        placeholder="root"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        كلمة المرور *
                      </label>
                      <input
                        type="password"
                        value={setupData.dbPassword}
                        onChange={(e) => updateData('dbPassword', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={testDatabaseConnection}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {loading ? '⏳ جاري الاختبار...' : '🔍 اختبار الاتصال'}
                    </button>
                  </>
                )}
              </>
            )}

            {/* MongoDB */}
            {setupData.dbType === 'mongodb' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                <div className="text-5xl mb-4">🍃</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  MongoDB
                </h3>
                <p className="text-gray-700">
                  الدعم قريباً... استخدم SQLite أو MySQL حالياً
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🔑 مفاتيح API
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key <span className="text-gray-500">(اختياري)</span>
              </label>
              <input
                type="text"
                value={setupData.openaiKey}
                onChange={(e) => updateData('openaiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {setupData.openaiKey && (
              <button
                onClick={testOpenAI}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? '⏳ جاري الاختبار...' : '🔍 اختبار OpenAI'}
              </button>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather API Key <span className="text-gray-500">(اختياري)</span>
              </label>
              <input
                type="text"
                value={setupData.weatherKey}
                onChange={(e) => updateData('weatherKey', e.target.value)}
                placeholder="..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>ملاحظة:</strong> مفاتيح API اختيارية. يمكنك إضافتها لاحقاً.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📧 إعدادات البريد الإلكتروني
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={setupData.smtpHost}
                  onChange={(e) => updateData('smtpHost', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={setupData.smtpPort}
                  onChange={(e) => updateData('smtpPort', e.target.value)}
                  placeholder="587"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني <span className="text-gray-500">(اختياري)</span>
              </label>
              <input
                type="email"
                value={setupData.smtpUser}
                onChange={(e) => updateData('smtpUser', e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور <span className="text-gray-500">(اختياري)</span>
              </label>
              <input
                type="password"
                value={setupData.smtpPass}
                onChange={(e) => updateData('smtpPass', e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>ملاحظة:</strong> إعدادات البريد اختيارية.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              👤 إنشاء المستخدم الإداري
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم *
              </label>
              <input
                type="text"
                value={setupData.adminUsername}
                onChange={(e) => updateData('adminUsername', e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                value={setupData.adminEmail}
                onChange={(e) => updateData('adminEmail', e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور *
              </label>
              <input
                type="password"
                value={setupData.adminPassword}
                onChange={(e) => updateData('adminPassword', e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور *
              </label>
              <input
                type="password"
                value={setupData.adminPasswordConfirm}
                onChange={(e) => updateData('adminPasswordConfirm', e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>هام:</strong> احفظ بيانات الدخول في مكان آمن!
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💬 ربط WhatsApp
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full">
                  <span className="text-3xl">✓</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                تم الإعداد بنجاح!
              </h3>
              <p className="text-gray-600 mb-4">
                يمكنك الآن ربط حساب WhatsApp من لوحة التحكم
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>الخطوة التالية:</strong><br />
                1. انقر على "إنهاء الإعداد"<br />
                2. سجل الدخول<br />
                3. اذهب إلى "إعدادات WhatsApp"
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌟 مرحباً في رفيق النمو
          </h1>
          <p className="text-gray-600">
            دعنا نقوم بإعداد النظام في بضع خطوات بسيطة
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <div className="mt-2 text-xs text-center">
                    <div className="font-medium text-gray-900">{step.title}</div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                    style={{ transform: 'translateX(50%)' }}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              ✅ {success}
            </div>
          )}

          <div className="mb-6">
            {renderStep()}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              ← السابق
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                التالي →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? '⏳ جاري الحفظ...' : '✓ إنهاء الإعداد'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-gray-600 text-sm">
          <p>هل تحتاج مساعدة؟ تواصل معنا على support@rafeeq.app</p>
        </div>
      </div>
    </div>
  );
}
