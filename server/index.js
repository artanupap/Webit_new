import express from 'express'
import cors from 'cors'
import db, { SLA_HOURS } from './db.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '6mb' }))

const hour = 60 * 60 * 1000

const PORT = process.env.PORT || 4000

function departmentPublic(d) {
  if (!d) return null
  return {
    id: d.id,
    company: d.company,
    name: d.name,
    phoneInternal: d.phone_internal,
    phoneExternal: d.phone_external,
  }
}

function getDepartment(id) {
  if (!id) return null
  return departmentPublic(db.prepare('SELECT * FROM departments WHERE id = ?').get(id))
}

function userPublic(u) {
  if (!u) return null
  const { password, department_id, ...rest } = u
  return { ...rest, department: getDepartment(department_id) }
}

function getTicketFull(id) {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) return null
  const history = db
    .prepare('SELECT at, by_user AS by, action FROM ticket_history WHERE ticket_id = ? ORDER BY at ASC')
    .all(id)
  const comments = db
    .prepare('SELECT at, by_user AS by, text FROM ticket_comments WHERE ticket_id = ? ORDER BY at ASC')
    .all(id)
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    location: ticket.location,
    createdBy: ticket.created_by,
    assignedTo: ticket.assigned_to,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    dueAt: ticket.due_at,
    rating: ticket.rating,
    attachment: ticket.attachment,
    department: getDepartment(ticket.department_id),
    signature: ticket.signature,
    history,
    comments,
  }
}

function allTicketsFull() {
  const ids = db.prepare('SELECT id FROM tickets ORDER BY created_at DESC').all().map((r) => r.id)
  return ids.map(getTicketFull)
}

// ---------- Auth ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
  if (!user) return res.status(401).json({ ok: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
  res.json({ ok: true, user: userPublic(user) })
})

// ---------- Departments ----------
app.get('/api/departments', (_req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY company, name').all().map(departmentPublic)
  res.json(departments)
})

app.post('/api/departments', (req, res) => {
  const { company, name, phoneInternal, phoneExternal } = req.body
  if (!company || !name) {
    return res.status(400).json({ ok: false, message: 'กรุณากรอกชื่อบริษัทและชื่อแผนก' })
  }
  const id = 'dep-' + Date.now()
  db.prepare(
    'INSERT INTO departments (id, company, name, phone_internal, phone_external) VALUES (?, ?, ?, ?, ?)'
  ).run(id, company, name, phoneInternal || null, phoneExternal || null)
  res.status(201).json(getDepartment(id))
})

app.put('/api/departments/:id', (req, res) => {
  const { id } = req.params
  const { company, name, phoneInternal, phoneExternal } = req.body
  const existing = db.prepare('SELECT id FROM departments WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ ok: false, message: 'ไม่พบแผนกนี้' })
  if (!company || !name) {
    return res.status(400).json({ ok: false, message: 'กรุณากรอกชื่อบริษัทและชื่อแผนก' })
  }
  db.prepare('UPDATE departments SET company = ?, name = ?, phone_internal = ?, phone_external = ? WHERE id = ?').run(
    company, name, phoneInternal || null, phoneExternal || null, id
  )
  res.json(getDepartment(id))
})

app.delete('/api/departments/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM departments WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ ok: false, message: 'ไม่พบแผนกนี้' })

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users WHERE department_id = ?').get(id).c
  if (userCount > 0) {
    return res.status(409).json({
      ok: false,
      message: `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งาน ${userCount} คนอยู่ในแผนกนี้`,
    })
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(id)
  res.json({ ok: true })
})

// ---------- Companies (grouping of departments) ----------
app.put('/api/companies', (req, res) => {
  const { oldName, newName } = req.body
  if (!oldName || !newName) return res.status(400).json({ ok: false, message: 'กรุณากรอกชื่อบริษัท' })
  const count = db.prepare('SELECT COUNT(*) AS c FROM departments WHERE company = ?').get(oldName).c
  if (count === 0) return res.status(404).json({ ok: false, message: 'ไม่พบบริษัทนี้' })
  db.prepare('UPDATE departments SET company = ? WHERE company = ?').run(newName, oldName)
  res.json({ ok: true })
})

app.delete('/api/companies', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ ok: false, message: 'กรุณาระบุชื่อบริษัท' })
  const deptIds = db.prepare('SELECT id FROM departments WHERE company = ?').all(name).map((r) => r.id)
  if (deptIds.length === 0) return res.status(404).json({ ok: false, message: 'ไม่พบบริษัทนี้' })

  const placeholders = deptIds.map(() => '?').join(',')
  const userCount = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE department_id IN (${placeholders})`)
    .get(...deptIds).c
  if (userCount > 0) {
    return res.status(409).json({
      ok: false,
      message: `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งาน ${userCount} คนสังกัดอยู่ในบริษัทนี้`,
    })
  }

  db.prepare('DELETE FROM departments WHERE company = ?').run(name)
  res.json({ ok: true })
})

// ---------- Users ----------
app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT * FROM users').all().map(userPublic)
  res.json(users)
})

app.post('/api/users', (req, res) => {
  const { name, username, password, role, departmentId } = req.body
  if (!name || !username || !password || !role || !departmentId) {
    return res.status(400).json({ ok: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (exists) return res.status(409).json({ ok: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' })
  const id = 'u-' + Date.now()
  db.prepare(
    'INSERT INTO users (id, username, password, name, role, department_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, username, password, name, role, departmentId)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  res.status(201).json(userPublic(user))
})

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params
  const { name, username, role, departmentId, password } = req.body
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้งาน' })
  if (!name || !username || !role || !departmentId) {
    return res.status(400).json({ ok: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
  }
  const dupe = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id)
  if (dupe) return res.status(409).json({ ok: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' })

  db.prepare('UPDATE users SET name = ?, username = ?, role = ?, department_id = ? WHERE id = ?').run(
    name, username, role, departmentId, id
  )
  if (password && password.trim()) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password.trim(), id)
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  res.json(userPublic(user))
})

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้งาน' })

  const refCount = db
    .prepare('SELECT COUNT(*) AS c FROM tickets WHERE created_by = ? OR assigned_to = ?')
    .get(id, id).c
  if (refCount > 0) {
    return res.status(409).json({
      ok: false,
      message: `ไม่สามารถลบได้ เนื่องจากผู้ใช้นี้เกี่ยวข้องกับตั๋วแจ้งซ่อม ${refCount} รายการ`,
    })
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  res.json({ ok: true })
})

// ---------- Tickets ----------
app.get('/api/tickets', (_req, res) => {
  res.json(allTicketsFull())
})

app.post('/api/tickets', (req, res) => {
  const { title, description, category, priority, location, createdBy, attachment } = req.body
  if (!title || !description || !category || !priority || !location || !createdBy) {
    return res.status(400).json({ ok: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
  }
  const creator = db.prepare('SELECT department_id FROM users WHERE id = ?').get(createdBy)
  const newId = 'T-' + (Date.now() % 1000000)
  const now = Date.now()
  const dueAt = now + (SLA_HOURS[priority] || SLA_HOURS.medium) * hour

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO tickets (id, title, description, category, priority, status, location, created_by, assigned_to, created_at, updated_at, due_at, attachment, department_id)
       VALUES (?, ?, ?, ?, ?, 'new', ?, ?, NULL, ?, ?, ?, ?, ?)`
    ).run(newId, title, description, category, priority, location, createdBy, now, now, dueAt, attachment || null, creator?.department_id || null)
    db.prepare('INSERT INTO ticket_history (ticket_id, at, by_user, action) VALUES (?, ?, ?, ?)').run(
      newId, now, createdBy, 'สร้างตั๋วแจ้งซ่อม'
    )
  })
  insert()
  res.status(201).json(getTicketFull(newId))
})

