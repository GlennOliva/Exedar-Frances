import { useEffect } from 'react'
import { useReducedMotion } from './useReducedMotion'

export function useScrollReveal() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('reveal-visible'))
      return
    }

    elements.forEach((element) => element.classList.add('reveal-pending'))
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.remove('reveal-pending')
        entry.target.classList.add('reveal-visible')
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
      elements.forEach((element) => element.classList.remove('reveal-pending'))
    }
  }, [reducedMotion])
}
