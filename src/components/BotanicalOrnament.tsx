export function BotanicalOrnament({ className = '' }: { className?: string }) {
  return (
    <svg className={`botanical ${className}`} viewBox="0 0 180 54" aria-hidden="true">
      <path d="M10 42c31-1 42-18 66-30M170 42c-31-1-42-18-66-30M90 48V8" />
      <path d="M38 34c-9-15-17-8-13 2M52 27c-4-16-14-12-14-2M67 19c0-14-10-13-13-3M142 34c9-15 17-8 13 2M128 27c4-16 14-12 14-2M113 19c0-14 10-13 13-3M90 26c-12-8-14 4 0 9M90 26c12-8 14 4 0 9" />
    </svg>
  )
}
