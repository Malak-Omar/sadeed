import { useCallback, useRef, useState } from 'react'
import { t } from '../i18n.js'

const FEATURES = {
  ar: [
    {
      icon: <RankIcon />,
      color: 'bg-orange-50 text-orange-500',
      title: 'ترتيب حسب التطابق',
      desc: 'يحصل كل مرشح على درجة توافق مع الوظيفة.',
    },
    {
      icon: <BoltIcon />,
      color: 'bg-indigo-50 text-indigo-500',
      title: 'فرز خلال ثوانٍ',
      desc: 'تحليل سريع لعشرات السير الذاتية بدقة.',
    },
    {
      icon: <ShieldIcon />,
      color: 'bg-emerald-50 text-emerald-600',
      title: 'مقارنة ذكية بين المرشحين',
      desc: 'اعرف من الأنسب... ولماذا.',
    },
  ],
  en: [
    {
      icon: <RankIcon />,
      color: 'bg-orange-50 text-orange-500',
      title: 'Ranked by Match',
      desc: 'Every candidate gets a compatibility score for the role.',
    },
    {
      icon: <BoltIcon />,
      color: 'bg-indigo-50 text-indigo-500',
      title: 'Screened in Seconds',
      desc: 'Fast, accurate analysis of dozens of CVs at once.',
    },
    {
      icon: <ShieldIcon />,
      color: 'bg-emerald-50 text-emerald-600',
      title: 'Smart Candidate Comparison',
      desc: 'Know who fits best — and why.',
    },
  ],
}

