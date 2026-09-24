"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { SessionData } from "@/types/empresa"

const STORAGE_KEY = "crm.session"

type SessionContextValue = {
  /** null = logged out. undefined during the first client read = "still hydrating". */
  session: SessionData | null
  /** true once the client has read sessionStorage, so guards don't flash. */
  ready: boolean
  login: (data: SessionData) => void
  logout: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setSession(JSON.parse(raw) as SessionData)
    } catch {
      // corrupt payload — ignore and start logged out
    } finally {
      setReady(true)
    }
  }, [])

  const login = useCallback((data: SessionData) => {
    setSession(data)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage unavailable — session lives in memory for this tab
    }
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <SessionContext.Provider value={{ session, ready, login, logout }}>{children}</SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within a SessionProvider")
  return ctx
}
