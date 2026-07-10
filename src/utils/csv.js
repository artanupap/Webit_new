import { statuses, priorities } from '../data/seed'

function escapeCsv(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
  return str
}

export function exportTicketsCsv(tickets, getUserById) {
  const headers = ['เลขที่ตั๋ว', 'หัวข้อ', 'หมวดหมู่', 'ความเร่งด่วน', 'สถานะ', 'สถานที่', 'ผู้แจ้ง', 'ผู้รับผิดชอบ', 'วันที่แจ้ง', 'อัปเดตล่าสุด']
  const rows = tickets.map((t) => [
    t.id,
    t.title,
    t.category,
    priorities.find((p) => p.value === t.priority)?.label || t.priority,
    statuses.find((s) => s.value === t.status)?.label || t.status,
    t.location,
    getUserById(t.createdBy)?.name || '',
    t.assignedTo ? getUserById(t.assignedTo)?.name || '' : 'ยังไม่มอบหมาย',
    new Date(t.createdAt).toLocaleString('th-TH'),
    new Date(t.updatedAt).toLocaleString('th-TH'),
  ])

  const csv = '﻿' + [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `it-support-tickets-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
