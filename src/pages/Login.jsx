import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const roleHints = [
  { role: 'ผู้ใช้งานทั่วไป', username: 'user1', password: 'user123', icon: 'users' },
  { role: 'ช่างเทคนิค', username: 'tech1', password: 'tech123', icon: 'wrench' },
  { role: 'ผู้บริหาร (Admin)', username: 'admin', password: 'admin123', icon: 'chart' },
]

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

  function fillDemo(h) {
    setUsername(h.username)
    setPassword(h.password)
    setError('')
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

            <div className="login-mock-card">
              <div className="login-mock-head">
                <span>ภาพรวมวันนี้</span>
                <span className="login-mock-live">● LIVE</span>
              </div>
              <div className="login-mock-stats">
                <div className="login-mock-stat">
                  <span className="login-mock-dot dot-blue" />
                  <strong>24</strong>
                  <small>ตั๋วทั้งหมด</small>
                </div>
                <div className="login-mock-stat">
                  <span className="login-mock-dot dot-green" />
                  <strong>18</strong>
                  <small>เสร็จสิ้น</small>
                </div>
                <div className="login-mock-stat">
                  <span className="login-mock-dot dot-amber" />
                  <strong>4.8</strong>
                  <small>ความพึงพอใจ</small>
                </div>
              </div>
              <svg className="login-mock-chart" viewBox="0 0 220 46" preserveAspectRatio="none">
                <polyline
                  points="0,36 30,30 55,34 80,18 110,24 140,10 170,16 200,6 220,12"
                  fill="none"
                  stroke="#7db8ff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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

            <div className="login-divider"><span>หรือทดลองใช้งานด่วน</span></div>

            <div className="login-demo-grid">
              {roleHints.map((h) => (
                <button key={h.role} type="button" className="login-demo-btn" onClick={() => fillDemo(h)}>
                  <span className="login-demo-icon"><Icon name={h.icon} size={16} /></span>
                  <span className="login-demo-text">
                    <strong>{h.role}</strong>
                    <small>{h.username} / {h.password}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