app.patch('/api/tickets/:id/rating', (req, res) => {
  const { id } = req.params
  const { rating } = req.body
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ ok: false, message: 'คะแนนต้องอยู่ระหว่าง 1-5' })
  }
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id)
  if (!ticket) return res.status(404).json({ ok: false, message: 'ไม่พบตั๋วแจ้งซ่อม' })
  db.prepare('UPDATE tickets SET rating = ? WHERE id = ?').run(rating, id)
  res.json(getTicketFull(id))
})

app.patch('/api/tickets/:id/signature', (req, res) => {
  const { id } = req.params
  const { signature } = req.body
  if (!signature) return res.status(400).json({ ok: false, message: 'ไม่พบข้อมูลลายเซ็น' })
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id)
  if (!ticket) return res.status(404).json({ ok: false, message: 'ไม่พบตั๋วแจ้งซ่อม' })
  db.prepare('UPDATE tickets SET signature = ? WHERE id = ?').run(signature, id)
  res.json(getTicketFull(id))
})

app.patch('/api/tickets/:id/assign', (req, res) => {
  const { id } = req.params
  const { technicianId, byUserId, technicianName } = req.body
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id)
  if (!ticket) return res.status(404).json({ ok: false, message: 'ไม่พบตั๋วแจ้งซ่อม' })
  const now = Date.now()
  const update = db.transaction(() => {
    db.prepare("UPDATE tickets SET assigned_to = ?, status = 'assigned', updated_at = ? WHERE id = ?").run(
      technicianId, now, id
    )
    db.prepare('INSERT INTO ticket_history (ticket_id, at, by_user, action) VALUES (?, ?, ?, ?)').run(
      id, now, byUserId, `มอบหมายงานให้ ${technicianName}`
    )
  })
  update()
  res.json(getTicketFull(id))
})

app.patch('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params
  const { status, byUserId, statusLabel } = req.body
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id)
  if (!ticket) return res.status(404).json({ ok: false, message: 'ไม่พบตั๋วแจ้งซ่อม' })
  const now = Date.now()
  const update = db.transaction(() => {
    db.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id)
    db.prepare('INSERT INTO ticket_history (ticket_id, at, by_user, action) VALUES (?, ?, ?, ?)').run(
      id, now, byUserId, `อัปเดตสถานะเป็น "${statusLabel}"`
    )
  })
  update()
  res.json(getTicketFull(id))
})

app.post('/api/tickets/:id/comments', (req, res) => {
  const { id } = req.params
  const { byUserId, text } = req.body
  if (!text || !text.trim()) return res.status(400).json({ ok: false, message: 'กรุณากรอกข้อความ' })
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id)
  if (!ticket) return res.status(404).json({ ok: false, message: 'ไม่พบตั๋วแจ้งซ่อม' })
  const now = Date.now()
  const update = db.transaction(() => {
    db.prepare('INSERT INTO ticket_comments (ticket_id, at, by_user, text) VALUES (?, ?, ?, ?)').run(
      id, now, byUserId, text.trim()
    )
    db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, id)
  })
  update()
  res.json(getTicketFull(id))
})

app.listen(PORT, () => {
  console.log(`IT Support API listening on http://localhost:${PORT}`)
})
