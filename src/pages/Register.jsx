import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const emptyForm = { name: '', username: '', password: '', company: '', departmentId: '' }

export default function Register() {
  const { departments, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const companies = useMemo(() => [...new Set(departments.map((d) => d.company))], [departments])
  const departmentOptions = useMemo(
    () => departments.filter((d) => d.company === form.company),
    [departments, form.company]
  )

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateCompany(company) {
    setForm((prev) => ({ ...prev, company, departmentId: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.username || !form.password || !form.company || !form.departmentId) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    setLoading(true)
    try {
      await register(form)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />
      <div className="login-shell">
        <div className="login-brand-panel">
          <div className="login-brand-top">
            <span className="login-logo">🛠️</span>
            <div>
              <div className="login-brand-title">IT Support</div>
              <div className="login-brand-sub">Enterprise Service Desk</div>
            </div>
          </div>

          <h1>สมัครใช้งานระบบแจ้งซ่อม IT</h1>
          <p className="login-brand-lead">
            กรอกข้อมูลของคุณเพื่อขอสิทธิ์ใช้งานระบบ คำขอของคุณจะถูกส่งให้ผู้บริหารตรวจสอบและอนุมัติก่อนจึงจะเข้าสู่ระบบได้
          </p>

          <div className="login-bottom-group">
            <ul className="login-highlights">
              <li>
                <span className="login-highlight-icon"><Icon name="clipboard" size={17} /></span>
                <div>
                  <strong>กรอกข้อมูลเบื้องต้น</strong>
                  <span>ชื่อ-สกุล ชื่อผู้ใช้ รหัสผ่าน และแผนกที่สังกัด</span>
                </div>
              </li>
              <li>
                <span className="login-highlight-icon"><Icon name="clock" size={17} /></span>
                <div>
                  <strong>รอการตรวจสอบ</strong>
                  <span>ผู้บริหารจะพิจารณาอนุมัติคำขอของคุณ</span>
                </div>
              </li>
              <li>
                <span className="login-highlight-icon"><Icon name="check" size={17} /></span>
                <div>
                  <strong>เริ่มใช้งานได้ทันที</strong>
                  <span>เมื่อได้รับการอนุมัติ ใช้ชื่อผู้ใช้และรหัสผ่านที่ตั้งไว้เข้าสู่ระบบได้เลย</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-card">
            {submitted ? (
              <div className="register-success">
                <div className="register-success-icon"><Icon name="check" size={26} /></div>
                <h2>ส่งคำขอสมัครเรียบร้อยแล้ว</h2>
                <p className="login-form-sub">
                  กรุณารอผู้บริหารอนุมัติคำขอของคุณ เมื่ออนุมัติแล้วจะสามารถเข้าสู่ระบบด้วยชื่อผู้ใช้ที่ตั้งไว้ได้ทันที
                </p>
                <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            ) : (
              <>
                <h2>สมัครใช้งาน</h2>
                <p className="login-form-sub">กรอกข้อมูลเพื่อส่งคำขอใช้งานระบบ</p>

                <form onSubmit={handleSubmit} className="login-form">
                  <label>
                    ชื่อ-สกุล
                    <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="กรอกชื่อ-สกุล" autoFocus />
                  </label>
                  <label>
                    ชื่อผู้ใช้
                    <input value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="กรอกชื่อผู้ใช้" />
                  </label>
                  <label>
                    รหัสผ่าน
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="ตั้งรหัสผ่าน"
                    />
                  </label>
                  <div className="form-grid-2">
                    <label>
                      บริษัท
                      <select value={form.company} onChange={(e) => updateCompany(e.target.value)}>
                        <option value="">-- เลือกบริษัท --</option>
                        {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label>
                      แผนก/ฝ่าย
                      <select
                        value={form.departmentId}
                        onChange={(e) => update('departmentId', e.target.value)}
                        disabled={!form.company}
                      >
                        <option value="">-- เลือกแผนก --</option>
                        {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </label>
                  </div>
                  {error && <div className="form-error">{error}</div>}
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอสมัคร'}
                  </button>
                </form>

                <div className="login-divider"><span>มีบัญชีอยู่แล้ว?</span></div>
                <Link to="/login" className="btn btn-ghost btn-block register-back-link">เข้าสู่ระบบ</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
