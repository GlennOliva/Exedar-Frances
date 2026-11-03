import { useEffect, useRef } from 'react'

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const distance = document.documentElement.scrollHeight - innerHeight
      const progress = distance > 0 ? Math.min(1, scrollY / distance) : 0
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    return () => { removeEventListener('scroll', schedule); removeEventListener('resize', schedule); if (frame) cancelAnimationFrame(frame) }
  }, [])
  return <div className="scroll-progress" aria-hidden="true"><div ref={bar} /></div>
}
