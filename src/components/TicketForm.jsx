import { useState } from 'react'
import { categories, priorities } from '../data/seed'
import { useAuth } from '../context/AuthContext'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

export default function TicketForm({ onSubmit, onCancel }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0],
    priority: 'medium',
    location: '',
    attachment: null,
  })
  const [attachmentName, setAttachmentName] = useState('')
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, attachment: 'ไฟล์ต้องมีขนาดไม่เกิน 3MB' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update('attachment', reader.result)
      setAttachmentName(file.name)
      setErrors((prev) => ({ ...prev, attachment: undefined }))
    }
    reader.readAsDataURL(file)
  }

  function removeAttachment() {
    update('attachment', null)
    setAttachmentName('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) errs.title = 'กรุณากรอกหัวข้อปัญหา'
    if (!form.description.trim()) errs.description = 'กรุณาอธิบายรายละเอียดปัญหา'
    if (!form.location.trim()) errs.location = 'กรุณาระบุสถานที่'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit(form)
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      {currentUser?.department && (
        <div className="department-auto-box">
          <span className="department-auto-label">แผนกผู้แจ้ง (ระบุอัตโนมัติ)</span>
          <strong>{currentUser.department.company} · {currentUser.department.name}</strong>
          <span>เบอร์ภายใน {currentUser.department.phoneInternal || '-'} · เบอร์ภายนอก {currentUser.department.phoneExternal || '-'}</span>
        </div>
      )}

      <label>
        หัวข้อปัญหา
        <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด" />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </label>

      <label>
        รายละเอียดปัญหา
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="อธิบายอาการ / ปัญหาที่พบโดยละเอียด"
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </label>

      <div className="form-grid-2">
        <label>
          หมวดหมู่
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          ระดับความเร่งด่วน
          <select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <label>
        สถานที่ / ห้อง / อาคาร
        <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="เช่น อาคาร A ชั้น 3 ห้องบัญชี" />
        {errors.location && <span className="field-error">{errors.location}</span>}
      </label>

      <label>
        แนบรูปภาพ (ถ้ามี)
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {attachmentName && (
          <span className="attachment-chip">
            📎 {attachmentName}
            <button type="button" onClick={removeAttachment}>✕</button>
          </span>
        )}
        {errors.attachment && <span className="field-error">{errors.attachment}</span>}
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>ยกเลิก</button>
        <button type="submit" className="btn btn-primary">ส่งแจ้งซ่อม</button>
      </div>
    </form>
  )
}
