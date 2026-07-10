import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import TicketCard from '../components/TicketCard'
import TicketForm from '../components/TicketForm'
import TicketDetail from '../components/TicketDetail'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { statuses } from '../data/seed'
import { sortTickets, SORT_OPTIONS } from '../utils/sort'

export default function UserDashboard() {
  const { currentUser, getUserById } = useAuth()
  const { getTicketsFor, createTicket, tickets } = useData()
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
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
    const total = myTickets.length
    const open = myTickets.filter((t) => !['done', 'cancelled'].includes(t.status)).length
    const done = myTickets.filter((t) => t.status === 'done').length
    return { total, open, done }
  }, [myTickets])

  async function handleCreate(form) {
    try {
      await createTicket({ ...form, createdBy: currentUser.id })
      setShowForm(false)
      showToast('ส่งแจ้งซ่อมเรียบร้อยแล้ว', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>แจ้งซ่อม IT</h1>
          <p className="page-subtitle">แจ้งปัญหาและติดตามสถานะการซ่อมของคุณ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ แจ้งซ่อมใหม่</button>
      </div>

      <div className="stat-row">
        <StatCard icon="clipboard" tone="primary" value={stats.total} label="รายการทั้งหมด" />
        <StatCard icon="wrench" tone="info" value={stats.open} label="กำลังดำเนินการ" />
        <StatCard icon="check" tone="good" value={stats.done} label="ซ่อมเสร็จแล้ว" />
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
        {filtered.length === 0 && <div className="empty-hint">ไม่มีรายการแจ้งซ่อมในหมวดนี้</div>}
        {filtered.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onClick={() => setSelected(t)}
            subtitle={t.assignedTo ? `ช่าง: ${getUserById(t.assignedTo)?.name}` : 'รอมอบหมายช่าง'}
          />
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="แจ้งซ่อมใหม่">
        <TicketForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal open={!!selectedTicket} onClose={() => setSelected(null)} title="รายละเอียดตั๋วแจ้งซ่อม" wide>
        {selectedTicket && <TicketDetail ticket={selectedTicket} />}
      </Modal>
    </div>
  )
}
