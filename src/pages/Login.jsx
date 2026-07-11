import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const highlights = [
  { icon: 'inbox', title: 'แจ้งซ่อมได้ทันที', desc: 'ส่งคำร้องพร้อมระบุความเร่งด่วนและสถานที่ในไม่กี่คลิก' },
  { icon: 'clock', title: 'ติดตามสถานะแบบเรียลไทม์', desc: 'ดูความคืบหน้าและประวัติการดำเนินงานได้ตลอดเวลา' },
  { icon: 'chart', title: 'รายงานเชิงบริหาร', desc: 'สรุปผลการทำงานของทีมช่างสำหรับผู้บริหารตัดสินใจ' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const result = await login(username.trim(), password)
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate('/')
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

          <h1>ระบบแจ้งซ่อมและบริหารจัดการงาน IT</h1>
          <p className="login-brand-lead">
            แพลตฟอร์มกลางสำหรับพนักงาน ช่างเทคนิค และผู้บริหาร ในการแจ้งปัญหา ติดตามงาน และวิเคราะห์ประสิทธิภาพการให้บริการ
          </p>

          <div className="login-bottom-group">
            <ul className="login-highlights">
              {highlights.map((h) => (
                <li key={h.title}>
                  <span className="login-highlight-icon"><Icon name={h.icon} size={17} /></span>
                  <div>
                    <strong>{h.title}</strong>
                    <span>{h.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="login-cta-card">
              <div className="login-cta-icon"><Icon name="users" size={20} /></div>
              <div className="login-cta-text">
                <strong>ยังไม่มีบัญชีใช่ไหม?</strong>
                <span>สมัครใช้งานได้ทันที ระบบจะส่งคำขอให้ผู้บริหารตรวจสอบและอนุมัติก่อนเข้าใช้งาน</span>
              </div>
              <Link to="/register" className="btn btn-primary login-cta-btn">สมัครใช้งาน</Link>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-card">
            <h2>เข้าสู่ระบบ</h2>
            <p className="login-form-sub">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อดำเนินการต่อ</p>

            <form onSubmit={handleSubmit} className="login-form">
              <label>
                ชื่อผู้ใช้
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้"
                  autoFocus
                />
              </label>
              <label>
                รหัสผ่าน
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                />
              </label>
              {error && <div className="form-error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <p className="login-register-hint">
              ยังไม่มีบัญชี? <Link to="/register">สมัครใช้งาน</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
