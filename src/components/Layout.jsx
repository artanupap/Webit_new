import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const roleLabels = {
  admin: 'ผู้บริหาร / Admin',
  technician: 'ช่างเทคนิค',
  user: 'ผู้ใช้งาน',
}

function initials(name = '') {
  const parts = name.trim().split(' ')
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

export default function Layout({ children }) {
  const { currentUser, logout, registrations } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pendingCount = registrations.filter((r) => r.status === 'pending').length

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = []
  if (currentUser?.role === 'user') {
    navItems.push({ to: '/', label: 'แจ้งซ่อม / ตั๋วของฉัน', short: 'หน้าหลัก', icon: 'dashboard' })
  }
  if (currentUser?.role === 'technician') {
    navItems.push({ to: '/', label: 'งานที่ได้รับมอบหมาย', short: 'งานของฉัน', icon: 'dashboard' })
  }
  if (currentUser?.role === 'admin') {
    navItems.push({ to: '/', label: 'ภาพรวมทั้งหมด', short: 'ภาพรวม', icon: 'dashboard' })
    navItems.push({ to: '/users', label: 'จัดการผู้ใช้', short: 'ผู้ใช้', icon: 'users' })
    navItems.push({ to: '/departments', label: 'จัดการบริษัท/แผนก', short: 'แผนก', icon: 'building' })
    navItems.push({ to: '/registrations', label: 'คำขอสมัครสมาชิก', short: 'คำขอ', icon: 'inbox', badge: pendingCount })
    navItems.push({ to: '/reports', label: 'รายงาน', short: 'รายงาน', icon: 'chart' })
  }

  const currentNav = navItems.find((n) => n.to === location.pathname) || navItems[0]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo"><Icon name="wrench" size={20} /></span>
          <div className="sidebar-brand-text">
            <strong>IT Support</strong>
            <span>ระบบแจ้งซ่อมองค์กร</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            >
              <span className="sidebar-icon-chip"><Icon name={item.icon} size={17} /></span>
              {item.label}
              {!!item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-help">
          <div className="sidebar-help-icon"><Icon name="help" size={18} /></div>
          <strong>ต้องการความช่วยเหลือ?</strong>
          <p>ติดต่อทีม IT Support ภายในองค์กร</p>
          <div className="sidebar-help-phone">☎ ต่อ 2210</div>
        </div>
      </aside>

      <div className="app-content-col">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-mobile-brand">
              <span className="sidebar-logo sm"><Icon name="wrench" size={16} /></span>
              IT Support
            </span>
            <nav className="breadcrumb">
              <span className="breadcrumb-root">หน้าหลัก</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{currentNav?.label}</span>
            </nav>
          </div>
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">{initials(currentUser?.name)}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{currentUser?.name}</span>
                <span className="topbar-user-role">{roleLabels[currentUser?.role]}</span>
              </div>
            </div>
            <button className="btn btn-ghost topbar-logout" onClick={handleLogout}>ออกจากระบบ</button>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
          >
            <span className="bottom-nav-icon">
              <Icon name={item.icon} size={20} />
              {!!item.badge && <span className="bottom-nav-badge">{item.badge}</span>}
            </span>
            <span className="bottom-nav-label">{item.short}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-link bottom-nav-logout" onClick={handleLogout}>
          <span className="bottom-nav-icon"><Icon name="logout" size={20} /></span>
          <span className="bottom-nav-label">ออก</span>
        </button>
      </nav>
    </div>
  )
}
