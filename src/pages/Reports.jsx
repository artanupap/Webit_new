import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { formatDate } from '../components/TicketCard'
import { statuses, priorities, categories } from '../data/seed'
import { getSlaInfo } from '../utils/sla'
import { exportTicketsCsv } from '../utils/csv'

const day = 24 * 60 * 60 * 1000

const PERIODS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'week', label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'year', label: 'ปีนี้' },
]

function getPeriodStart(period) {
  const now = new Date()
  if (period === 'week') {
    const dow = now.getDay()
    const diffToMonday = dow === 0 ? -6 : 1 - dow
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday.getTime()
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  if (period === 'year') return new Date(now.getFullYear(), 0, 1).getTime()
  return null
}

export default function Reports() {
  const { tickets } = useData()
  const { technicians, departments, getUserById } = useAuth()

  const [company, setCompany] = useState('all')
  const [departmentId, setDepartmentId] = useState('all')
  const [period, setPeriod] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const companies = useMemo(() => [...new Set(departments.map((d) => d.company))], [departments])
  const departmentOptions = useMemo(
    () => (company === 'all' ? departments : departments.filter((d) => d.company === company)),
    [departments, company]
  )

  function handleCompanyChange(value) {
    setCompany(value)
    setDepartmentId('all')
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (company !== 'all' && t.department?.company !== company) return false
      if (departmentId !== 'all' && t.department?.id !== departmentId) return false
      if (customStart) {
        const s = new Date(customStart).getTime()
        if (t.createdAt < s) return false
      }
      if (customEnd) {
        const e = new Date(customEnd).getTime() + day - 1
        if (t.createdAt > e) return false
      }
      if (!customStart && !customEnd && period !== 'all') {
        const start = getPeriodStart(period)
        if (start !== null && t.createdAt < start) return false
      }
      return true
    })
  }, [tickets, company, departmentId, period, customStart, customEnd])

  const byStatus = useMemo(
    () => statuses.map((s) => ({ name: s.label, value: filteredTickets.filter((t) => t.status === s.value).length, color: s.color })),
    [filteredTickets]
  )

  const byPriority = useMemo(
    () => priorities.map((p) => ({ name: p.label, value: filteredTickets.filter((t) => t.priority === p.value).length, color: p.color })),
    [filteredTickets]
  )

  const byCategory = useMemo(
    () => categories.map((c) => ({ name: c, count: filteredTickets.filter((t) => t.category === c).length })).filter((c) => c.count > 0),
    [filteredTickets]
  )

  const byTechnician = useMemo(
    () => technicians.map((t) => ({
      name: t.name,
      assigned: filteredTickets.filter((x) => x.assignedTo === t.id).length,
      done: filteredTickets.filter((x) => x.assignedTo === t.id && x.status === 'done').length,
    })),
    [filteredTickets, technicians]
  )

  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const start = Date.now() - i * day
      const dateLabel = new Date(start).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
      const count = filteredTickets.filter((t) => {
        const diff = Math.floor((Date.now() - t.createdAt) / day)
        return diff === i
      }).length
      days.push({ date: dateLabel, จำนวนแจ้งซ่อม: count })
    }
    return days
  }, [filteredTickets])

  const avgResolutionHours = useMemo(() => {
    const done = filteredTickets.filter((t) => t.status === 'done')
    if (done.length === 0) return 0
    const totalHours = done.reduce((sum, t) => sum + (t.updatedAt - t.createdAt) / 3600000, 0)
    return (totalHours / done.length).toFixed(1)
  }, [filteredTickets])

  const avgRating = useMemo(() => {
    const rated = filteredTickets.filter((t) => t.rating)
    if (rated.length === 0) return null
    return (rated.reduce((sum, t) => sum + t.rating, 0) / rated.length).toFixed(1)
  }, [filteredTickets])

  const overdueCount = useMemo(
    () => filteredTickets.filter((t) => getSlaInfo(t)?.overdue).length,
    [filteredTickets]
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>รายงานสรุปผล</h1>
          <p className="page-subtitle">ภาพรวมข้อมูลสำหรับผู้บริหารในการตัดสินใจ</p>
        </div>
        <button className="btn btn-ghost" onClick={() => exportTicketsCsv(filteredTickets, getUserById)}>
          ⬇ ส่งออก CSV
        </button>
      </div>

      <div className="filter-row">
        <select value={company} onChange={(e) => handleCompanyChange(e.target.value)}>
          <option value="all">ทุกบริษัท</option>
          {companies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="all">ทุกแผนก</option>
          {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={period === p.value && !customStart && !customEnd ? 'chip active' : 'chip'}
            onClick={() => { setPeriod(p.value); setCustomStart(''); setCustomEnd('') }}
          >
            {p.label}
          </button>
        ))}
        <input type="date" className="date-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
        <span className="filter-sep">ถึง</span>
        <input type="date" className="date-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
      </div>

      <div className="stat-row">
        <StatCard icon="clipboard" tone="primary" value={filteredTickets.length} label="ตั๋วแจ้งซ่อมทั้งหมด" />
        <StatCard icon="clock" tone="info" value={`${avgResolutionHours} ชม.`} label="เวลาซ่อมเฉลี่ย" />
        <StatCard icon="users" tone="primary" value={technicians.length} label="ช่างเทคนิคทั้งหมด" />
        <StatCard icon="star" tone="good" value={avgRating ? `${avgRating}` : '—'} label="ความพึงพอใจเฉลี่ย" />
        <StatCard icon="alert" tone="danger" value={overdueCount} label="งานเกินกำหนด SLA" />
      </div>

      <div className="report-grid">
        <div className="report-card">
          <h3>สัดส่วนตามสถานะ</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3>สัดส่วนตามความเร่งด่วน</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {byPriority.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3>จำนวนงานตามหมวดหมู่</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3>ผลงานช่างเทคนิค</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byTechnician}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" name="ได้รับมอบหมาย" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="done" name="เสร็จสิ้น" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card report-card-wide">
          <h3>แนวโน้มการแจ้งซ่อม 7 วันล่าสุด</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="จำนวนแจ้งซ่อม" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="page-header report-detail-header">
        <div>
          <h3>รายละเอียดใบแจ้งซ่อม ({filteredTickets.length} รายการ)</h3>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>เลขที่ตั๋ว</th>
              <th>หัวข้อ</th>
              <th>บริษัท</th>
              <th>แผนก</th>
              <th>หมวดหมู่</th>
              <th>ความเร่งด่วน</th>
              <th>สถานะ</th>
              <th>ผู้แจ้ง</th>
              <th>ผู้รับผิดชอบ</th>
              <th>วันที่แจ้ง</th>
              <th>คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 && (
              <tr><td colSpan={11} className="empty-hint">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
            )}
            {filteredTickets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.title}</td>
                <td>{t.department?.company || '-'}</td>
                <td>{t.department?.name || '-'}</td>
                <td>{t.category}</td>
                <td><PriorityBadge priority={t.priority} /></td>
                <td><StatusBadge status={t.status} /></td>
                <td>{getUserById(t.createdBy)?.name || '-'}</td>
                <td>{t.assignedTo ? getUserById(t.assignedTo)?.name : 'ยังไม่มอบหมาย'}</td>
                <td>{formatDate(t.createdAt)}</td>
                <td>{t.rating ? `${t.rating} ★` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
