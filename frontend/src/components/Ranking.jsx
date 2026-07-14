import { useEffect, useState } from 'react'
import Chat from './Chat.jsx'

/* ── Helpers ── */
function scoreLabel(score, isAr) {
  if (score >= 85) return isAr ? 'توافق ممتاز' : 'Excellent Match'
  if (score >= 70) return isAr ? 'توافق جيد جداً' : 'Very Good Match'
  if (score >= 55) return isAr ? 'توافق جيد' : 'Good Match'
  if (score >= 40) return isAr ? 'توافق مقبول' : 'Acceptable Match'
  return isAr ? 'توافق ضعيف' : 'Weak Match'
}
function scoreColor(score) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 55) return 'text-amber-600'
  return 'text-red-500'
}
function scoreBarColor(score) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-red-500'
}
function medalBadge(rank) {
  if (rank === 1) return { emoji: '🥇', bg: 'bg-amber-100' }
  if (rank === 2) return { emoji: '🥈', bg: 'bg-slate-100' }
  if (rank === 3) return { emoji: '🥉', bg: 'bg-orange-100' }
  return { emoji: null, bg: 'bg-gray-100' }
}

/* ── Main component ── */
export default function Ranking({ lang, uploadResult, onBack }) {
  const [loadState, setLoadState] = useState('loading')
  const [ranking, setRanking] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('ranking')
  const isAr = lang === 'ar'

  useEffect(() => { fetchRanking() }, [])

  async function fetchRanking() {
    setLoadState('loading')
    try {
      const res = await fetch('/ranking')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRanking(data.ranking ?? [])
      setLoadState('done')
    } catch {
      setLoadState('error')
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
        <p className="text-gray-500 animate-pulse text-sm">
          {isAr ? 'جاري تقييم المرشحين…' : 'Evaluating candidates…'}
        </p>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{isAr ? 'فشل تحميل الترتيب.' : 'Failed to load rankings.'}</p>
        <button onClick={fetchRanking}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    )
  }

  const topScore = ranking[0]?.score ?? 0
  const selected = ranking[selectedIdx]

  return (
    <div className="space-y-4 pb-6">

      {/* ── Success Banner ── */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">✅</div>
        <div className="flex-1">
          <p className="text-gray-900 font-bold text-sm">
            {isAr ? 'تم تقييم جميع المرشحين بنجاح' : 'All Candidates Evaluated Successfully'}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {isAr
              ? 'تمت إزالة البيانات الشخصية تلقائياً قبل التحليل لضمان تقييم يعتمد على المهارات والخبرات فقط.'
              : 'Personal data was automatically removed before analysis to ensure skills-based evaluation only.'}
          </p>
        </div>
        <span className="text-5xl opacity-10 shrink-0">📄</span>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: '👥', bg: 'bg-indigo-50',
            label: isAr ? 'عدد المرشحين' : 'Candidates',
            val: ranking.length,
            sub: isAr ? 'تم تحليلهم بنجاح' : 'Successfully analyzed',
          },
          {
            icon: '📈', bg: 'bg-emerald-50',
            label: isAr ? 'أعلى نسبة تطابق' : 'Top Match',
            val: `${topScore}%`,
            sub: null,
          },
          {
            icon: '🔒', bg: 'bg-slate-50',
            label: isAr ? 'البيانات المحجوبة' : 'Hidden Fields',
            val: isAr ? '4 حقول' : '4 fields',
            sub: isAr ? 'تم إخفاءها قبل التحليل' : 'Removed before analysis',
          },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2 text-base`}>
              {s.icon}
            </div>
            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
            <p className="text-xl font-black text-gray-900">{s.val}</p>
            {s.sub && <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Section Header + Tabs ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarIcon />
            <h2 className="text-gray-900 font-bold text-lg">
              {isAr ? 'نتائج التقييم' : 'Evaluation Results'}
            </h2>
          </div>
          <p className="text-gray-400 text-sm">
            {isAr ? 'ترتيب المرشحين حسب درجة التوافق مع الوظيفة' : 'Candidates ranked by job match score'}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            ['ranking', isAr ? 'الترتيب التلقائي' : 'Auto Ranking'],
            ['chat',    isAr ? 'المحادثة الذكية' : 'Smart Chat'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content — Chat stays mounted to preserve messages ── */}
      <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
        <Chat lang={lang} />
      </div>

      <div className={activeTab !== 'chat' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-[280px_1fr] gap-4">

          {/* Sidebar list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-gray-900 font-semibold text-sm mb-3">
              {isAr ? 'ترتيب المرشحين' : 'Candidate Ranking'}
            </p>
            <div className="space-y-1.5">
              {ranking.map((c, i) => {
                const badge = medalBadge(i + 1)
                return (
                  <button key={c.candidate_id} onClick={() => setSelectedIdx(i)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-start
                      ${selectedIdx === i
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-gray-50 border border-transparent'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg ${badge.bg} flex items-center justify-center text-sm font-bold shrink-0`}>
                        {badge.emoji ?? <span className="text-gray-500 text-xs font-bold">{i + 1}</span>}
                      </span>
                      <div>
                        <p className="text-gray-900 text-sm font-semibold">
                          {isAr ? `مرشح ${c.candidate_id}` : `Candidate ${c.candidate_id}`}
                        </p>
                        <p className="text-gray-400 text-xs">{scoreLabel(c.score, isAr)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${scoreColor(c.score)}`}>{c.score}%</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detail card */}
          {selected && (
            <CandidateDetail
              key={selected.candidate_id}
              candidate={selected}
              rank={selectedIdx + 1}
              isAr={isAr}
            />
          )}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6 justify-between">
        <div className="flex items-center gap-5">
          <div className="w-20 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl shrink-0">📊</div>
          <div>
            <h3 className="text-gray-900 font-bold text-base mb-1">
              {isAr ? 'جاهز لتقييم مجموعة جديدة؟' : 'Ready to Evaluate a New Group?'}
            </h3>
            <p className="text-gray-500 text-sm">
              {isAr
                ? 'ابدأ تقييماً جديداً برفع السير الذاتية وإضافة الوصف الوظيفي.'
                : 'Start fresh with new CVs and a job description.'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {isAr
                ? 'وسيتم ترتيب المرشحين تلقائياً حسب مدى توافقهم مع الوظيفة.'
                : 'Candidates will be automatically ranked by job fit.'}
            </p>
          </div>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl transition shrink-0 text-sm">
          <RefreshIcon />
          {isAr ? 'بدء تقييم جديد' : 'Start New Evaluation'}
        </button>
      </div>

      <p className="text-gray-400 text-xs text-center pb-2">
        {isAr
          ? '⚖️ جميع النتائج تعتمد على تحليل البيانات المتاحة في السير الذاتية فقط.'
          : '⚖️ All results are based solely on data available in the CVs.'}
      </p>
    </div>
  )
}

/* ── Candidate Detail Card ── */
function CandidateDetail({ candidate, rank, isAr }) {
  const [revealState, setRevealState] = useState('idle')
  const [identity, setIdentity] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const { candidate_id, score, strengths = [], gaps = [], summary } = candidate
  const badge = medalBadge(rank)

  async function handleReveal() {
    if (revealState === 'done') { setShowModal(true); return }
    setRevealState('loading')
    try {
      const res = await fetch(`/reveal/${candidate_id}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIdentity(data)
      setRevealState('done')
      setShowModal(true)
    } catch {
      setRevealState('error')
    }
  }

  const summaryText = summary
    || (gaps.length > 0
      ? (isAr ? `نقاط ضعف محتملة: ${gaps.join('، ')}.` : `Potential gaps: ${gaps.join(', ')}.`)
      : (isAr ? 'لا توجد ثغرات واضحة في مؤهلات هذا المرشح.' : 'No significant gaps identified.'))

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${badge.bg} flex items-center justify-center text-2xl shrink-0`}>
              {badge.emoji ?? <span className="text-gray-600 text-sm font-bold">#{rank}</span>}
            </div>
            <div>
              <p className="text-gray-400 text-xs">{isAr ? `المرتبة #${rank}` : `Rank #${rank}`}</p>
              <p className="text-gray-900 font-black text-xl">
                {isAr ? `مرشح ${candidate_id}` : `Candidate ${candidate_id}`}
              </p>
            </div>
          </div>
          <div className="text-end">
            <p className={`text-4xl font-black ${scoreColor(score)}`}>{score}%</p>
            <p className="text-gray-400 text-xs mt-0.5">{scoreLabel(score, isAr)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${scoreBarColor(score)}`}
            style={{ width: `${score}%`, transition: 'width 1s ease' }}
          />
        </div>

        {/* Strength tags */}
        {strengths.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs font-semibold mb-2">
              {isAr ? 'نقاط القوة' : 'Strengths'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((s, i) => (
                <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="text-emerald-500">✓</span> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Two-col: reasons + summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🎯</span>
              <p className="text-gray-700 font-semibold text-xs">{isAr ? 'سبب الترشيح' : 'Why Recommended'}</p>
            </div>
            <ul className="space-y-1.5">
              {strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-gray-600 text-xs">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">💡</span>
              <p className="text-gray-700 font-semibold text-xs">{isAr ? 'ملخص سريع' : 'Quick Summary'}</p>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">{summaryText}</p>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleReveal}
            disabled={revealState === 'loading'}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition disabled:opacity-50">
            🔒 {isAr
              ? (revealState === 'done' ? 'عرض الهوية' : revealState === 'loading' ? 'جاري…' : 'عرض البيانات الأصلية')
              : (revealState === 'done' ? 'View Identity' : revealState === 'loading' ? 'Loading…' : 'Reveal Identity')}
          </button>
        </div>
      </div>

      {showModal && identity && (
        <IdentityModal isAr={isAr} identity={identity} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

/* ── Identity Modal ── */
function IdentityModal({ isAr, identity, onClose }) {
  const rows = [
    { label: isAr ? 'الاسم' : 'Name',               value: identity.name },
    { label: isAr ? 'البريد الإلكتروني' : 'Email',  value: identity.email },
    { label: isAr ? 'الهاتف' : 'Phone',              value: identity.phone },
    { label: isAr ? 'الموقع' : 'Location',           value: identity.location },
    { label: isAr ? 'الملف' : 'File',                value: identity.filename },
  ]
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">🔓</div>
            <div>
              <h3 className="text-gray-900 font-bold text-sm">{isAr ? 'هوية المرشح' : 'Candidate Identity'}</h3>
              <p className="text-gray-500 text-xs">{isAr ? `مرشح ${identity.candidate_id}` : `Candidate ${identity.candidate_id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-gray-500 text-xs w-24 shrink-0">{label}</span>
              <span className="text-gray-900 text-xs font-medium break-all">{value || '—'}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
          {isAr ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  )
}

/* ── Icons ── */
function BarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.45" />
    </svg>
  )
}
