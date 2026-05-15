import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { pb } from '../lib/pb'
import type { AuthUser } from '../types'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from PocketBase authStore
    if (pb.authStore.isValid && pb.authStore.model) {
      const m = pb.authStore.model
      setUser({ id: m.id, email: m.email, name: m.name })
    }
    setLoading(false)

    const unsub = pb.authStore.onChange((_token, model) => {
      if (model) {
        setUser({ id: model.id, email: model.email, name: model.name })
      } else {
        setUser(null)
      }
    })

    return () => unsub()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await pb.collection('users').authWithPassword(email, password)
    setUser({ id: res.record.id, email: res.record.email, name: res.record.name })
  }

  const register = async (name: string, email: string, password: string) => {
    await pb.collection('users').create({
      name,
      email,
      password,
      passwordConfirm: password,
    })
    await login(email, password)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
