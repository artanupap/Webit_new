import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'it_support.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  name TEXT NOT NULL,
  phone_internal TEXT,
  phone_external TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician', 'user')),
  department_id TEXT REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  location TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  assigned_to TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  due_at INTEGER,
  rating INTEGER,
  attachment TEXT,
  department_id TEXT REFERENCES departments(id),
  signature TEXT
);

CREATE TABLE IF NOT EXISTS ticket_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  at INTEGER NOT NULL,
  by_user TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  at INTEGER NOT NULL,
  by_user TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL
);
`)

// Migrate existing databases created before these columns/tables existed.
const ticketColumns = db.prepare('PRAGMA table_info(tickets)').all().map((c) => c.name)
if (!ticketColumns.includes('due_at')) db.exec('ALTER TABLE tickets ADD COLUMN due_at INTEGER')
if (!ticketColumns.includes('rating')) db.exec('ALTER TABLE tickets ADD COLUMN rating INTEGER')
if (!ticketColumns.includes('attachment')) db.exec('ALTER TABLE tickets ADD COLUMN attachment TEXT')
if (!ticketColumns.includes('department_id')) db.exec('ALTER TABLE tickets ADD COLUMN department_id TEXT')
if (!ticketColumns.includes('signature')) db.exec('ALTER TABLE tickets ADD COLUMN signature TEXT')

const userColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
const hadLegacyDepartmentText = userColumns.includes('department')
if (!userColumns.includes('department_id')) db.exec('ALTER TABLE users ADD COLUMN department_id TEXT')

export const SLA_HOURS = { urgent: 4, high: 8, medium: 24, low: 72 }
const hour = 60 * 60 * 1000
const DEFAULT_COMPANY = 'บริษัท ตัวอย่าง จำกัด'

const departmentSeeds = [
  { id: 'dep-exec', company: DEFAULT_COMPANY, name: 'ผู้บริหาร', phone_internal: '1001', phone_external: '02-123-4500' },
  { id: 'dep-it', company: DEFAULT_COMPANY, name: 'ฝ่าย IT', phone_internal: '2210', phone_external: '02-123-4503' },
  { id: 'dep-accounting', company: DEFAULT_COMPANY, name: 'ฝ่ายบัญชี', phone_internal: '1201', phone_external: '02-123-4501' },
  { id: 'dep-sales', company: DEFAULT_COMPANY, name: 'ฝ่ายขาย', phone_internal: '1301', phone_external: '02-123-4502' },
]

function seedDepartmentsIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM departments').get().c
  if (count > 0) return
  const insert = db.prepare(
    'INSERT INTO departments (id, company, name, phone_internal, phone_external) VALUES (@id, @company, @name, @phone_internal, @phone_external)'
  )
  const insertMany = db.transaction((rows) => rows.forEach((r) => insert.run(r)))
  insertMany(departmentSeeds)
}

seedDepartmentsIfEmpty()

// One-time fix: IT department's internal extension changed from 1401 to 2210.
db.prepare("UPDATE departments SET phone_internal = '2210' WHERE id = 'dep-it' AND phone_internal = '1401'").run()

// Best-effort migration: link existing users to a department by matching their old free-text department name,
// then drop the legacy NOT NULL `department` column so new inserts (which only set department_id) succeed.
if (hadLegacyDepartmentText) {
  const usersMissingDept = db.prepare('SELECT id, department FROM users WHERE department_id IS NULL').all()
  const departments = db.prepare('SELECT id, name FROM departments').all()
  const update = db.prepare('UPDATE users SET department_id = ? WHERE id = ?')
  for (const u of usersMissingDept) {
    const match = departments.find((d) => d.name === u.department)
    if (match) update.run(match.id, u.id)
  }
  db.exec('ALTER TABLE users DROP COLUMN department')
}

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (userCount > 0) return

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, name, role, department_id) VALUES (@id, @username, @password, @name, @role, @department_id)'
  )
  const users = [
    { id: 'u-admin', username: 'admin', password: 'admin123', name: 'ผู้บริหาร สมชาย', role: 'admin', department_id: 'dep-exec' },
    { id: 'u-tech1', username: 'tech1', password: 'tech123', name: 'ช่างสมศักดิ์ ใจดี', role: 'technician', department_id: 'dep-it' },
    { id: 'u-tech2', username: 'tech2', password: 'tech123', name: 'ช่างวิภา เก่งกาจ', role: 'technician', department_id: 'dep-it' },
    { id: 'u-user1', username: 'user1', password: 'user123', name: 'สมหญิง รักงาน', role: 'user', department_id: 'dep-accounting' },
    { id: 'u-user2', username: 'user2', password: 'user123', name: 'ประยุทธ ขยันดี', role: 'user', department_id: 'dep-sales' },
  ]
  const insertMany = db.transaction((rows) => rows.forEach((r) => insertUser.run(r)))
  insertMany(users)

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const insertTicket = db.prepare(
    `INSERT INTO tickets (id, title, description, category, priority, status, location, created_by, assigned_to, created_at, updated_at, due_at, rating, attachment, department_id, signature)
     VALUES (@id, @title, @description, @category, @priority, @status, @location, @created_by, @assigned_to, @created_at, @updated_at, @due_at, @rating, @attachment, @department_id, @signature)`
  )
  const insertHistory = db.prepare(
    'INSERT INTO ticket_history (ticket_id, at, by_user, action) VALUES (@ticket_id, @at, @by_user, @action)'
  )
  const insertComment = db.prepare(
    'INSERT INTO ticket_comments (ticket_id, at, by_user, text) VALUES (@ticket_id, @at, @by_user, @text)'
  )

  const tickets = [
    {
      id: 'T-1001',
      title: 'คอมพิวเตอร์เปิดไม่ติด',
      description: 'เปิดเครื่องแล้วไฟไม่ขึ้น จอดำ ลองเช็คสายไฟแล้วยังไม่ติด',
      category: 'ฮาร์ดแวร์',
      priority: 'high',
      status: 'in_progress',
      location: 'อาคาร A ชั้น 3 ห้องบัญชี',
      created_by: 'u-user1',
      assigned_to: 'u-tech1',
      created_at: now - 3 * day,
      updated_at: now - 1 * day,
      due_at: now - 3 * day + SLA_HOURS.high * hour,
      rating: null,
      attachment: null,
      department_id: 'dep-accounting',
      signature: null,
      history: [
        { at: now - 3 * day, by_user: 'u-user1', action: 'สร้างตั๋วแจ้งซ่อม' },
        { at: now - 2 * day, by_user: 'u-admin', action: 'มอบหมายงานให้ ช่างสมศักดิ์ ใจดี' },
        { at: now - 1 * day, by_user: 'u-tech1', action: 'เริ่มดำเนินการตรวจสอบเครื่อง' },
      ],
      comments: [{ at: now - 1 * day, by_user: 'u-tech1', text: 'ตรวจสอบเบื้องต้นคาดว่าพาวเวอร์ซัพพลายเสีย รอเปลี่ยนอะไหล่' }],
    },
    {
      id: 'T-1002',
      title: 'ปริ้นเตอร์กระดาษติดบ่อย',
      description: 'เครื่องพิมพ์ห้องขายกระดาษติดทุกครั้งที่พิมพ์เกิน 5 แผ่น',
      category: 'เครื่องพิมพ์',
      priority: 'medium',
      status: 'assigned',
      location: 'อาคาร B ชั้น 1 ห้องขาย',
      created_by: 'u-user2',
      assigned_to: 'u-tech2',
      created_at: now - 2 * day,
      updated_at: now - 2 * day,
      due_at: now - 2 * day + SLA_HOURS.medium * hour,
      rating: null,
      attachment: null,
      department_id: 'dep-sales',
      signature: null,
      history: [
        { at: now - 2 * day, by_user: 'u-user2', action: 'สร้างตั๋วแจ้งซ่อม' },
        { at: now - 2 * day, by_user: 'u-admin', action: 'มอบหมายงานให้ ช่างวิภา เก่งกาจ' },
      ],
      comments: [],
    },
    {
      id: 'T-1003',
      title: 'ต่ออินเทอร์เน็ตไม่ได้',
      description: 'Wi-Fi ในห้องประชุมใช้งานไม่ได้ตั้งแต่เช้า',
      category: 'เครือข่าย/อินเทอร์เน็ต',
      priority: 'urgent',
      status: 'new',
      location: 'อาคาร A ชั้น 5 ห้องประชุมใหญ่',
      created_by: 'u-user1',
      assigned_to: null,
      created_at: now - 3 * 60 * 60 * 1000,
      updated_at: now - 3 * 60 * 60 * 1000,
      due_at: now - 3 * 60 * 60 * 1000 + SLA_HOURS.urgent * hour,
      rating: null,
      attachment: null,
      department_id: 'dep-accounting',
      signature: null,
      history: [{ at: now - 3 * 60 * 60 * 1000, by_user: 'u-user1', action: 'สร้างตั๋วแจ้งซ่อม' }],
      comments: [],
    },
    {
      id: 'T-1004',
      title: 'ลงโปรแกรม Excel ให้หน่อย',
      description: 'เครื่องใหม่ยังไม่มี Microsoft Office ต้องใช้ทำงานด่วน',
      category: 'ซอฟต์แวร์',
      priority: 'low',
      status: 'done',
      location: 'อาคาร B ชั้น 2 ห้องขาย',
      created_by: 'u-user2',
      assigned_to: 'u-tech1',
      created_at: now - 6 * day,
      updated_at: now - 4 * day,
      due_at: now - 6 * day + SLA_HOURS.low * hour,
      rating: 5,
      attachment: null,
      department_id: 'dep-sales',
      signature: null,
      history: [
        { at: now - 6 * day, by_user: 'u-user2', action: 'สร้างตั๋วแจ้งซ่อม' },
        { at: now - 5 * day, by_user: 'u-admin', action: 'มอบหมายงานให้ ช่างสมศักดิ์ ใจดี' },
        { at: now - 4 * day, by_user: 'u-tech1', action: 'ดำเนินการติดตั้งเสร็จสิ้น' },
      ],
      comments: [{ at: now - 4 * day, by_user: 'u-tech1', text: 'ติดตั้ง Microsoft Office 365 เรียบร้อยแล้ว' }],
    },
  ]

  const insertAll = db.transaction((rows) => {
    for (const t of rows) {
      const { history, comments, ...ticket } = t
      insertTicket.run(ticket)
      history.forEach((h) => insertHistory.run({ ticket_id: t.id, ...h }))
      comments.forEach((c) => insertComment.run({ ticket_id: t.id, ...c }))
    }
  })
  insertAll(tickets)
}

seedIfEmpty()

export default db
