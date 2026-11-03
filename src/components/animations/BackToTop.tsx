import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; setVisible(scrollY > 700) }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update(); addEventListener('scroll', schedule, { passive: true })
    return () => { removeEventListener('scroll', schedule); if (frame) cancelAnimationFrame(frame) }
  }, [])
  return <button className={`back-to-top${visible ? ' back-to-top--visible' : ''}`} type="button" aria-label="Back to top" tabIndex={visible ? 0 : -1} onClick={() => scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })}><span aria-hidden="true">↑</span></button>
}
