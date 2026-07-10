// Line icons using currentColor — inherit color from parent (white on gradient chips, blue elsewhere)
const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M18 20a5 5 0 0 0-3-4.6" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="12" height="18" rx="1.5" />
      <path d="M16 8h4v13H8" />
      <path d="M8 7h1.5M12 7h.5M8 11h1.5M12 11h.5M8 15h1.5M12 15h.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="12" width="3" height="5" rx="0.8" />
      <rect x="12" y="8" width="3" height="9" rx="0.8" />
      <rect x="17" y="5" width="3" height="12" rx="0.8" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13l2.5-7a2 2 0 0 1 1.9-1.3h7.2A2 2 0 0 1 17.5 6L20 13v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.2L4 16.6 7.4 20l5.9-5.9a3.5 3.5 0 0 0 4.2-4.6l-2.2 2.2-2.1-.6-.6-2.1z" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.3 2.3 4.5-4.7" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5l9 16H3z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.7" r="0.4" fill="currentColor" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  star: (
    <>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17.9 6.7 20.6l1-5.8L3.5 9.7l5.9-.9z" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M10 12H3" />
      <path d="M6 8l-3 4 3 4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M5.6 5.6l3.1 3.1M15.3 15.3l3.1 3.1M18.4 5.6l-3.1 3.1M8.7 15.3l-3.1 3.1" />
    </>
  ),
}

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.9 }) {
  const content = paths[name]
  if (!content) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
