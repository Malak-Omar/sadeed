import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { t } from '../i18n.js'

export default function Chat({ lang }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(question) {
    if (!question.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer, sources: data.sources }])
    } catch {
      setMessages(prev => [...prev, { role: 'error', text: t(lang, 'chatError') }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = t(lang, 'suggestions') || []

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 ? (
          <Welcome lang={lang} onSuggest={sendMessage} suggestions={suggestions} />
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} msg={msg} lang={lang} />)
        )}
        {loading && <ThinkingBubble lang={lang} />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips while chatting */}
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="text-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition disabled:opacity-40 shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-3">
        <input
          className="input-field flex-1"
          placeholder={t(lang, 'chatPlaceholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-5 shrink-0"
        >
          {loading ? <Spinner /> : t(lang, 'send')}
        </button>
      </form>
    </div>
  )
}

function Welcome({ lang, onSuggest, suggestions }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-3xl mb-5">
        💬
      </div>
      <h3 className="text-gray-900 font-bold text-xl mb-2">{t(lang, 'chatWelcome')}</h3>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">{t(lang, 'chatSub')}</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggest(s)}
            className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-700 text-sm px-4 py-2 rounded-xl transition shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ msg, lang }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div dir="auto" className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm text-start">
          {msg.text}
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
          {msg.text}
        </div>
      </div>
    )
  }

  // assistant — render markdown
  return (
    <div className="flex justify-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-sm shrink-0 mt-1">
        🤖
      </div>
      <div className="max-w-[90%] w-full">
        <div dir="auto" className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm prose prose-sm prose-gray max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              /* Tables */
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
              th: ({ children }) => (
                <th className="px-3 py-2 text-start font-semibold text-gray-700 border border-gray-200">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 text-gray-700 border border-gray-200">{children}</td>
              ),
              tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,

              /* Code blocks */
              code: ({ inline, className, children }) => {
                if (inline) {
                  return <code className="bg-gray-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                }
                const lang = className?.replace('language-', '') || ''
                return (
                  <div className="my-3 rounded-xl overflow-hidden border border-gray-200">
                    {lang && (
                      <div className="bg-gray-100 px-4 py-1.5 text-xs text-gray-500 font-mono border-b border-gray-200 flex items-center justify-between">
                        <span>{lang}</span>
                        <span className="text-gray-400">●●●</span>
                      </div>
                    )}
                    <pre className="bg-gray-50 px-4 py-3 overflow-x-auto text-xs font-mono text-gray-800 leading-relaxed">
                      <code>{children}</code>
                    </pre>
                  </div>
                )
              },
              pre: ({ children }) => <>{children}</>,

              /* Headings */
              h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2 pb-2 border-b border-gray-100">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mt-4 mb-2 pb-1 border-b border-gray-100">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold text-gray-800 mt-3 mb-1">{children}</h3>,

              /* Lists */
              ul: ({ children }) => <ul className="my-2 space-y-1 list-none ps-0">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal ps-4">{children}</ol>,
              li: ({ children }) => (
                <li className="flex gap-2 text-gray-700 text-sm">
                  <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                  <span>{children}</span>
                </li>
              ),

              /* Paragraph */
              p: ({ children }) => <p className="text-gray-700 text-sm leading-relaxed my-1.5">{children}</p>,

              /* Blockquote */
              blockquote: ({ children }) => (
                <blockquote className="border-s-4 border-blue-200 bg-blue-50 px-4 py-2 my-3 rounded-e-xl text-gray-600 text-sm italic">
                  {children}
                </blockquote>
              ),

              /* Strong / em */
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-600">{children}</em>,

              /* Horizontal rule */
              hr: () => <hr className="my-4 border-gray-100" />,
            }}
          >
            {msg.text}
          </ReactMarkdown>
        </div>
        {msg.sources != null && (
          <p className="text-gray-400 text-xs mt-1 ps-1">
            {msg.sources} {t(lang, 'sourcesLabel')}
          </p>
        )}
      </div>
    </div>
  )
}

function ThinkingBubble({ lang }) {
  return (
    <div className="flex justify-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-sm shrink-0">
        🤖
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </span>
          {t(lang, 'thinking')}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
