import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type ChatMarkdownTone = 'user' | 'assistant'

function markdownComponents(tone: ChatMarkdownTone): Components {
  const u = tone === 'user'
  const text = u ? 'text-on-primary' : 'text-on-surface'
  const muted = u ? 'text-on-primary opacity-90' : 'text-on-surface-variant'
  const codeBg = u ? 'bg-black/20' : 'bg-surface-container'
  const border = u ? 'border-white/25' : 'border-outline-variant'
  const link = u ? 'text-primary-fixed underline font-medium' : 'text-primary underline font-medium'

  return {
    h1: ({ children }) => <h1 className={`text-lg font-bold mt-2 first:mt-0 mb-2 ${text}`}>{children}</h1>,
    h2: ({ children }) => <h2 className={`text-base font-bold mt-3 first:mt-0 mb-2 ${text}`}>{children}</h2>,
    h3: ({ children }) => <h3 className={`text-[15px] font-bold mt-3 first:mt-0 mb-1.5 ${text}`}>{children}</h3>,
    p: ({ children }) => <p className={`mb-2 last:mb-0 text-body-md leading-relaxed ${text}`}>{children}</p>,
    hr: () => <hr className={`my-3 ${u ? 'border-white/20' : 'border-outline-variant'}`} />,
    strong: ({ children }) => <strong className={`font-semibold ${text}`}>{children}</strong>,
    em: ({ children }) => <em className={`italic ${muted}`}>{children}</em>,
    ul: ({ children }) => <ul className={`list-disc pl-4 mb-2 space-y-1 text-body-md ${text}`}>{children}</ul>,
    ol: ({ children }) => <ol className={`list-decimal pl-4 mb-2 space-y-1 text-body-md ${text}`}>{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
      <a href={href} className={link} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    code: ({ children, className }) =>
      className ? (
        <code className={`block w-full text-xs font-mono whitespace-pre ${text}`}>{children}</code>
      ) : (
        <code className={`text-xs ${codeBg} px-1.5 py-0.5 rounded ${text}`}>{children}</code>
      ),
    pre: ({ children }) => (
      <pre className={`my-2 overflow-x-auto rounded-lg ${codeBg} p-3 text-xs border ${border}`}>{children}</pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-2 rounded-lg border border-outline-variant">
        <table className={`min-w-full text-xs ${text}`}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className={u ? 'bg-black/15' : 'bg-surface-container'}>{children}</thead>,
    th: ({ children }) => (
      <th className={`border ${border} px-2 py-1.5 text-left font-semibold`}>{children}</th>
    ),
    td: ({ children }) => <td className={`border ${border} px-2 py-1.5`}>{children}</td>,
    tr: ({ children }) => <tr>{children}</tr>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    blockquote: ({ children }) => (
      <blockquote className={`border-l-4 pl-3 my-2 italic ${u ? 'border-white/40 text-on-primary/90' : 'border-primary/40 text-on-surface-variant'}`}>
        {children}
      </blockquote>
    ),
  }
}

type ChatMarkdownProps = {
  content: string
  tone: ChatMarkdownTone
  className?: string
}

export default function ChatMarkdown({ content, tone, className = '' }: ChatMarkdownProps) {
  return (
    <div className={`chat-markdown min-w-0 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(tone)}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
