export function Monogram({ compact = false, ampersand = false }: { compact?: boolean; ampersand?: boolean }) {
  return <span className={`monogram${compact ? ' monogram--compact' : ''}`} aria-label="Exedar and Frances">E <i>{ampersand ? '&' : '/'}</i> F</span>
}
