import { forwardRef } from 'react'
import { Monogram } from '../Monogram'

export const AssistantLauncher = forwardRef<HTMLButtonElement, { open: boolean; hidden: boolean; onClick: () => void }>(function AssistantLauncher({ open, hidden, onClick }, ref) {
  return <button ref={ref} className={`assistant-launcher${hidden ? ' assistant-launcher--hidden' : ''}`} type="button" aria-label={open ? 'Close Ask About Us' : 'Open Ask About Us'} aria-expanded={open} aria-controls="wedding-assistant" aria-hidden={hidden || undefined} tabIndex={hidden ? -1 : 0} onClick={onClick}><Monogram compact /><span>Ask About Us</span></button>
})
