export function getSlaInfo(ticket) {
  if (!ticket.dueAt || ['done', 'cancelled'].includes(ticket.status)) return null
  const remainingMs = ticket.dueAt - Date.now()
  const overdue = remainingMs < 0
  const hours = Math.abs(remainingMs) / 3600000
  const label = hours < 1
    ? `${Math.round(Math.abs(remainingMs) / 60000)} นาที`
    : `${hours.toFixed(hours < 10 ? 1 : 0)} ชม.`
  return {
    overdue,
    text: overdue ? `เกินกำหนด ${label}` : `ครบกำหนดใน ${label}`,
  }
}
