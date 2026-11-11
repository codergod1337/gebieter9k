import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { MailTestRequest, MailTestResult, MailTestSettings } from './MailTest.ts'

/**
 * Was {@link useMailTest} anbietet: die Endpunkte von `/api/admin/mail-test` (nur ADMIN), benannt wie die Methoden im
 * `MailService` des Backends. Bei einem Fehler kommt `null`, der Fehler (z. B. die Antwort des SMTP-Servers) steht in
 * `error`.
 */
export type MailTestHook = ApiHookState & {
  sendTestMail: (mailTestRequest: MailTestRequest) => Promise<MailTestResult | null>
  getMailTestSettings: () => Promise<MailTestSettings | null>
}

/** Alle Endpunkte von `/api/admin/mail-test`, die Requests gehen über das API-Modul. */
export function useMailTest(): MailTestHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Schickt die Test-Mail an die Adresse aus der .env. */
  const sendTestMail = useCallback((mailTestRequest: MailTestRequest) => {
    return sendForData<MailTestResult>({ method: 'POST', path: '/api/admin/mail-test', body: mailTestRequest })
  }, [sendForData])

  /** READ: Der SMTP-Zugang, der gerade gilt. */
  const getMailTestSettings = useCallback(() => {
    return sendForData<MailTestSettings>({ method: 'GET', path: '/api/admin/mail-test' })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    sendTestMail,
    getMailTestSettings,
  }
}
