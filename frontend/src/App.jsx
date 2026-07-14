import { useEffect, useState } from 'react'
import Upload from './components/Upload.jsx'
import Ranking from './components/Ranking.jsx'

export default function App() {
  const [lang, setLang] = useState('ar')
  const [page, setPage] = useState('upload')
  const [uploadResult, setUploadResult] = useState(null)

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  function handleUploadSuccess(result) {
    setUploadResult(result)
    setPage('dashboard')
    setActiveTab('ranking')
  }

  const isAr = lang === 'ar'

  return (
    <div className={`min-h-screen ${isAr ? 'font-arabic' : 'font-sans'}`} style={{ backgroundColor: '#e8e8e8' }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">

          {isAr ? (
            <>
              {/* AR: logo RIGHT (first in RTL), button LEFT (last in RTL) */}
              <div className="flex items-center gap-3">
                <img src="/sadeed-logo.jpeg" alt="Sadeed"
                  className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div>
                  <h1 className="text-gray-900 font-black text-xl leading-tight">سديد</h1>
                  <p className="text-gray-500 text-xs">فرز ذكي للسير الذاتية</p>
                </div>
              </div>

              <button
                onClick={() => setLang('en')}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 text-sm hover:bg-gray-50 transition"
              >
                <GlobeIcon />
                <span>English</span>
              </button>
            </>
          ) : (
            <>
              {/* EN: logo LEFT (first in LTR), button RIGHT (last in LTR) */}
              <div className="flex items-center gap-3">
                <img src="/sadeed-logo.jpeg" alt="Sadeed"
                  className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div>
                  <h1 className="text-gray-900 font-black text-xl leading-tight">Sadeed</h1>
                  <p className="text-gray-500 text-xs">AI-Powered Smart CV Screening</p>
                </div>
              </div>

              <button
                onClick={() => setLang('ar')}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 text-sm hover:bg-gray-50 transition"
              >
                <GlobeIcon />
                <span>العربية</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {page === 'upload' ? (
          <Upload lang={lang} onSuccess={handleUploadSuccess} />
        ) : (
          <Dashboard
            lang={lang}
            uploadResult={uploadResult}
            onBack={() => setPage('upload')}
          />
        )}
      </main>
    </div>
  )
}

function Dashboard({ lang, uploadResult, onBack }) {
  return (
    <div className="animate-fade-in">
      <Ranking lang={lang} uploadResult={uploadResult} onBack={onBack} />
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
