import { BotanicalOrnament } from './BotanicalOrnament'
import { Monogram } from './Monogram'

export function OrnamentalOval() {
  return (
    <div className="portrait-oval" aria-hidden="true">
      <span className="portrait-oval__line" />
      <BotanicalOrnament className="portrait-oval__botanical" />
      <Monogram />
    </div>
  )
}

export function WaxSeal({ letters = 'E F' }: { letters?: string }) {
  return <span className="wax-seal" data-reveal="seal" aria-hidden="true"><span>{letters}</span></span>
}

export function EditorialHeading({ overline, children, light = false }: { overline?: string; children: React.ReactNode; light?: boolean }) {
  return <header className={`editorial-heading${light ? ' editorial-heading--light' : ''}`} data-reveal="heading">{overline && <p className="eyebrow">{overline}</p>}<h2>{children}</h2></header>
}

export function EventIcon({ type }: { type: 'ceremony' | 'reception' }) {
  return (
    <svg className="event-icon" viewBox="0 0 82 82" aria-hidden="true">
      {type === 'ceremony' ? <><path d="M14 68h54M20 68V35h42v33M28 35V23h26v12M36 23V12h10v11M41 7v10M36 11h10" /><path d="M34 49h14v19M20 43h42" /></> : <><path d="M12 66h58M20 66V42h42v24M27 42V29h28v13M34 29V17h14v12" /><path d="M30 51h22M41 42v24M25 22c5-5 9-5 14 0M45 22c5-5 9-5 14 0" /></>}
    </svg>
  )
}
