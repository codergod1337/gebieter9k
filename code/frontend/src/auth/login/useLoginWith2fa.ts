import { useCallback, useState } from 'react'
import type { UsersTotpSetup } from '../totp/UsersTotp.ts'
import { useCurrentSession } from './useCurrentSession.ts'
import { useSession } from './useSession.ts'
import { useUsersLogin2fa } from './useUsersLogin2fa.ts'

/**
 * form: E-Mail und Passwort. totpCode: Code aus der Authenticator-App. totpSetup: noch keine App, jetzt einrichten,
 * der erste Code meldet an. done: angemeldet, gleich geht es weiter.
 */
export type LoginPhase = 'form' | 'totpCode' | 'totpSetup' | 'done'

/** Was {@link useLoginWith2fa} anbietet. */
export type LoginWith2faHook = {
  phase: LoginPhase
  /** QR-Code und Schlüssel, nur bei `totpSetup`, sonst `null`. */
  usersTotpSetup: UsersTotpSetup | null
  /** Ein Schritt läuft gerade. */
  isBusy: boolean
  /** Fehler des letzten Schritts, z. B. „Der Code passt nicht (noch 4 Versuche) …“ */
  errorMessage: string | null
  /** Schritt 1: E-Mail und Passwort. Liefert, ob es geklappt hat; danach kommt der zweite Schritt. */
  startLogin: (email: string, plainPassword: string) => Promise<boolean>
  /** Schritt 2: der Code aus der App (beim Einrichten der erste). Passt er, ist man angemeldet. */
  finishLogin: (code: string) => Promise<boolean>
  /** Zurück zum Formular, z. B. nach zu vielen falschen Codes. */
  cancelLogin: () => void
}

/**
 * Der ganze Login mit Pflicht-2FA (seit 2026-11-08): E-Mail und Passwort, dann der Code aus der Authenticator-App.
 * Wer noch keine App hat (erste Anmeldung, abgeschaltet, vom Admin entfernt), richtet sie hier ein; ihr erster Code
 * meldet an. Ohne Code gibt es keine Sitzung. Danach geht die Sitzung an den `SessionProvider`.
 */
export function useLoginWith2fa(): LoginWith2faHook {
  const { acceptSession } = useCurrentSession()
  const usersLogin2faHook = useUsersLogin2fa()
  const sessionHook = useSession()
  const [phase, setPhase] = useState<LoginPhase>('form')
  const [loginToken, setLoginToken] = useState<string | null>(null)
  const [usersTotpSetup, setUsersTotpSetup] = useState<UsersTotpSetup | null>(null)
  // Fehler des Codes nur zeigen, wenn in DIESER Anmeldung schon einer geschickt wurde, nie einen alten
  const [codeSubmitted, setCodeSubmitted] = useState<boolean>(false)

  const createUsersLogin2fa = usersLogin2faHook.createUsersLogin2fa
  const createUsersLogin2faTotpSetup = usersLogin2faHook.createUsersLogin2faTotpSetup
  const createSession = sessionHook.createSession

  const startLogin = useCallback(
    async (email: string, plainPassword: string) => {
      setCodeSubmitted(false)
      const createdUsersLogin2fa = await createUsersLogin2fa(email, plainPassword)
      if (createdUsersLogin2fa === null) {
        return false
      }
      const createdLoginToken = createdUsersLogin2fa.loginToken
      setLoginToken(createdLoginToken)
      if (createdUsersLogin2fa.secondFactor === 'TOTP_CODE') {
        setPhase('totpCode')
        return true
      }
      const createdUsersTotpSetup = await createUsersLogin2faTotpSetup(createdLoginToken)
      if (createdUsersTotpSetup === null) {
        setLoginToken(null)
        return false
      }
      setUsersTotpSetup(createdUsersTotpSetup)
      setPhase('totpSetup')
      return true
    },
    [createUsersLogin2fa, createUsersLogin2faTotpSetup],
  )

  const finishLogin = useCallback(
    async (code: string) => {
      if (loginToken === null) {
        return false
      }
      setCodeSubmitted(true)
      const sessionInfo = await createSession(loginToken, code)
      if (sessionInfo === null) {
        return false
      }
      setPhase('done')
      setUsersTotpSetup(null)
      acceptSession(sessionInfo)
      return true
    },
    [loginToken, createSession, acceptSession],
  )

  const cancelLogin = useCallback(() => {
    setCodeSubmitted(false)
    setLoginToken(null)
    setUsersTotpSetup(null)
    setPhase('form')
  }, [])

  let errorMessage: string | null = null
  if (phase === 'form' && usersLogin2faHook.error !== null) {
    errorMessage = usersLogin2faHook.error.detail
  } else if (phase !== 'form' && codeSubmitted && sessionHook.error !== null) {
    errorMessage = sessionHook.error.detail
  }
  const isBusy = usersLogin2faHook.isLoading || sessionHook.isLoading

  return { phase, usersTotpSetup, isBusy, errorMessage, startLogin, finishLogin, cancelLogin }
}
