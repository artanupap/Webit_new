import { priorities, statuses } from '../data/seed'

export function StatusBadge({ status }) {
  const s = statuses.find((x) => x.value === status) || statuses[0]
  return (
    <span className="badge" style={{ backgroundColor: s.color + '18', color: s.color, borderColor: s.color + '44' }}>
      <span className="badge-dot" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const p = priorities.find((x) => x.value === priority) || priorities[0]
  return (
    <span className="badge" style={{ backgroundColor: p.color + '18', color: p.color, borderColor: p.color + '44' }}>
      <span className="badge-dot" style={{ backgroundColor: p.color }} />
      {p.label}
    </span>
  )
}
