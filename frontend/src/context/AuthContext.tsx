import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, User } from '../api'
import { tokenStore } from '../api/tokenStore'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    tokenStore.onExpired(() => setUser(null))

    async function restoreSession() {
      try {
        const { accessToken } = await api.auth.refresh()
        tokenStore.set(accessToken)
        const me = await api.auth.me()
        setUser(me)
      } catch {
        // No valid session
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  async function login(email: string, password: string) {
    const { user: u, accessToken } = await api.auth.login({ email, password })
    tokenStore.set(accessToken)
    setUser(u)
  }

  async function register(name: string, email: string, password: string) {
    const { user: u, accessToken } = await api.auth.register({ name, email, password })
    tokenStore.set(accessToken)
    setUser(u)
  }

  async function logout() {
    try {
      await api.auth.logout()
    } finally {
      tokenStore.set(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
