import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultApiClient } from '../../api/defaultApiClient.ts'
import { defaultMasterDataStore } from '../../masterdata/defaultMasterDataStore.ts'
import { clearViewCache } from '../../navigation/viewCache.ts'
import { type CurrentSession, SessionContext } from './SessionContext.ts'
import type { Users } from '../../users/Users.ts'
import type { SessionInfo } from './SessionInfo.ts'
import { useSession } from './useSession.ts'

/** Name des Schlosses im Browser (Web Locks API): Über alle Tabs dieser Seite erneuert immer nur einer gleichzeitig. */
const SESSION_RENEWAL_LOCK_NAME = 'gebiter-session-renewal'

/**
 * So lange wartet er, bevor er eine Erneuerung noch einmal versucht, die am Netz oder am Server gescheitert ist (keine
 * Antwort oder Fehler ab 500), z. B. weil das Backend gerade neu startet oder das WLAN nach dem Standby noch fehlt.
 */
const SESSION_RENEWAL_RETRY_MILLISECONDS = 30_000

/** Ab diesem HTTP-Status liegt ein Fehler am Server, nicht an der Anfrage (z. B. 502 von nginx, solange das Backend startet). */
const SERVER_ERROR_STATUS_FROM = 500

type SessionProviderProps = {
  children: ReactNode
}

/** Die Sitzung und wann sie das nächste Mal erneuert wird, immer zusammen gesetzt. */
type HeldSession = {
  session: SessionInfo | null
  nextSessionRenewalAt: string | null
}

/**
 * Wann die Sitzung erneuert wird, als ISO-Text: der Termin vom Server (`tokenRenewalDueAt`, Ausstellung plus 15
 * Minuten). Er hängt am Token, nicht am Laden der Seite: F5 verschiebt ihn nicht.
 */
function calculateNextSessionRenewalAt(sessionInfo: SessionInfo): string {
  return sessionInfo.tokenRenewalDueAt
}

