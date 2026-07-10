import Icon from './Icon'

export default function StatCard({ icon, value, label, tone = 'primary', trend, onClick, active }) {
  const clickable = typeof onClick === 'function'
  return (
    <div
      className={`stat-card${clickable ? ' stat-card-clickable' : ''}${active ? ' stat-card-active' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
          <span className="stat-value">{value}</span>
          {trend && (
            <span className={`stat-trend ${trend.dir === 'down' ? 'down' : 'up'}`}>
              {trend.text}
            </span>
          )}
        </div>
      </div>
      <div className={`stat-chip stat-${tone}`}>
        <Icon name={icon} size={22} />
      </div>
    </div>
  )
}
