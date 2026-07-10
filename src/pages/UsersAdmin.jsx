import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import Icon from '../components/Icon'

const ROLE_META = {
  admin: { label: 'ผู้บริหาร/Admin', icon: 'chart' },
  technician: { label: 'ช่างเทคนิค', icon: 'wrench' },
  user: { label: 'ผู้ใช้งาน', icon: 'users' },
}
const ROLE_ORDER = ['admin', 'technician', 'user']
const emptyForm = { name: '', username: '', password: '', role: 'user', company: '', departmentId: '' }

export default function UsersAdmin() {
  const { users, departments, currentUser, addUser, updateUser, deleteUser } = useAuth()
  const { showToast } = useToast()

  const [activeRole, setActiveRole] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isEditing = editingId !== null
  const companies = useMemo(() => [...new Set(departments.map((d) => d.company))], [departments])
  const departmentsForCompany = useMemo(
    () => departments.filter((d) => d.company === form.company),
    [departments, form.company]
  )

  const roleGroups = useMemo(() => {
    const counts = { admin: 0, technician: 0, user: 0 }
    users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1 })
    return ROLE_ORDER.map((role) => ({ role, ...ROLE_META[role], count: counts[role] }))
  }, [users])

  const roleUsers = useMemo(() => {
    if (!activeRole) return []
    return users.filter(
      (u) =>
        u.role === activeRole &&
        (u.name.includes(search) ||
          u.username.includes(search) ||
          u.department?.name.includes(search) ||
          u.department?.company.includes(search))
    )
  }, [users, activeRole, search])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateCompany(company) {
    setForm((prev) => ({ ...prev, company, departmentId: '' }))
  }

  function openAdd() {
    setEditingId(null)
    setForm({ ...emptyForm, role: activeRole || 'user' })
    setError('')
    setShowForm(true)
  }

  function openEdit(u) {
    setEditingId(u.id)
    setForm({
      name: u.name,
      username: u.username,
      password: '',
      role: u.role,
      company: u.department?.company || '',
      departmentId: u.department?.id || '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.username || !form.company || !form.departmentId || (!isEditing && !form.password)) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    try {
      if (isEditing) {
        await updateUser(editingId, form)
        showToast('แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว', 'success')
      } else {
        await addUser(form)
        showToast('เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว', 'success')
        setActiveRole(form.role)
      }
      setForm(emptyForm)
      setError('')
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    try {
      await deleteUser(deleteTarget.id)
      showToast('ลบผู้ใช้เรียบร้อยแล้ว', 'success')
      setDeleteTarget(null)
    } catch (err) {
      showToast(err.message, 'error')
      setDeleteTarget(null)
    }
  }

  const modals = (
    <>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={isEditing ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}>
        <form className="ticket-form" onSubmit={handleSubmit}>
          <label>ชื่อ-สกุล
            <input value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <div className="form-grid-2">
            <label>ชื่อผู้ใช้
              <input value={form.username} onChange={(e) => update('username', e.target.value)} />
            </label>
            <label>{isEditing ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน'}
              <input
                type="text"
                value={form.password}
                placeholder={isEditing ? 'เว้นว่างหากไม่เปลี่ยน' : ''}
                onChange={(e) => update('password', e.target.value)}
              />
            </label>
          </div>
          <label>บทบาท
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="user">ผู้ใช้งาน</option>
              <option value="technician">ช่างเทคนิค</option>
              <option value="admin">ผู้บริหาร/Admin</option>
            </select>
          </label>
          <div className="form-grid-2">
            <label>บริษัท
              <select value={form.company} onChange={(e) => updateCompany(e.target.value)}>
                <option value="">-- เลือกบริษัท --</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>แผนก/ฝ่าย
              <select
                value={form.departmentId}
                onChange={(e) => update('departmentId', e.target.value)}
                disabled={!form.company}
              >
                <option value="">-- เลือกแผนก --</option>
                {departmentsForCompany.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบผู้ใช้">
        <div className="confirm-body">
          <p>คุณต้องการลบผู้ใช้ <strong>{deleteTarget?.name}</strong> ({deleteTarget?.username}) ใช่หรือไม่?</p>
          <p className="confirm-hint">การลบไม่สามารถย้อนกลับได้</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</button>
            <button className="btn btn-danger" onClick={handleDelete}>ลบผู้ใช้</button>
          </div>
        </div>
      </Modal>
    </>
  )

  if (activeRole) {
    const meta = ROLE_META[activeRole]
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <button className="btn btn-ghost back-link" onClick={() => { setActiveRole(null); setSearch('') }}>← กลับไปหน้าบทบาททั้งหมด</button>
            <h1>{meta.label}</h1>
            <p className="page-subtitle">รายชื่อผู้ใช้ในบทบาทนี้ ({roleUsers.length} คน)</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มผู้ใช้ใหม่</button>
        </div>

        <div className="filter-row">
          <input
            className="search-input"
            placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, บริษัท หรือแผนก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ชื่อ-สกุล</th>
                <th>ชื่อผู้ใช้</th>
                <th>บริษัท</th>
                <th>แผนก/ฝ่าย</th>
                <th className="col-actions">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {roleUsers.length === 0 && (
                <tr><td colSpan={5} className="empty-hint">ไม่พบผู้ใช้ในบทบาทนี้</td></tr>
              )}
              {roleUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td>{u.department?.company || '-'}</td>
                  <td>{u.department?.name || '-'}</td>
                  <td className="col-actions">
                    <div className="row-actions">
                      <button className="icon-btn" title="แก้ไข" onClick={() => openEdit(u)}>✏️</button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title={u.id === currentUser.id ? 'ไม่สามารถลบบัญชีตนเองได้' : 'ลบ'}
                        disabled={u.id === currentUser.id}
                        onClick={() => setDeleteTarget(u)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modals}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>จัดการผู้ใช้งาน</h1>
          <p className="page-subtitle">เลือกบทบาทเพื่อดูและจัดการผู้ใช้ในกลุ่มนั้น</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มผู้ใช้ใหม่</button>
      </div>

      <div className="company-grid">
        {roleGroups.map((g) => (
          <div key={g.role} className="company-card" onClick={() => setActiveRole(g.role)}>
            <div className={`company-card-icon role-icon-${g.role}`}><Icon name={g.icon} size={20} /></div>
            <div className="company-card-body">
              <strong>{g.label}</strong>
              <span>{g.count} คน</span>
            </div>
          </div>
        ))}
      </div>

      {modals}
    </div>
  )
}
