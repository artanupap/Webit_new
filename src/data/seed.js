// ข้อมูลเริ่มต้น (mock) สำหรับผู้ใช้และตั๋วแจ้งซ่อม
export const seedUsers = [
  { id: 'u-admin', username: 'admin', password: 'admin123', name: 'ผู้บริหาร สมชาย', role: 'admin', department: 'ผู้บริหาร' },
  { id: 'u-tech1', username: 'tech1', password: 'tech123', name: 'ช่างสมศักดิ์ ใจดี', role: 'technician', department: 'ฝ่าย IT' },
  { id: 'u-tech2', username: 'tech2', password: 'tech123', name: 'ช่างวิภา เก่งกาจ', role: 'technician', department: 'ฝ่าย IT' },
  { id: 'u-user1', username: 'user1', password: 'user123', name: 'สมหญิง รักงาน', role: 'user', department: 'ฝ่ายบัญชี' },
  { id: 'u-user2', username: 'user2', password: 'user123', name: 'ประยุทธ ขยันดี', role: 'user', department: 'ฝ่ายขาย' },
]

export const categories = ['ฮาร์ดแวร์', 'ซอฟต์แวร์', 'เครือข่าย/อินเทอร์เน็ต', 'เครื่องพิมพ์', 'อีเมล', 'ระบบลงเวลา', 'อื่นๆ']

export const priorities = [
  { value: 'low', label: 'ต่ำ', color: '#22c55e' },
  { value: 'medium', label: 'ปานกลาง', color: '#eab308' },
  { value: 'high', label: 'สูง', color: '#f97316' },
  { value: 'urgent', label: 'ด่วนมาก', color: '#ef4444' },
]

export const statuses = [
  { value: 'new', label: 'แจ้งใหม่', color: '#64748b' },
  { value: 'assigned', label: 'มอบหมายแล้ว', color: '#3b82f6' },
  { value: 'in_progress', label: 'กำลังดำเนินการ', color: '#eab308' },
  { value: 'done', label: 'ซ่อมเสร็จสิ้น', color: '#22c55e' },
  { value: 'cancelled', label: 'ยกเลิก', color: '#ef4444' },
]

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const seedTickets = [
  {
    id: 'T-1001',
    title: 'คอมพิวเตอร์เปิดไม่ติด',
    description: 'เปิดเครื่องแล้วไฟไม่ขึ้น จอดำ ลองเช็คสายไฟแล้วยังไม่ติด',
    category: 'ฮาร์ดแวร์',
    priority: 'high',
    status: 'in_progress',
    location: 'อาคาร A ชั้น 3 ห้องบัญชี',
    createdBy: 'u-user1',
    assignedTo: 'u-tech1',
    createdAt: now - 3 * day,
    updatedAt: now - 1 * day,
    history: [
      { at: now - 3 * day, by: 'u-user1', action: 'สร้างตั๋วแจ้งซ่อม' },
      { at: now - 2 * day, by: 'u-admin', action: 'มอบหมายงานให้ ช่างสมศักดิ์ ใจดี' },
      { at: now - 1 * day, by: 'u-tech1', action: 'เริ่มดำเนินการตรวจสอบเครื่อง' },
    ],
    comments: [
      { at: now - 1 * day, by: 'u-tech1', text: 'ตรวจสอบเบื้องต้นคาดว่าพาวเวอร์ซัพพลายเสีย รอเปลี่ยนอะไหล่' },
    ],
  },
  {
    id: 'T-1002',
    title: 'ปริ้นเตอร์กระดาษติดบ่อย',
    description: 'เครื่องพิมพ์ห้องขายกระดาษติดทุกครั้งที่พิมพ์เกิน 5 แผ่น',
    category: 'เครื่องพิมพ์',
    priority: 'medium',
    status: 'assigned',
    location: 'อาคาร B ชั้น 1 ห้องขาย',
    createdBy: 'u-user2',
    assignedTo: 'u-tech2',
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
    history: [
      { at: now - 2 * day, by: 'u-user2', action: 'สร้างตั๋วแจ้งซ่อม' },
      { at: now - 2 * day, by: 'u-admin', action: 'มอบหมายงานให้ ช่างวิภา เก่งกาจ' },
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
    createdBy: 'u-user1',
    assignedTo: null,
    createdAt: now - 3 * 60 * 60 * 1000,
    updatedAt: now - 3 * 60 * 60 * 1000,
    history: [{ at: now - 3 * 60 * 60 * 1000, by: 'u-user1', action: 'สร้างตั๋วแจ้งซ่อม' }],
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
    createdBy: 'u-user2',
    assignedTo: 'u-tech1',
    createdAt: now - 6 * day,
    updatedAt: now - 4 * day,
    history: [
      { at: now - 6 * day, by: 'u-user2', action: 'สร้างตั๋วแจ้งซ่อม' },
      { at: now - 5 * day, by: 'u-admin', action: 'มอบหมายงานให้ ช่างสมศักดิ์ ใจดี' },
      { at: now - 4 * day, by: 'u-tech1', action: 'ดำเนินการติดตั้งเสร็จสิ้น' },
    ],
    comments: [{ at: now - 4 * day, by: 'u-tech1', text: 'ติดตั้ง Microsoft Office 365 เรียบร้อยแล้ว' }],
  },
]
