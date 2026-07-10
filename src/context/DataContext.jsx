import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const DataContext = createContext(null)
const POLL_INTERVAL = 15000

export function DataProvider({ children }) {
  const [tickets, setTickets] = useState([])

  const refreshTickets = useCallback(() => {
    api.getTickets().then(setTickets).catch(() => {})
  }, [])

  useEffect(() => {
    refreshTickets()
    const interval = setInterval(refreshTickets, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [refreshTickets])

  async function createTicket({ title, description, category, priority, location, createdBy, attachment }) {
    const ticket = await api.createTicket({ title, description, category, priority, location, createdBy, attachment })
    setTickets((prev) => [ticket, ...prev])
    return ticket
  }

  async function assignTicket(id, technicianId, byUserId, technicianName) {
    const updated = await api.assignTicket(id, technicianId, byUserId, technicianName)
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function setStatus(id, status, byUserId, statusLabel) {
    const updated = await api.setStatus(id, status, byUserId, statusLabel)
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function addComment(id, byUserId, text) {
    const updated = await api.addComment(id, byUserId, text)
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function rateTicket(id, rating) {
    const updated = await api.rateTicket(id, rating)
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function saveSignature(id, signature) {
    const updated = await api.saveSignature(id, signature)
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  function getTicketsFor(user) {
    if (!user) return []
    if (user.role === 'admin') return tickets
    if (user.role === 'technician') {
      return tickets.filter(
        (t) => t.assignedTo === user.id || (!t.assignedTo && !['done', 'cancelled'].includes(t.status))
      )
    }
    return tickets.filter((t) => t.createdBy === user.id)
  }

  return (
    <DataContext.Provider
      value={{ tickets, createTicket, assignTicket, setStatus, addComment, rateTicket, saveSignature, getTicketsFor }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
