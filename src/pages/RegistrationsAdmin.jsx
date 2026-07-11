import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { formatDate } from '../components/TicketCard'

const FILTERS = [
  { value: 'pending', label: 'รออนุมัติ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธแล้ว' },
  { value: 'all', label: 'ทั้งหมด' },
]

const statusLabels = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธแล้ว' }

export default function RegistrationsAdmin() {
  const { registrations, approveRegistration, rejectRegistration } = useAuth()
  const { showToast } = useToast()
  const [filter, setFilter] = useState('pending')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')

  const stats = useMemo(() => {
    const pending = registrations.filter((r) => r.status === 'pending').length
    const approved = registrations.filter((r) => r.status === 'approved').length
    const rejected = registrations.filter((r) => r.status === 'rejected').length
    return { pending, approved, rejected }
  }, [registrations])

  const filtered = useMemo(
    () => (filter === 'all' ? registrations : registrations.filter((r) => r.status === filter)),
    [registrations, filter]
  )

  async function handleApprove(r) {
    try {
      await approveRegistration(r.id)
      showToast(`อนุมัติผู้ใช้ ${r.name} เรียบร้อยแล้ว`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleReject() {
    try {
      await rejectRegistration(rejectTarget.id, reason.trim() || null)
      showToast(`ปฏิเสธคำขอของ ${rejectTarget.name} แล้ว`, 'success')
      setRejectTarget(null)
      setReason('')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>คำขอสมัครสมาชิก</h1>
          <p className="page-subtitle">ตรวจสอบและอนุมัติคำขอใช้งานระบบจากพนักงาน</p>
        </div>
      </div>

      <div className="stat-row">
        <StatCard icon="inbox" tone="warn" value={stats.pending} label="รออนุมัติ" />
        <StatCard icon="check" tone="good" value={stats.approved} label="อนุมัติแล้ว" />
        <StatCard icon="alert" tone="danger" value={stats.rejected} label="ปฏิเสธแล้ว" />
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={filter === f.value ? 'chip active' : 'chip'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>ชื่อผู้ใช้</th>
              <th>บริษัท</th>
              <th>แผนก/ฝ่าย</th>
              <th>วันที่ขอ</th>
              <th>สถานะ</th>
              <th className="col-actions">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="empty-hint">ไม่พบคำขอในหมวดนี้</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.username}</td>
                <td>{r.department?.company || '-'}</td>
                <td>{r.department?.name || '-'}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td><span className={`role-tag registration-status-${r.status}`}>{statusLabels[r.status]}</span></td>
                <td className="col-actions">
                  {r.status === 'pending' ? (
                    <div className="row-actions">
                      <button className="icon-btn icon-btn-success" title="อนุมัติ" onClick={() => handleApprove(r)}>✅</button>
                      <button className="icon-btn icon-btn-danger" title="ปฏิเสธ" onClick={() => { setRejectTarget(r); setReason('') }}>✕</button>
                    </div>
                  ) : (
                    <span className="empty-hint-inline">{r.rejectReason || '-'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="ปฏิเสธคำขอสมัคร">
        <div className="confirm-body">
          <p>คุณต้องการปฏิเสธคำขอของ <strong>{rejectTarget?.name}</strong> ({rejectTarget?.username}) ใช่หรือไม่?</p>
          <label className="reject-reason-label">
            เหตุผล (ถ้ามี)
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลที่ปฏิเสธคำขอนี้..."
            />
          </label>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setRejectTarget(null)}>ยกเลิก</button>
            <button className="btn btn-danger" onClick={handleReject}>ปฏิเสธคำขอ</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
