import { useEffect, useRef, useState } from 'react'
import { Monogram } from './Monogram'

const links = [['Invitation', 'invitation'], ['Celebration', 'celebration'], ['Entourage', 'entourage'], ['Details', 'details']]

export function Header() {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButton.current?.focus()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href="#invitation"><Monogram compact /></a>
        <button ref={menuButton} className="menu-button" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
          <span className="sr-only">{open ? 'Close' : 'Open'} menu</span><span /><span />
        </button>
        <nav id="primary-nav" className={open ? 'nav nav--open' : 'nav'} aria-label="Primary navigation">
          {links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}
          <a className="nav-rsvp" href="#rsvp" onClick={() => setOpen(false)}>RSVP</a>
        </nav>
      </div>
    </header>
  )
}
