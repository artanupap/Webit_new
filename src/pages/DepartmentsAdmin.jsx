import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import Icon from '../components/Icon'

const emptyDeptForm = { company: '', name: '', phoneInternal: '', phoneExternal: '' }

export default function DepartmentsAdmin() {
  const { departments, addDepartment, updateDepartment, deleteDepartment, renameCompany, deleteCompany } = useAuth()
  const { showToast } = useToast()

  const [activeCompany, setActiveCompany] = useState(null)

  const [showDeptForm, setShowDeptForm] = useState(false)
  const [editingDeptId, setEditingDeptId] = useState(null)
  const [deptForm, setDeptForm] = useState(emptyDeptForm)
  const [deptError, setDeptError] = useState('')
  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null)

  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [editingCompanyName, setEditingCompanyName] = useState(null)
  const [companyNameInput, setCompanyNameInput] = useState('')
  const [companyError, setCompanyError] = useState('')
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState(null)

  const companies = useMemo(() => {
    const map = new Map()
    departments.forEach((d) => {
      if (!map.has(d.company)) map.set(d.company, [])
      map.get(d.company).push(d)
    })
    return [...map.entries()].map(([company, depts]) => ({ company, departments: depts }))
  }, [departments])

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.company === activeCompany),
    [departments, activeCompany]
  )

  // ---------- Company handlers ----------
  function openAddCompany() {
    setEditingCompanyName(null)
    setCompanyNameInput('')
    setCompanyError('')
    setShowCompanyForm(true)
  }

  function openEditCompany(company) {
    setEditingCompanyName(company)
    setCompanyNameInput(company)
    setCompanyError('')
    setShowCompanyForm(true)
  }

  async function handleCompanySubmit(e) {
    e.preventDefault()
    const name = companyNameInput.trim()
    if (!name) {
      setCompanyError('กรุณากรอกชื่อบริษัท')
      return
    }
    if (editingCompanyName) {
      try {
        await renameCompany(editingCompanyName, name)
        if (activeCompany === editingCompanyName) setActiveCompany(name)
        showToast('แก้ไขชื่อบริษัทเรียบร้อยแล้ว', 'success')
        setShowCompanyForm(false)
      } catch (err) {
        setCompanyError(err.message)
      }
    } else {
      // A company only exists once it has at least one department, so continue straight into that form.
      setShowCompanyForm(false)
      setEditingDeptId(null)
      setDeptForm({ ...emptyDeptForm, company: name })
      setDeptError('')
      setShowDeptForm(true)
    }
  }

  async function handleDeleteCompany() {
    try {
      await deleteCompany(deleteCompanyTarget)
      showToast('ลบบริษัทเรียบร้อยแล้ว', 'success')
      if (activeCompany === deleteCompanyTarget) setActiveCompany(null)
      setDeleteCompanyTarget(null)
    } catch (err) {
      showToast(err.message, 'error')
      setDeleteCompanyTarget(null)
    }
  }

  // ---------- Department handlers ----------
  function updateDeptField(field, value) {
    setDeptForm((prev) => ({ ...prev, [field]: value }))
  }

  function openAddDept() {
    setEditingDeptId(null)
    setDeptForm({ ...emptyDeptForm, company: activeCompany || '' })
    setDeptError('')
    setShowDeptForm(true)
  }

  function openEditDept(d) {
    setEditingDeptId(d.id)
    setDeptForm({ company: d.company, name: d.name, phoneInternal: d.phoneInternal || '', phoneExternal: d.phoneExternal || '' })
    setDeptError('')
    setShowDeptForm(true)
  }

  async function handleDeptSubmit(e) {
    e.preventDefault()
    if (!deptForm.company.trim() || !deptForm.name.trim()) {
      setDeptError('กรุณากรอกชื่อบริษัทและชื่อแผนก')
      return
    }
    try {
      if (editingDeptId) {
        await updateDepartment(editingDeptId, deptForm)
        showToast('แก้ไขข้อมูลแผนกเรียบร้อยแล้ว', 'success')
      } else {
        await addDepartment(deptForm)
        showToast('เพิ่มแผนกใหม่เรียบร้อยแล้ว', 'success')
        setActiveCompany(deptForm.company.trim())
      }
      setDeptForm(emptyDeptForm)
      setDeptError('')
      setShowDeptForm(false)
      setEditingDeptId(null)
    } catch (err) {
      setDeptError(err.message)
    }
  }

  async function handleDeleteDept() {
    try {
      await deleteDepartment(deleteDeptTarget.id)
      showToast('ลบแผนกเรียบร้อยแล้ว', 'success')
      setDeleteDeptTarget(null)
    } catch (err) {
      showToast(err.message, 'error')
      setDeleteDeptTarget(null)
    }
  }

  const deptModals = (
    <>
      <Modal open={showDeptForm} onClose={() => setShowDeptForm(false)} title={editingDeptId ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่'}>
        <form className="ticket-form" onSubmit={handleDeptSubmit}>
          <label>ชื่อบริษัท
            <input value={deptForm.company} onChange={(e) => updateDeptField('company', e.target.value)} placeholder="เช่น บริษัท ตัวอย่าง จำกัด" />
          </label>
          <label>ชื่อแผนก
            <input value={deptForm.name} onChange={(e) => updateDeptField('name', e.target.value)} placeholder="เช่น ฝ่ายการตลาด" />
          </label>
          <div className="form-grid-2">
            <label>เบอร์ภายใน
              <input value={deptForm.phoneInternal} onChange={(e) => updateDeptField('phoneInternal', e.target.value)} placeholder="เช่น 1501" />
            </label>
            <label>เบอร์ภายนอก
              <input value={deptForm.phoneExternal} onChange={(e) => updateDeptField('phoneExternal', e.target.value)} placeholder="เช่น 02-123-4504" />
            </label>
          </div>
          {deptError && <div className="form-error">{deptError}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowDeptForm(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">{editingDeptId ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteDeptTarget} onClose={() => setDeleteDeptTarget(null)} title="ยืนยันการลบแผนก">
        <div className="confirm-body">
          <p>คุณต้องการลบแผนก <strong>{deleteDeptTarget?.name}</strong> ({deleteDeptTarget?.company}) ใช่หรือไม่?</p>
          <p className="confirm-hint">การลบไม่สามารถย้อนกลับได้</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteDeptTarget(null)}>ยกเลิก</button>
            <button className="btn btn-danger" onClick={handleDeleteDept}>ลบแผนก</button>
          </div>
        </div>
      </Modal>
    </>
  )

  if (activeCompany) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <button className="btn btn-ghost back-link" onClick={() => setActiveCompany(null)}>← กลับไปหน้าบริษัททั้งหมด</button>
            <h1>{activeCompany}</h1>
            <p className="page-subtitle">แผนกทั้งหมดในบริษัทนี้ ({activeDepartments.length} แผนก)</p>
          </div>
          <button className="btn btn-primary" onClick={openAddDept}>+ เพิ่มแผนกใหม่</button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>แผนก</th>
                <th>เบอร์ภายใน</th>
                <th>เบอร์ภายนอก</th>
                <th className="col-actions">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {activeDepartments.length === 0 && (
                <tr><td colSpan={4} className="empty-hint">ยังไม่มีแผนกในบริษัทนี้</td></tr>
              )}
              {activeDepartments.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.phoneInternal || '-'}</td>
                  <td>{d.phoneExternal || '-'}</td>
                  <td className="col-actions">
                    <div className="row-actions">
                      <button className="icon-btn" title="แก้ไข" onClick={() => openEditDept(d)}>✏️</button>
                      <button className="icon-btn icon-btn-danger" title="ลบ" onClick={() => setDeleteDeptTarget(d)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deptModals}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>จัดการบริษัท / แผนก</h1>
          <p className="page-subtitle">เลือกบริษัทเพื่อดูและจัดการแผนกภายใน</p>
        </div>
        <button className="btn btn-primary" onClick={openAddCompany}>+ เพิ่มบริษัทใหม่</button>
      </div>

      <div className="company-grid">
        {companies.length === 0 && <div className="empty-hint">ยังไม่มีบริษัทในระบบ</div>}
        {companies.map(({ company, departments: depts }) => (
          <div key={company} className="company-card" onClick={() => setActiveCompany(company)}>
            <div className="company-card-icon"><Icon name="building" size={20} /></div>
            <div className="company-card-body">
              <strong>{company}</strong>
              <span>{depts.length} แผนก</span>
            </div>
            <div className="row-actions company-card-actions" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" title="แก้ไขชื่อบริษัท" onClick={() => openEditCompany(company)}>✏️</button>
              <button className="icon-btn icon-btn-danger" title="ลบบริษัท" onClick={() => setDeleteCompanyTarget(company)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCompanyForm} onClose={() => setShowCompanyForm(false)} title={editingCompanyName ? 'แก้ไขชื่อบริษัท' : 'เพิ่มบริษัทใหม่'}>
        <form className="ticket-form" onSubmit={handleCompanySubmit}>
          <label>ชื่อบริษัท
            <input value={companyNameInput} onChange={(e) => setCompanyNameInput(e.target.value)} placeholder="เช่น บริษัท ตัวอย่าง จำกัด" autoFocus />
          </label>
          {!editingCompanyName && <p className="signature-hint">ขั้นต่อไปจะให้เพิ่มแผนกแรกของบริษัทนี้ทันที</p>}
          {companyError && <div className="form-error">{companyError}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowCompanyForm(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">{editingCompanyName ? 'บันทึกการแก้ไข' : 'ถัดไป'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteCompanyTarget} onClose={() => setDeleteCompanyTarget(null)} title="ยืนยันการลบบริษัท">
        <div className="confirm-body">
          <p>คุณต้องการลบบริษัท <strong>{deleteCompanyTarget}</strong> พร้อมแผนกทั้งหมดในบริษัทนี้ใช่หรือไม่?</p>
          <p className="confirm-hint">การลบไม่สามารถย้อนกลับได้ และจะไม่สามารถลบได้หากมีผู้ใช้งานสังกัดอยู่ในแผนกใดแผนกหนึ่ง</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteCompanyTarget(null)}>ยกเลิก</button>
            <button className="btn btn-danger" onClick={handleDeleteCompany}>ลบบริษัท</button>
          </div>
        </div>
      </Modal>

      {deptModals}
    </div>
  )
}
