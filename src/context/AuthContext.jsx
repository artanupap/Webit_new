import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem('it_support_current_user')
    return raw ? JSON.parse(raw) : null
  })

  const refreshUsers = useCallback(() => {
    api.getUsers().then(setUsers).catch(() => {})
  }, [])

  const refreshDepartments = useCallback(() => {
    api.getDepartments().then(setDepartments).catch(() => {})
  }, [])

  const refreshRegistrations = useCallback(() => {
    api.getRegistrations().then(setRegistrations).catch(() => {})
  }, [])

  useEffect(() => {
    refreshUsers()
    refreshDepartments()
  }, [refreshUsers, refreshDepartments])

  useEffect(() => {
    if (currentUser?.role === 'admin') refreshRegistrations()
  }, [currentUser, refreshRegistrations])

  useEffect(() => {
    if (currentUser) localStorage.setItem('it_support_current_user', JSON.stringify(currentUser))
    else localStorage.removeItem('it_support_current_user')
  }, [currentUser])

  async function login(username, password) {
    try {
      const result = await api.login(username, password)
      setCurrentUser(result.user)
      return { ok: true, user: result.user }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  function logout() {
    setCurrentUser(null)
  }

  async function addUser(user) {
    const newUser = await api.addUser(user)
    setUsers((prev) => [...prev, newUser])
    return newUser
  }

  async function updateUser(id, user) {
    const updated = await api.updateUser(id, user)
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    return updated
  }

  async function deleteUser(id) {
    await api.deleteUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  async function addDepartment(department) {
    const newDept = await api.addDepartment(department)
    setDepartments((prev) => [...prev, newDept])
    return newDept
  }

  async function updateDepartment(id, department) {
    const updated = await api.updateDepartment(id, department)
    setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)))
    refreshUsers()
    return updated
  }

  async function deleteDepartment(id) {
    await api.deleteDepartment(id)
    setDepartments((prev) => prev.filter((d) => d.id !== id))
  }

  async function renameCompany(oldName, newName) {
    await api.renameCompany(oldName, newName)
    refreshDepartments()
    refreshUsers()
  }

  async function deleteCompany(name) {
    await api.deleteCompany(name)
    setDepartments((prev) => prev.filter((d) => d.company !== name))
  }

  async function register(data) {
    return api.register(data)
  }

  async function approveRegistration(id) {
    const updated = await api.approveRegistration(id, currentUser.id)
    setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)))
    refreshUsers()
    return updated
  }

  async function rejectRegistration(id, reason) {
    const updated = await api.rejectRegistration(id, currentUser.id, reason)
    setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }

  function getUserById(id) {
    return users.find((u) => u.id === id)
  }

  function getDepartmentById(id) {
    return departments.find((d) => d.id === id)
  }

  const technicians = users.filter((u) => u.role === 'technician')

  return (
    <AuthContext.Provider
      value={{
        users,
        technicians,
        departments,
        registrations,
        currentUser,
        login,
        logout,
        register,
        approveRegistration,
        rejectRegistration,
        addUser,
        updateUser,
        deleteUser,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        renameCompany,
        deleteCompany,
        getUserById,
        getDepartmentById,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
