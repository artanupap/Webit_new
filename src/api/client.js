const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
  }
  return data
}

export const api = {
  login: (username, password) =>
    request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUsers: () => request('/users'),
  addUser: (user) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id, user) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getDepartments: () => request('/departments'),
  addDepartment: (department) => request('/departments', { method: 'POST', body: JSON.stringify(department) }),
  updateDepartment: (id, department) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(department) }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
  renameCompany: (oldName, newName) => request('/companies', { method: 'PUT', body: JSON.stringify({ oldName, newName }) }),
  deleteCompany: (name) => request('/companies', { method: 'DELETE', body: JSON.stringify({ name }) }),
  getTickets: () => request('/tickets'),
  createTicket: (ticket) => request('/tickets', { method: 'POST', body: JSON.stringify(ticket) }),
  assignTicket: (id, technicianId, byUserId, technicianName) =>
    request(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ technicianId, byUserId, technicianName }),
    }),
  setStatus: (id, status, byUserId, statusLabel) =>
    request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, byUserId, statusLabel }),
    }),
  addComment: (id, byUserId, text) =>
    request(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ byUserId, text }) }),
  rateTicket: (id, rating) =>
    request(`/tickets/${id}/rating`, { method: 'PATCH', body: JSON.stringify({ rating }) }),
  saveSignature: (id, signature) =>
    request(`/tickets/${id}/signature`, { method: 'PATCH', body: JSON.stringify({ signature }) }),
}
