import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { AuthUser } from '../types'

const TIMEOUT_DURATION = 15 * 60 * 1000 // 15 minutes

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: (expired?: boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const timeoutRef = useRef<number | null>(null)

  const logout = useCallback(async (expired = false) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await supabase.auth.signOut()
    setUser(null)
    if (expired) {
      navigate('/auth?expired=true')
    } else {
      navigate('/auth')
    }
  }, [navigate])

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    if (user) {
      timeoutRef.current = window.setTimeout(() => {
        logout(true)
      }, TIMEOUT_DURATION)
    }
  }, [user, logout])

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || ''
        })
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || ''
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

      const handleActivity = () => {
        resetTimer()
      }

      events.forEach(event => {
        window.addEventListener(event, handleActivity)
      })

      resetTimer()

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleActivity)
        })
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [user, resetTimer])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || data.user.email?.split('@')[0] || ''
      })
    }
  }

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    if (error) throw error
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: name
      })
    }
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
