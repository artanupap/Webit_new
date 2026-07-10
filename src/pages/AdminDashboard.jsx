import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import TicketCard from '../components/TicketCard'
import TicketDetail from '../components/TicketDetail'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { categories } from '../data/seed'
import { sortTickets } from '../utils/sort'
import { exportTicketsCsv } from '../utils/csv'

const QUICK_FILTERS = [
  { value: 'all', icon: 'clipboard', tone: 'primary', label: 'ทั้งหมด' },
  { value: 'unassigned', icon: 'inbox', tone: 'warn', label: 'ยังไม่มอบหมาย' },
  { value: 'in_progress', icon: 'wrench', tone: 'info', label: 'กำลังซ่อม' },
  { value: 'done', icon: 'check', tone: 'good', label: 'เสร็จสิ้น' },
  { value: 'urgent', icon: 'alert', tone: 'danger', label: 'ด่วนมาก (ค้าง)' },
]

export default function AdminDashboard() {
  const { getUserById } = useAuth()
  const { tickets } = useData()
  const [selected, setSelected] = useState(null)
  const [quickFilter, setQuickFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const selectedTicket = tickets.find((t) => t.id === selected?.id)

  const stats = useMemo(() => {
    const total = tickets.length
    const unassigned = tickets.filter((t) => !t.assignedTo && t.status !== 'cancelled').length
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length
    const done = tickets.filter((t) => t.status === 'done').length
    const urgent = tickets.filter((t) => t.priority === 'urgent' && !['done', 'cancelled'].includes(t.status)).length
    return { all: total, unassigned, in_progress: inProgress, done, urgent }
  }, [tickets])

  const filtered = useMemo(() => {
    const base = tickets.filter((t) => {
      if (quickFilter === 'unassigned' && (t.assignedTo || t.status === 'cancelled')) return false
      if (quickFilter === 'in_progress' && t.status !== 'in_progress') return false
      if (quickFilter === 'done' && t.status !== 'done') return false
      if (quickFilter === 'urgent' && !(t.priority === 'urgent' && !['done', 'cancelled'].includes(t.status))) return false
      if (category !== 'all' && t.category !== category) return false
      if (search && !(t.title.includes(search) || t.id.includes(search))) return false
      return true
    })
    return sortTickets(base, 'newest')
  }, [tickets, quickFilter, category, search])

  const hasActiveFilter = quickFilter !== 'all' || category !== 'all' || search !== ''

  function resetFilters() {
    setQuickFilter('all')
    setCategory('all')
    setSearch('')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>ภาพรวมงานแจ้งซ่อมทั้งหมด</h1>
          <p className="page-subtitle">แตะการ์ดด้านล่างเพื่อกรองดูงานแต่ละประเภทได้ทันที</p>
        </div>
        <button className="btn btn-ghost" onClick={() => exportTicketsCsv(filtered, getUserById)}>
          ⬇ ส่งออก CSV
        </button>
      </div>

      <div className="stat-row">
        {QUICK_FILTERS.map((f) => (
          <StatCard
            key={f.value}
            icon={f.icon}
            tone={f.tone}
            value={stats[f.value]}
            label={f.label}
            active={quickFilter === f.value}
            onClick={() => setQuickFilter(f.value)}
          />
        ))}
      </div>

      <div className="filter-row">
        <input
          className="search-input"
          placeholder="ค้นหาเลขที่ตั๋วหรือหัวข้อ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">ทุกหมวดหมู่</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {hasActiveFilter && (
          <button className="chip chip-reset" onClick={resetFilters}>✕ ล้างตัวกรอง</button>
        )}
      </div>

      <div className="ticket-grid">
        {filtered.length === 0 && <div className="empty-hint">ไม่พบรายการที่ตรงกับเงื่อนไข</div>}
        {filtered.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onClick={() => setSelected(t)}
            subtitle={t.assignedTo ? `ช่าง: ${getUserById(t.assignedTo)?.name}` : 'ยังไม่มอบหมาย'}
          />
        ))}
      </div>

      <Modal open={!!selectedTicket} onClose={() => setSelected(null)} title="รายละเอียดตั๋วแจ้งซ่อม" wide>
        {selectedTicket && <TicketDetail ticket={selectedTicket} showStatusControl />}
      </Modal>
    </div>
  )
}
