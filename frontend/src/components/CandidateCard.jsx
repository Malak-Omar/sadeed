import { useState } from 'react'
import { t } from '../i18n.js'

const RANK_COLORS = [
  'from-yellow-400 to-amber-300',
  'from-slate-400 to-slate-300',
  'from-amber-600 to-amber-500',
]
const RANK_EMOJIS = ['🥇', '🥈', '🥉']

export default function CandidateCard({ lang, candidate, rank }) {
  const [revealState, setRevealState] = useState('idle')
  const [identity, setIdentity] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { candidate_id, score, strengths = [], gaps = [] } = candidate
  const rankIdx = rank - 1
  const isTop3 = rank <= 3

  async function handleReveal() {
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

  return (
    <>
      <div className="card animate-slide-up hover:shadow-md transition-shadow">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            {/* Rank badge */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0
              ${isTop3
                ? `bg-gradient-to-br ${RANK_COLORS[rankIdx]} text-white shadow-md`
                : 'bg-gray-100 border border-gray-200 text-gray-600'
              }`}
            >
              {isTop3 ? RANK_EMOJIS[rankIdx] : `#${rank}`}
            </div>

            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                {t(lang, 'candidate')} {candidate_id}
              </p>
              <p className="text-gray-900 font-semibold text-lg">
                {t(lang, 'rank')} #{rank}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="text-end">
            <p className="text-gray-500 text-xs">{t(lang, 'matchScore')}</p>
            <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="mb-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              {t(lang, 'strengths')}
            </p>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, i) => (
                <span key={i} className="pill-green">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="mb-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              {t(lang, 'gaps')}
            </p>
            <div className="flex flex-wrap gap-2">
              {gaps.map((g, i) => (
                <span key={i} className="pill-amber">{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-gray-400 text-xs">{t(lang, 'biasNotice')}</p>
          <button
            onClick={revealState === 'done' ? () => setShowModal(true) : handleReveal}
            disabled={revealState === 'loading'}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200
              ${revealState === 'done'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                : revealState === 'error'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
          >
            {revealState === 'loading' && t(lang, 'revealLoading')}
            {revealState === 'done'    && t(lang, 'revealedBtn')}
            {revealState === 'error'   && t(lang, 'revealError')}
            {revealState === 'idle'    && t(lang, 'revealBtn')}
          </button>
        </div>
      </div>

      {/* Identity Modal */}
      {showModal && identity && (
        <IdentityModal lang={lang} identity={identity} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

function IdentityModal({ lang, identity, onClose }) {
  const rows = [
    { label: t(lang, 'name'),     value: identity.name     },
    { label: t(lang, 'email'),    value: identity.email    },
    { label: t(lang, 'phone'),    value: identity.phone    },
    { label: t(lang, 'location'), value: identity.location },
    { label: t(lang, 'file'),     value: identity.filename },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              🔓
            </div>
            <div>
              <h3 className="text-gray-900 font-bold">{t(lang, 'revealModalTitle')}</h3>
              <p className="text-gray-500 text-sm">Candidate {identity.candidate_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-gray-500 text-sm w-20 shrink-0">{label}</span>
              <span className="text-gray-900 text-sm font-medium break-all">{value || '—'}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-secondary w-full mt-5 text-center">
          {t(lang, 'close')}
        </button>
      </div>
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-500'
}

function getScoreBarColor(score) {
  if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
  if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-amber-400'
  return 'bg-gradient-to-r from-red-500 to-red-400'
}
