export function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg className={`chev${up ? ' up' : ''}`} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
