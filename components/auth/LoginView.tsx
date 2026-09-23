"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Mail, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { useSession } from "@/context/session-context"
import { homeService } from "@/services/homeService"
import { ApiError } from "@/lib/api"

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return "Ocurrió un error inesperado."
}

type Step = "correo" | "codigo"

const CODE_LENGTH = 6
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginView() {
  const router = useRouter()
  const toast = useToast()
  const { session, ready, login } = useSession()

  const [step, setStep] = useState<Step>("correo")
  const [correo, setCorreo] = useState("")
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // If already logged in, skip the login screen.
  useEffect(() => {
    if (ready && session) router.replace("/dashboard")
  }, [ready, session, router])

  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!EMAIL_RE.test(correo.trim())) {
      setError("Ingresa un correo electrónico válido.")
      return
    }
    setSending(true)
    try {
      const { mensaje } = await homeService.enviarCodigo(correo.trim())
      toast.success("Código enviado", mensaje)
      setStep("codigo")
      setDigits(Array(CODE_LENGTH).fill(""))
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error("No se pudo enviar el código", msg)
    } finally {
      setSending(false)
    }
  }

  async function submitCodigo(code: string) {
    setError(null)
    setVerifying(true)
    try {
      const data = await homeService.verificarCodigo(correo.trim(), code)
      login({ empresaId: data.empresaId, nombreEmpresa: data.nombreEmpresa, correo: data.correo })
      toast.success("Bienvenido", `Sesión iniciada en ${data.nombreEmpresa}.`)
      router.replace("/dashboard")
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error("Verificación fallida", msg)
      setDigits(Array(CODE_LENGTH).fill(""))
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    } finally {
      setVerifying(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "")
    if (!clean) {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)))
      return
    }
    setDigits((prev) => {
      const next = [...prev]
      // Support paste of multiple digits into one box.
      const chars = clean.split("")
      let cursor = index
      for (const ch of chars) {
        if (cursor >= CODE_LENGTH) break
        next[cursor] = ch
        cursor++
      }
      const focusTarget = Math.min(cursor, CODE_LENGTH - 1)
      setTimeout(() => inputsRef.current[focusTarget]?.focus(), 0)
      const joined = next.join("")
      if (joined.length === CODE_LENGTH && !next.includes("")) {
        setTimeout(() => submitCodigo(joined), 0)
      }
      return next
    })
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const code = digits.join("")

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Decorative brand panel background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Acceso a tu empresa
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            {step === "correo"
              ? "Ingresa el correo de tu empresa para recibir un código de verificación."
              : "Escribe el código de 6 dígitos que enviamos a tu correo."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {step === "correo" ? (
            <form onSubmit={handleEnviarCodigo} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <label htmlFor="correo" className="text-sm font-medium text-foreground">
                  Correo de la empresa
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="correo"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="empresa@dominio.com"
                    className="h-11 pl-9"
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value)
                      if (error) setError(null)
                    }}
                    aria-invalid={!!error}
                    disabled={sending}
                    autoFocus
                  />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <Button type="submit" size="lg" className="h-11 w-full" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  "Enviar código"
                )}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Código enviado a <span className="font-medium text-foreground">{correo}</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Código de verificación</span>
                <div className="flex items-center justify-between gap-2" role="group" aria-label="Código de 6 dígitos">
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={CODE_LENGTH}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={verifying}
                      aria-label={`Dígito ${i + 1}`}
                      className="h-12 w-full rounded-lg border border-border bg-background text-center text-lg font-semibold text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive"
                    />
                  ))}
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <Button
                type="button"
                size="lg"
                className="h-11 w-full"
                disabled={verifying || code.length !== CODE_LENGTH}
                onClick={() => submitCodigo(code)}
              >
                {verifying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar e ingresar"
                )}
              </Button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("correo")
                    setError(null)
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  disabled={verifying}
                >
                  <ArrowLeft className="size-4" />
                  Cambiar correo
                </button>
                <button
                  type="button"
                  onClick={handleEnviarCodigo}
                  className="text-sm font-medium text-primary transition-colors hover:opacity-80 disabled:opacity-50"
                  disabled={sending || verifying}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          CRM multiempresa · Acceso seguro por código
        </p>
      </div>
    </main>
  )
}
