import { StatusBadge, PriorityBadge } from './Badges'
import { getSlaInfo } from '../utils/sla'

function formatDate(ts) {
  return new Date(ts).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function TicketCard({ ticket, onClick, subtitle }) {
  const sla = getSlaInfo(ticket)

  return (
    <div className="ticket-card" onClick={onClick}>
      <div className="ticket-card-top">
        <span className="ticket-id">{ticket.id}</span>
        <div className="ticket-card-badges">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-desc">{ticket.description}</p>
      <div className="ticket-card-meta">
        <span>📍 {ticket.location}</span>
        <span>🗂️ {ticket.category}</span>
      </div>
      {sla && (
        <div className={sla.overdue ? 'sla-tag sla-overdue' : 'sla-tag'}>
          {sla.overdue ? '⏰' : '🕒'} {sla.text}
        </div>
      )}
      {ticket.attachment && <div className="ticket-card-attach">📎 มีไฟล์แนบ</div>}
      <div className="ticket-card-footer">
        <span>{subtitle}</span>
        <span>{formatDate(ticket.createdAt)}</span>
      </div>
    </div>
  )
}

export { formatDate }
