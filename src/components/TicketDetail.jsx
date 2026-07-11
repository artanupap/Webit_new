import { useState } from 'react'
import { StatusBadge, PriorityBadge } from './Badges'
import { formatDate } from './TicketCard'
import StarRating from './StarRating'
import SignaturePad from './SignaturePad'
import { getSlaInfo } from '../utils/sla'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'

export default function TicketDetail({ ticket, showStatusControl }) {
  const { currentUser, getUserById } = useAuth()
  const { assignTicket, setStatus, addComment, rateTicket, saveSignature } = useData()
  const { showToast } = useToast()
  const [commentText, setCommentText] = useState('')

  const creator = getUserById(ticket.createdBy)
  const tech = getUserById(ticket.assignedTo)
  const sla = getSlaInfo(ticket)
  const canRate = ticket.status === 'done' && ticket.createdBy === currentUser.id

  async function handleStartProgress() {
    try {
      if (!ticket.assignedTo) {
        await assignTicket(ticket.id, currentUser.id, currentUser.id, currentUser.name)
      }
      await setStatus(ticket.id, 'in_progress', currentUser.id, 'กำลังดำเนินการ')
      showToast('อัปเดตสถานะเป็น "กำลังดำเนินการ" แล้ว', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleCancel() {
    try {
      await setStatus(ticket.id, 'cancelled', currentUser.id, 'ยกเลิก')
      showToast('ยกเลิกงานแล้ว', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await addComment(ticket.id, currentUser.id, commentText.trim())
      setCommentText('')
      showToast('เพิ่มความคิดเห็นแล้ว', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleRate(n) {
    try {
      await rateTicket(ticket.id, n)
      showToast('ขอบคุณสำหรับการให้คะแนน', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleSaveSignature(dataUrl) {
    try {
      await saveSignature(ticket.id, dataUrl)
      showToast('บันทึกลายเซ็นแล้ว กดปิดงานเพื่อยืนยัน', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleCloseJob() {
    try {
      await setStatus(ticket.id, 'done', currentUser.id, 'ซ่อมเสร็จสิ้น')
      showToast('ปิดงานเรียบร้อยแล้ว', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="ticket-detail">
      <div className="ticket-detail-header">
        <div>
          <span className="ticket-id">{ticket.id}</span>
          <h2>{ticket.title}</h2>
        </div>
        <div className="ticket-card-badges">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {sla && (
        <div className={sla.overdue ? 'sla-tag sla-overdue' : 'sla-tag'}>
          {sla.overdue ? '⏰' : '🕒'} {sla.text}
        </div>
      )}

      <p className="ticket-detail-desc">{ticket.description}</p>

      {ticket.attachment && (
        <a href={ticket.attachment} target="_blank" rel="noreferrer" className="attachment-preview">
          <img src={ticket.attachment} alt="ไฟล์แนบ" />
          <span>📎 เปิดไฟล์แนบขนาดเต็ม</span>
        </a>
      )}

      <div className="ticket-detail-grid">
        <div><label>ผู้แจ้ง</label><span>{creator?.name}</span></div>
        <div><label>บริษัท / แผนก</label><span>{ticket.department ? `${ticket.department.company} · ${ticket.department.name}` : '-'}</span></div>
        <div><label>สถานที่</label><span>{ticket.location}</span></div>
        <div><label>หมวดหมู่</label><span>{ticket.category}</span></div>
        <div><label>เบอร์ภายใน / ภายนอก</label><span>{ticket.department ? `${ticket.department.phoneInternal || '-'} / ${ticket.department.phoneExternal || '-'}` : '-'}</span></div>
        <div><label>ผู้รับผิดชอบ</label><span>{tech ? tech.name : 'ยังไม่ได้รับเรื่อง'}</span></div>
        <div><label>วันที่แจ้ง</label><span>{formatDate(ticket.createdAt)}</span></div>
        <div><label>อัปเดตล่าสุด</label><span>{formatDate(ticket.updatedAt)}</span></div>
      </div>

      {showStatusControl && (ticket.status === 'new' || ticket.status === 'assigned') && (
        <div className="signature-actions">
          <button type="button" className="btn btn-primary" onClick={handleStartProgress}>เริ่มดำเนินการ</button>
          <button type="button" className="btn btn-danger" onClick={handleCancel}>ยกเลิกงาน</button>
        </div>
      )}

      {showStatusControl && ticket.status === 'in_progress' && (
        <div className="ticket-detail-section">
          <h4>ลายเซ็นยืนยันปิดงาน</h4>
          <p className="signature-hint">ให้ผู้แจ้งเซ็นชื่อยืนยันในช่องด้านล่าง จากนั้นกดจบงาน</p>
          {ticket.signature ? (
            <>
              <img src={ticket.signature} alt="ลายเซ็นผู้แจ้ง" className="signature-preview" />
              <div className="signature-actions">
                <button type="button" className="btn btn-primary" onClick={handleCloseJob}>จบงาน</button>
              </div>
            </>
          ) : (
            <SignaturePad onSave={handleSaveSignature} />
          )}
        </div>
      )}

      {ticket.status === 'done' && (
        <div className="rating-box">
          <label>ความพึงพอใจในการซ่อม</label>
          <StarRating value={ticket.rating || 0} onRate={canRate ? handleRate : undefined} readOnly={!canRate} />
          {!ticket.rating && !canRate && <span className="empty-hint-inline">ยังไม่มีการให้คะแนน</span>}
        </div>
      )}

      {ticket.status === 'done' && ticket.signature && (
        <div className="ticket-detail-section">
          <h4>ลายเซ็นยืนยันปิดงาน</h4>
          <img src={ticket.signature} alt="ลายเซ็นผู้แจ้ง" className="signature-preview" />
        </div>
      )}

      <div className="ticket-detail-section">
        <h4>ประวัติดำเนินการ</h4>
        <ul className="timeline">
          {ticket.history.slice().reverse().map((h, i) => (
            <li key={i}>
              <span className="timeline-dot" />
              <div>
                <div className="timeline-action">{h.action}</div>
                <div className="timeline-meta">{getUserById(h.by)?.name} · {formatDate(h.at)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="ticket-detail-section">
        <h4>ความคิดเห็น / บันทึกเพิ่มเติม</h4>
        <ul className="comment-list">
          {ticket.comments.length === 0 && <li className="empty-hint">ยังไม่มีความคิดเห็น</li>}
          {ticket.comments.map((c, i) => (
            <li key={i} className="comment-item">
              <div className="comment-head">
                <strong>{getUserById(c.by)?.name}</strong>
                <span>{formatDate(c.at)}</span>
              </div>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
        <form className="comment-form" onSubmit={handleAddComment}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="เพิ่มความคิดเห็นหรือบันทึกการทำงาน..."
            rows={2}
          />
          <button type="submit" className="btn btn-primary">ส่ง</button>
        </form>
      </div>
    </div>
  )
}
