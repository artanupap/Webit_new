import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import TicketCard from '../components/TicketCard'
import TicketDetail from '../components/TicketDetail'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { statuses } from '../data/seed'
import { sortTickets, SORT_OPTIONS } from '../utils/sort'

export default function TechDashboard() {
  const { currentUser } = useAuth()
  const { getTicketsFor, tickets } = useData()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  const myTickets = getTicketsFor(currentUser)
  const filtered = sortTickets(
    filter === 'all' ? myTickets : myTickets.filter((t) => t.status === filter),
    sort
  )
  const selectedTicket = tickets.find((t) => t.id === selected?.id)

  const stats = useMemo(() => {
    const unclaimed = myTickets.filter((t) => !t.assignedTo).length
    const inProgress = myTickets.filter((t) => t.assignedTo === currentUser.id && t.status === 'in_progress').length
    const done = myTickets.filter((t) => t.assignedTo === currentUser.id && t.status === 'done').length
    return { unclaimed, inProgress, done }
  }, [myTickets, currentUser.id])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>งานแจ้งซ่อม</h1>
          <p className="page-subtitle">งานใหม่ทุกรายการจะเข้าคิวนี้ให้ทุกคน — กดรับงานแล้วอัปเดตความคืบหน้าได้เลย</p>
        </div>
      </div>

      <div className="stat-row">
        <StatCard icon="inbox" tone="warn" value={stats.unclaimed} label="รอรับงาน" />
        <StatCard icon="wrench" tone="info" value={stats.inProgress} label="กำลังซ่อม (ของฉัน)" />
        <StatCard icon="check" tone="good" value={stats.done} label="เสร็จสิ้น (ของฉัน)" />
      </div>

      <div className="filter-row">
        <button className={filter === 'all' ? 'chip active' : 'chip'} onClick={() => setFilter('all')}>ทั้งหมด</button>
        {statuses.map((s) => (
          <button key={s.value} className={filter === s.value ? 'chip active' : 'chip'} onClick={() => setFilter(s.value)}>{s.label}</button>
        ))}
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>เรียงตาม: {o.label}</option>)}
        </select>
      </div>

      <div className="ticket-grid">
        {filtered.length === 0 && <div className="empty-hint">ไม่มีงานในหมวดนี้</div>}
        {filtered.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onClick={() => setSelected(t)}
            subtitle={t.assignedTo ? t.location : `${t.location} · ยังไม่มีคนรับ`}
          />
        ))}
      </div>

      <Modal open={!!selectedTicket} onClose={() => setSelected(null)} title="รายละเอียดงานซ่อม" wide>
        {selectedTicket && <TicketDetail ticket={selectedTicket} showStatusControl />}
      </Modal>
    </div>
  )
}