/**
 * Hält die eigene Sitzung für die ganze Anwendung. Steht ganz außen in `App.tsx`.
 *
 * - Eine Sitzung sind zwei HttpOnly-Cookies: das kurze JWT und der Refresh-Token (14 Tage). Mit dem Refresh-Token holt
 *   er sich ein neues JWT, so bleibt man angemeldet, auch nach einem Neustart des Browsers oder des Backends.
 * - Beim Laden der Seite fragt er `/api/session`. Fehlt das JWT oder gilt es nicht mehr, erneuert das API-Modul die
 *   Sitzung über den Refresh-Token von selbst (401 → Erneuerung → noch einmal).
 * - Danach erneuert er zum Termin vom Server (`tokenRenewalDueAt`, 15 Minuten nach Ausstellung, F5 ändert ihn nicht)
 *   und nach jeder 401 eines Requests. Jede Erneuerung bucht der Server als Online-Zeit für Achievements.
 * - Abgemeldet ist man nur, wenn das Backend die Erneuerung ablehnt (401 und jeder andere Fehler unter 500). Kommt gar
 *   keine Antwort oder ein Serverfehler (Backend startet neu, Netz kurz weg), bleibt die Sitzung stehen und er versucht
 *   es nach 30 Sekunden noch einmal (Punkt 11 der Durchsicht, 2026-11-11). Sicherer oder unsicherer wird dadurch
 *   nichts: Die Sitzung hier ist nur Anzeige, jeden Request prüft weiter das Backend am JWT.
 * - Die Sitzung nach dem Login holt das Login-Formular über die 2FA ab (`useLoginWith2fa`) und gibt sie mit
 *   `acceptSession` hierher. Danach lädt er die Stammdaten neu.
 *
 * Wiederherstellen, Erneuern und Logout nutzen je eine eigene Instanz von {@link useSession}. So taucht z. B. das 401
 * beim Wiederherstellen nirgends als Fehler auf.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const restoreSessionHook = useSession()
  const renewSessionHook = useSession()
  const logoutSessionHook = useSession()

  const [heldSession, setHeldSession] = useState<HeldSession>({ session: null, nextSessionRenewalAt: null })
  const [isRestoring, setIsRestoring] = useState<boolean>(true)
  /** Die laufende Erneuerung: Mehrere 401 gleichzeitig lösen so nur eine aus. */
  const runningSessionRenewalRef = useRef<Promise<SessionInfo | null> | null>(null)

  const getSession = restoreSessionHook.getSession
  const refreshSession = renewSessionHook.refreshSession
  const deleteSession = logoutSessionHook.deleteSession

  const applySession = useCallback((sessionInfo: SessionInfo | null) => {
    let nextSessionRenewalAt: string | null = null
    if (sessionInfo !== null) {
      nextSessionRenewalAt = calculateNextSessionRenewalAt(sessionInfo)
    }
    setHeldSession({ session: sessionInfo, nextSessionRenewalAt })
  }, [])

  /** Die Sitzung bleibt, wie sie ist; die nächste Erneuerung wird in 30 Sekunden noch einmal versucht. */
  const retrySessionRenewalLater = useCallback(() => {
    const retryAtMilliseconds = Date.now() + SESSION_RENEWAL_RETRY_MILLISECONDS
    const retryAt = new Date(retryAtMilliseconds).toISOString()
    setHeldSession((currentHeldSession) => {
      if (currentHeldSession.session === null) {
        return currentHeldSession
      }
      return { ...currentHeldSession, nextSessionRenewalAt: retryAt }
    })
  }, [])

  /**
   * Erneuert die Sitzung genau einmal. Über alle Tabs immer nur einer gleichzeitig (Web Locks API; die gibt es nur auf
   * https und localhost, sonst ohne Schloss). Wartet ein Tab auf das Schloss, schickt er danach den Refresh-Token, den
   * der andere Tab schon getauscht hat: Der Browser hat nur ein Cookie für alle Tabs. Liefert die neue Sitzung; `null`
   * heißt nicht erneuert: abgemeldet (das Backend hat abgelehnt) oder das Backend war nicht erreichbar (die Sitzung
   * bleibt, ein neuer Versuch folgt).
   */
  const renewSession = useCallback(async (): Promise<SessionInfo | null> => {
    const runningSessionRenewal = runningSessionRenewalRef.current
    if (runningSessionRenewal !== null) {
      return runningSessionRenewal
    }
    async function renewSessionHoldingLock(): Promise<SessionInfo | null> {
      const renewalOutcome = await refreshSession()
      if (renewalOutcome.succeeded) {
        const renewedSession = renewalOutcome.data
        applySession(renewedSession)
        return renewedSession
      }
      // Keine Antwort (Status 0) oder ein Serverfehler: Das Backend hat den Refresh-Token nicht abgelehnt, meist hat es
      // ihn gar nicht gesehen. Die Sitzung bleibt; kam nur die Antwort nicht an, lehnt das Backend den nächsten Versuch
      // ab (401) und man ist abgemeldet, wie bisher sofort.
      const renewalErrorStatus = renewalOutcome.error.status
      const backendUnreachable = renewalErrorStatus === 0 || renewalErrorStatus >= SERVER_ERROR_STATUS_FROM
      if (backendUnreachable) {
        retrySessionRenewalLater()
        return null
      }
      applySession(null)
      return null
    }
    const browserLocks: LockManager | undefined = navigator.locks
    let sessionRenewal: Promise<SessionInfo | null>
    if (browserLocks === undefined) {
      sessionRenewal = renewSessionHoldingLock()
    } else {
      sessionRenewal = browserLocks.request(SESSION_RENEWAL_LOCK_NAME, renewSessionHoldingLock)
    }
    runningSessionRenewalRef.current = sessionRenewal
    try {
      return await sessionRenewal
    } finally {
      runningSessionRenewalRef.current = null
    }
  }, [refreshSession, applySession, retrySessionRenewalLater])

  // Zuerst: Nach einer 401 aus irgendeinem Request einmal erneuern, das API-Modul wiederholt den Request dann.
  useEffect(() => {
    async function renewSessionAfterUnauthorized(): Promise<boolean> {
      const renewedSession = await renewSession()
      return renewedSession !== null
    }
    defaultApiClient.setSessionRenewalHandler(renewSessionAfterUnauthorized)
    return () => defaultApiClient.setSessionRenewalHandler(null)
  }, [renewSession])

  // Beim Laden der Seite
  useEffect(() => {
    async function restoreSession() {
      const restoredSession = await getSession()
      applySession(restoredSession)
      setIsRestoring(false)
    }
    void restoreSession()
  }, [getSession, applySession])

  // Rechtzeitig vor Ablauf des JWT erneuern
  const nextSessionRenewalAt = heldSession.nextSessionRenewalAt
  useEffect(() => {
    if (nextSessionRenewalAt === null) {
      return
    }
    const nextSessionRenewalAtMilliseconds = new Date(nextSessionRenewalAt).getTime()
    const nowMilliseconds = Date.now()
    const renewalDelayMilliseconds = Math.max(0, nextSessionRenewalAtMilliseconds - nowMilliseconds)
    const renewalTimer = setTimeout(() => {
      void renewSession()
    }, renewalDelayMilliseconds)
    return () => clearTimeout(renewalTimer)
  }, [nextSessionRenewalAt, renewSession])

  const acceptSession = useCallback((sessionInfo: SessionInfo) => {
    applySession(sessionInfo)
    void defaultMasterDataStore.reload()
  }, [applySession])

  const logout = useCallback(async () => {
    const loggedOut = await deleteSession()
    if (loggedOut) {
      // Nichts aus der Sitzung bleibt im Speicher, auch nicht die zwischengespeicherten Ansichten
      clearViewCache()
      applySession(null)
    }
    return loggedOut
  }, [deleteSession, applySession])

  /** Der eigene User nach einer Änderung; Rechte und Erneuerung der Sitzung bleiben, wie sie sind. */
  const acceptOwnUsers = useCallback((changedOwnUsers: Users) => {
    setHeldSession((currentHeldSession) => {
      const currentSession = currentHeldSession.session
      if (currentSession === null || currentSession.users.guid !== changedOwnUsers.guid) {
        return currentHeldSession
      }
      const changedSession: SessionInfo = { ...currentSession, users: changedOwnUsers }
      return { ...currentHeldSession, session: changedSession }
    })
  }, [])

  const session = heldSession.session
  const hasAccessRole = useCallback((accessRoleKey: string) => {
    if (session === null) {
      return false
    }
    return session.accessRoleKeys.includes(accessRoleKey)
  }, [session])

  const currentSession = useMemo<CurrentSession>(() => {
    return { session, isRestoring, nextSessionRenewalAt, acceptSession, logout, acceptOwnUsers, hasAccessRole }
  }, [session, isRestoring, nextSessionRenewalAt, acceptSession, logout, acceptOwnUsers, hasAccessRole])

  return <SessionContext value={currentSession}>{children}</SessionContext>
}