export default function Upload({ lang, onSuccess }) {
  const [files, setFiles] = useState([])
  const [jobDesc, setJobDesc] = useState('')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  const isRtl = lang === 'ar'
  const features = FEATURES[lang] ?? FEATURES.ar

  function addFiles(incoming) {
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf')
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...pdfs.filter(f => !names.has(f.name))].slice(0, 10)
    })
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  const onDragOver = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (files.length === 0) { setMessage(t(lang, 'noFilesError')); setStatus('error'); return }
    if (!jobDesc.trim()) { setMessage(t(lang, 'noJDError')); setStatus('error'); return }

    setStatus('loading'); setMessage('')
    const formData = new FormData()
    files.forEach(f => formData.append('cvs', f))
    formData.append('job_description', jobDesc)

    try {
      const res = await fetch('/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const detail = err.detail || err.message || `Server error ${res.status}`
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
      }
      const data = await res.json()
      setStatus('success')
      setMessage(t(lang, 'uploadSuccess'))
      setTimeout(() => onSuccess(data), 800)
    } catch (err) {
      setStatus('error')
      const msg = err.message || t(lang, 'uploadError')
      setMessage(msg.includes('Failed to fetch') || msg.includes('NetworkError')
        ? (isRtl ? '⚠️ تعذر الاتصال بالخادم. تأكد من تشغيل uvicorn على المنفذ 8000.' : '⚠️ Cannot reach backend. Make sure uvicorn is running on port 8000.')
        : msg)
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="animate-slide-up space-y-5">

      {/* ── Hero ── */}
      {/* Logo is first in HTML → appears RIGHT in RTL, LEFT in LTR */}
      <div className="flex items-center gap-8 pt-2 pb-2">
        {/* Logo — first child: RIGHT in RTL, LEFT in LTR */}
        <div className="shrink-0">
          <img
            src="/sadeed-logo.jpeg"
            alt="Sadeed"
            className="w-44 h-44 object-contain rounded-2xl"
          />
        </div>

        {/* Text — second child: LEFT in RTL, RIGHT in LTR */}
        <div className="flex-1">
          <h2 className="text-4xl font-black text-gray-900 mb-3 leading-tight">
            {isRtl
              ? <><span className="text-indigo-600">اعثر على أفضل المرشحين</span> في دقائق</>
              : <>Find the <span className="text-indigo-600">Best Candidates</span> in Minutes</>
            }
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            {isRtl
              ? 'ابدأ في دقائق، ودع النظام يحدد أفضل المرشحين لكل وظيفة.'
              : 'Upload CVs, enter the job description, and let AI rank candidates by how well they match the role.'}
          </p>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mx-auto mb-3`}>
              {f.icon}
            </div>
            <p className="text-gray-900 font-semibold text-sm mb-1">{f.title}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Drop Zone ── */}
        <div
          className={`bg-white rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer
            ${dragging ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20'}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => addFiles(e.target.files)} />

          <div className="flex justify-center mb-4">
            <CloudUploadIcon />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-1">
            {isRtl ? 'أضف السير الذاتية للبدء' : 'Add CVs to Get Started'}
          </p>
          <p className="text-gray-400 text-sm mb-5">
            {isRtl ? 'اسحب الملفات هنا أو اضغط للاختيار' : 'Drag files here or click to choose'}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm shadow-md"
          >
            <FolderIcon />
            {isRtl ? 'اختر الملفات من جهازك' : 'Choose Files from Device'}
          </button>
          <p className="text-gray-400 text-xs mt-4">
            {isRtl ? 'PDF فقط • يمكنك رفع حتى 10 ملفات' : 'PDF only • Up to 10 files'}
          </p>
        </div>

        {/* ── File List ── */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                {files.length}/10 {isRtl ? 'ملفات' : 'files'}
              </span>
              <span className="text-xs text-indigo-600 font-semibold">
                {isRtl ? 'الملفات المحددة' : 'Selected Files'}
              </span>
            </div>
            {files.map((f, i) => (
              <div key={f.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-gray-800 text-sm truncate max-w-[200px]">{f.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
                <button type="button" onClick={() => removeFile(f.name)}
                  className="text-gray-300 hover:text-red-400 transition text-xl leading-none">×</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Job Description ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <DocIcon />
            <span className="text-gray-900 font-semibold text-sm">
              {isRtl ? 'الوصف الوظيفي' : 'Job Description'}
            </span>
          </div>
          <textarea
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
            rows={5}
            maxLength={5000}
            placeholder={isRtl
              ? 'الصق الوصف الوظيفي ليتم تقييم المرشحين بدقة\nأدخل مسؤوليات الوظيفة والمهارات المطلوبة.\nكلما كان الوصف أدق، كانت النتائج أفضل.'
              : 'Paste the job description to accurately evaluate candidates.\nInclude responsibilities and required skills.\nThe more detailed, the better the results.'}
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
          />
          <div className="flex justify-end mt-1">
            <span className="text-gray-400 text-xs">{jobDesc.length} / 5000</span>
          </div>
        </div>

        {/* ── Privacy card ── */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <div className="w-11 h-11 rounded-xl bg-white/50 flex items-center justify-center shrink-0">
            <LockIcon />
          </div>
          <div>
            <p className="text-emerald-900 font-bold text-sm">
              {isRtl ? 'خصوصيتك أولويتنا' : 'Your Privacy is Our Priority'}
            </p>
            <p className="text-emerald-800 text-xs mt-0.5 leading-relaxed">
              {isRtl
                ? 'نحمي البيانات الشخصية تلقائياً قبل التحليل لضمان تقييم عادل يعتمد على المهارات والخبرة فقط.'
                : 'Personal data is automatically protected before analysis to ensure fair evaluation based solely on skills and experience.'}
            </p>
          </div>
        </div>

        {/* ── Status message ── */}
        {message && (
          <div className={`rounded-2xl px-5 py-3 text-sm font-medium animate-fade-in
            ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
            ${status === 'error'   ? 'bg-red-50 text-red-700 border border-red-200'             : ''}
          `}>
            {message}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 text-base shadow-lg shadow-indigo-200"
        >
          {isLoading ? (
            <><Spinner />{isRtl ? 'جاري التحليل…' : 'Analyzing…'}</>
          ) : (
            <>{isRtl ? 'تحليل المرشحين' : 'Analyze Candidates'}</>
          )}
        </button>

      </form>
    </div>
  )
}

/* ── Icons ─────────────────────────────────────────────────── */

function CloudUploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function RankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
