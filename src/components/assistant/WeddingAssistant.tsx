import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { assistantAnswers, matchAssistantIntent, suggestedQuestions, type AssistantAnswer } from '../../data/assistantContent'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { Monogram } from '../Monogram'
import { AssistantLauncher } from './AssistantLauncher'
import { AssistantMessages, type ConversationMessage } from './AssistantMessages'

const greeting = 'Hello! I’m your little wedding guide. Ask about Exedar and Frances, or find details for the celebration.'

function useMobileSheet() {
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 800px)').matches)
  useEffect(() => { const query = matchMedia('(max-width: 800px)'); const update = () => setMobile(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  return mobile
}

export function WeddingAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [rsvpVisible, setRsvpVisible] = useState(false)
  const [messages, setMessages] = useState<ConversationMessage[]>([{ id: 1, role: 'assistant', text: greeting }])
  const launcher = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const messageArea = useRef<HTMLDivElement>(null)
  const responseTimer = useRef<number>(0)
  const nextId = useRef(2)
  const mobile = useMobileSheet()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const rsvp = document.getElementById('rsvp')
    if (!rsvp || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setRsvpVisible(Boolean(entry?.isIntersecting)), { threshold: 0.12 })
    observer.observe(rsvp)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const background = document.querySelector<HTMLElement>('.invitation-shell')
    const backToTop = document.querySelector<HTMLElement>('.back-to-top')
    if (mobile) { background?.setAttribute('inert', ''); backToTop?.setAttribute('inert', '') }
    closeButton.current?.focus()
    const keydown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeAssistant(); return }
      if (!mobile || event.key !== 'Tab' || !panel.current) return
      const focusable = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]; const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    addEventListener('keydown', keydown)
    return () => { removeEventListener('keydown', keydown); background?.removeAttribute('inert'); backToTop?.removeAttribute('inert') }
  }, [open, mobile])

  useEffect(() => { messageArea.current?.scrollTo({ top: messageArea.current.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' }) }, [messages, typing, reducedMotion])
  useEffect(() => () => { if (responseTimer.current) clearTimeout(responseTimer.current) }, [])

  function closeAssistant() {
    setOpen(false)
    requestAnimationFrame(() => launcher.current?.focus())
  }

  function ask(question: string) {
    const cleaned = question.replace(/\s+/g, ' ').trim().slice(0, 160)
    if (!cleaned || typing) return
    const answer = assistantAnswers[matchAssistantIntent(cleaned)]
    setMessages((current) => [...current, { id: nextId.current++, role: 'guest', text: cleaned }])
    setInput(''); setTyping(true)
    responseTimer.current = window.setTimeout(() => {
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: answer.text, action: answer.action }])
      setTyping(false); responseTimer.current = 0
    }, reducedMotion ? 0 : 420)
  }

  function submit(event: FormEvent) { event.preventDefault(); ask(input) }
  function reset() {
    if (responseTimer.current) clearTimeout(responseTimer.current)
    responseTimer.current = 0; setTyping(false); setInput(''); nextId.current = 2
    setMessages([{ id: 1, role: 'assistant', text: greeting }])
  }
  function navigate(action: NonNullable<AssistantAnswer['action']>) {
    closeAssistant()
    requestAnimationFrame(() => document.querySelector(action.target)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }))
  }
  function inputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(input) } }
  const latestResponse = [...messages].reverse().find((message) => message.role === 'assistant')?.text ?? ''

  return <div className={`assistant-root${open ? ' assistant-root--open' : ''}`}>
    {open && mobile && <div className="assistant-scrim" aria-hidden="true" onClick={closeAssistant} />}
    <section ref={panel} id="wedding-assistant" className="assistant-panel" role={mobile ? 'dialog' : 'region'} aria-modal={mobile ? true : undefined} aria-labelledby="assistant-title" hidden={!open}>
      <header className="assistant-header"><Monogram compact /><div><h2 id="assistant-title">Ask About Us</h2><p>A little guide to our love story and wedding day.</p></div><button ref={closeButton} className="assistant-close" type="button" aria-label="Close wedding guide" onClick={closeAssistant}>×</button></header>
      <p className="assistant-disclosure">Prewritten answers from the couple.</p>
      <div ref={messageArea} className="assistant-conversation">
        <AssistantMessages messages={messages} typing={typing} onAction={navigate} />
        <p className="sr-only" aria-live="polite" aria-atomic="true">{latestResponse}</p>
      </div>
      <div className="assistant-suggestions" aria-label="Suggested questions">{suggestedQuestions.map((question) => <button type="button" key={question} disabled={typing} onClick={() => ask(question)}>{question}</button>)}</div>
      <form className="assistant-form" onSubmit={submit}><label className="sr-only" htmlFor="assistant-input">Ask a question</label><input id="assistant-input" value={input} maxLength={160} autoComplete="off" placeholder="Ask about the wedding…" onChange={(event) => setInput(event.target.value)} onKeyDown={inputKeyDown} /><button type="submit" disabled={!input.trim() || typing}>Send</button></form>
      <button className="assistant-reset" type="button" onClick={reset}>Start over</button>
    </section>
    <AssistantLauncher ref={launcher} open={open} hidden={!open && rsvpVisible} onClick={() => open ? closeAssistant() : setOpen(true)} />
  </div>
}
