import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

const interactionDuration = 1350

export function HeroPortrait() {
  const portraitRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [finePointer, setFinePointer] = useState(() => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches)

  useEffect(() => {
    const query = matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFinePointer(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => () => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (finePointer && !reducedMotion) return
    const portrait = portraitRef.current
    if (!portrait) return
    portrait.style.setProperty('--tilt-x', '0deg')
    portrait.style.setProperty('--tilt-y', '0deg')
    portrait.style.setProperty('--highlight-x', '50%')
    portrait.style.setProperty('--highlight-y', '32%')
  }, [finePointer, reducedMotion])

  function playKiss() {
    if (playingRef.current) return
    playingRef.current = true
    setPlaying(true)
    timerRef.current = window.setTimeout(() => {
      playingRef.current = false
      setPlaying(false)
      timerRef.current = null
    }, interactionDuration)
  }

  function updateTilt(event: PointerEvent<HTMLDivElement>) {
    if (!finePointer || reducedMotion) return
    const portrait = portraitRef.current
    if (!portrait) return
    const bounds = portrait.getBoundingClientRect()
    const horizontal = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1))
    const vertical = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1))
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = requestAnimationFrame(() => {
      portrait.style.setProperty('--tilt-x', `${vertical * -5}deg`)
      portrait.style.setProperty('--tilt-y', `${horizontal * 5}deg`)
      portrait.style.setProperty('--highlight-x', `${(horizontal + 1) * 50}%`)
      portrait.style.setProperty('--highlight-y', `${(vertical + 1) * 50}%`)
      animationFrameRef.current = null
    })
  }

  function resetTilt() {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = null
    const portrait = portraitRef.current
    if (!portrait) return
    portrait.style.setProperty('--tilt-x', '0deg')
    portrait.style.setProperty('--tilt-y', '0deg')
    portrait.style.setProperty('--highlight-x', '50%')
    portrait.style.setProperty('--highlight-y', '32%')
  }

  return (
    <div className="hero-portrait-shell">
      <div
        ref={portraitRef}
        className={`hero-portrait${playing ? ' is-kissing' : ''}`}
        onPointerEnter={() => { if (finePointer) playKiss() }}
        onPointerMove={updateTilt}
        onPointerLeave={resetTilt}
      >
        <div className="hero-gallery">
          <figure>
            <img
              src="/image1-768.webp"
              srcSet="/image1-384.webp 384w, /image1-768.webp 768w"
              sizes="(max-width: 560px) 320px, (max-width: 900px) 250px, 300px"
              alt="Exedar and Frances smiling together at their celebration"
              width="768"
              height="771"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </figure>
          <figure>
            <img
              src="/image2-768.webp"
              srcSet="/image2-384.webp 384w, /image2-768.webp 768w"
              sizes="(max-width: 560px) 320px, (max-width: 900px) 250px, 300px"
              alt="Exedar and Frances sharing a close embrace"
              width="768"
              height="771"
              decoding="async"
            />
          </figure>
        </div>
        <div className="hero-portrait__highlight" aria-hidden="true" />
        <div className="kiss-particles" aria-hidden="true">
          <span className="kiss-heart kiss-heart--lead">&hearts;</span>
          <span className="kiss-heart kiss-heart--one">&hearts;</span>
          <span className="kiss-heart kiss-heart--two">&hearts;</span>
          <span className="kiss-heart kiss-heart--three">&hearts;</span>
        </div>
      </div>
      <button className="hero-kiss-button" type="button" onClick={playKiss}>
        A kiss for the bride
      </button>
    </div>
  )
}
