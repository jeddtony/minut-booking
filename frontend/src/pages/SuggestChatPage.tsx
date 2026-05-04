import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Loader2, MessageSquareText } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import MobileBottomNav from '../components/MobileBottomNav'
import ChatMarkdown from '../components/ChatMarkdown'
import { api, SuggestionChatTranscriptMessage } from '../api'

const STARTER_PROMPTS = [
  'Beach house for a family of four, budget around $200/night',
  'Quiet studio downtown for remote work for two weeks',
  'Pet-friendly place with a yard near hiking trails',
]

export default function SuggestChatPage() {
  const [messages, setMessages] = useState<SuggestionChatTranscriptMessage[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setError(null)
    try {
      const { messages: rows } = await api.rentalUnits.suggestHistory()
      setMessages(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load conversation history.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending, historyLoading, scrollToBottom])

  async function handleSend(text?: string) {
    const raw = (text ?? input).trim()
    if (raw.length < 3) {
      setError('Please enter at least 3 characters.')
      return
    }
    setError(null)
    setInput('')
    setSending(true)

    try {
      await api.rentalUnits.suggest({ description: raw })
      const { messages: rows } = await api.rentalUnits.suggestHistory()
      setMessages(rows)
    } catch (e) {
      setInput(raw)
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sending || historyLoading) return
    void handleSend()
  }

  const showEmptyIntro = !historyLoading && messages.length === 0 && !sending

  return (
    <div className="min-h-screen bg-surface font-sans animate-page-enter">
      <Sidebar />
      <MobileHeader />

      <main className="md:ml-[260px] pt-20 md:pt-0 min-h-screen pb-28 md:pb-8 px-4 md:px-0 flex flex-col">
        <div className="max-w-[720px] mx-auto md:px-6 pt-2 md:pt-12 flex-1 flex flex-col w-full min-h-0">
          <header className="mb-4 md:mb-8 shrink-0">
            <div className="hidden md:flex items-center gap-2 mb-1">
              <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Concierge</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="hidden sm:flex w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center shrink-0">
                <Sparkles className="text-primary" size={22} />
              </div>
              <div>
                <h1 className="text-2xl md:text-[32px] font-bold leading-tight tracking-tight text-on-surface">Find a stay</h1>
                <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                  Describe what you need — replies are saved as markdown so lists, emphasis, and follow-ups stay readable.
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-on-error-container text-sm font-medium shrink-0"
            >
              {error}
            </div>
          )}

          <div
            className="flex-1 min-h-[240px] max-h-[min(520px,calc(100vh-320px))] md:max-h-[min(560px,calc(100vh-280px))] overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest/80 shadow-card mb-4 px-3 py-4 md:px-5 md:py-5 space-y-4"
            aria-label="Conversation"
          >
            {historyLoading && (
              <div className="flex justify-center items-center gap-2 text-on-surface-variant text-sm py-12">
                <Loader2 className="animate-spin text-primary" size={20} />
                Loading conversation…
              </div>
            )}

            {showEmptyIntro && (
              <div className="text-center py-6 md:py-10 px-2">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-fixed-dim/40 flex items-center justify-center border border-outline-variant">
                  <MessageSquareText className="text-on-primary-fixed-variant" size={26} />
                </div>
                <p className="text-on-surface font-semibold text-body-lg mb-1">What kind of stay are you looking for?</p>
                <p className="text-on-surface-variant text-sm mb-6 max-w-md mx-auto">
                  Each message is stored on the server; assistant replies use markdown (headings, rules, emphasis).
                </p>
                <div className="flex flex-col gap-2 max-w-md mx-auto text-left">
                  {STARTER_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={sending}
                      onClick={() => void handleSend(prompt)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-outline-variant bg-white hover:border-primary/40 hover:bg-teal-50/30 text-on-surface transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!historyLoading &&
              messages.map(msg => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[90%] rounded-2xl rounded-br-md bg-primary text-on-primary px-4 py-2.5 shadow-sm">
                        <ChatMarkdown content={msg.content} tone="user" />
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-white border border-outline-variant px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                        <Sparkles size={12} className="text-primary shrink-0" />
                        StayDesk
                      </div>
                      <ChatMarkdown content={msg.content} tone="assistant" />
                    </div>
                  </div>
                )
              })}

            {sending && (
              <div className="flex justify-start items-center gap-2 text-on-surface-variant text-sm py-2">
                <Loader2 className="animate-spin text-primary" size={18} />
                Finding suggestions…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="shrink-0">
            <label htmlFor="suggest-input" className="sr-only">
              Your message
            </label>
            <div className="flex gap-2 items-end bg-white border border-outline-variant rounded-xl p-2 shadow-card focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/40 transition-shadow duration-200">
              <textarea
                id="suggest-input"
                ref={textareaRef}
                rows={2}
                maxLength={2000}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!sending && !historyLoading) void handleSend()
                  }
                }}
                placeholder="e.g. Something quieter than last time, still near the water…"
                disabled={sending || historyLoading}
                className="flex-1 resize-none bg-transparent px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none min-h-[44px] max-h-32 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || historyLoading || input.trim().length < 3}
                className="shrink-0 mb-1 mr-1 w-11 h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Send"
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2 px-1">
              Enter to send · Shift+Enter for a new line · Up to 2000 characters
            </p>
          </form>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}
