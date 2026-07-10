const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 }

export const SORT_OPTIONS = [
  { value: 'newest', label: 'ล่าสุดก่อน' },
  { value: 'oldest', label: 'เก่าสุดก่อน' },
  { value: 'priority', label: 'ความเร่งด่วน' },
]

export function sortTickets(list, sort) {
  const copy = [...list]
  if (sort === 'oldest') return copy.sort((a, b) => a.createdAt - b.createdAt)
  if (sort === 'priority') {
    return copy.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9))
  }
  return copy.sort((a, b) => b.createdAt - a.createdAt)
}
