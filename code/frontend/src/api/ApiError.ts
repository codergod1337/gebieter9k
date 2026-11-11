/**
 * Der eine Fehlertyp für jeden Request. Das Backend liefert Fehler als ProblemDetail
 * (`status`, `title`, `detail`), daraus wird genau dieses Objekt.
 *
 * `status` 0 heißt: Es kam gar keine Antwort vom Backend, z. B. weil es nicht läuft.
 */
export class ApiError extends Error {
  readonly status: number

  readonly title: string

  readonly detail: string

  constructor(status: number, title: string, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.detail = detail
  }

  /** Macht aus jedem gefangenen Fehler einen ApiError, damit überall dieselbe Form ankommt. */
  static from(caughtError: unknown): ApiError {
    if (caughtError instanceof ApiError) {
      return caughtError
    }
    if (caughtError instanceof Error) {
      return new ApiError(0, 'Unerwarteter Fehler', caughtError.message)
    }
    const caughtErrorText = String(caughtError)
    return new ApiError(0, 'Unerwarteter Fehler', caughtErrorText)
  }
}
