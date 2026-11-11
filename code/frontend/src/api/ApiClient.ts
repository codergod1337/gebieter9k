import { ApiError } from './ApiError.ts'
import type { ApiMethod, ApiRequest, DownloadProgressListener, UploadProgressListener } from './ApiRequest.ts'

/** So sieht ein Fehler aus, den das Backend schickt (ProblemDetail nach RFC 9457). */
type ProblemDetail = {
  status?: number
  title?: string
  detail?: string
}

/**
 * Erneuert die Sitzung nach einer 401 und liefert, ob es geklappt hat. Setzt der `SessionProvider`, der weiß, wie die
 * Sitzung erneuert wird.
 */
export type SessionRenewalHandler = () => Promise<boolean>

/**
 * Pfade ohne Token (`/api/share/…`): Login, Abholen, Erneuern und Abmelden der Sitzung. Eine 401 von dort ist endgültig
 * und löst nie eine Erneuerung aus, sonst riefe sich die Erneuerung selbst auf.
 */
const SHARE_PATH_PREFIX = '/api/share/'

/**
 * Die EINZIGE Stelle im Frontend, die mit dem Backend spricht. Jeder Endpunkt, jede Methode und
 * jeder Request Body geht hierüber.
 *
 * - Die Cookies gehen immer mit (`credentials: 'include'`), JavaScript sieht sie nie.
 * - Ein Request Body wird als JSON geschickt, eine Datei roh (`fileBody`), ein Formular als Multipart (`multipartBody`).
 *   Nur der Multipart-Weg läuft über `XMLHttpRequest` statt `fetch`: Allein dort meldet der Browser, wie viele Bytes
 *   schon gesendet sind (Fortschritt beim Hochladen).
 * - Antwortet das Backend mit 401, weil das JWT abgelaufen ist oder das Backend neu gestartet wurde, erneuert der
 *   {@link SessionRenewalHandler} die Sitzung, und der Request geht genau einmal noch einmal raus.
 * - Jeder Fehler kommt als {@link ApiError} heraus, auch wenn das Backend gar nicht antwortet.
 */
export class ApiClient {
  private readonly baseUrl: string

  private sessionRenewalHandler: SessionRenewalHandler | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Die volle Adresse eines Endpunkts, für Stellen, an denen der Browser selbst lädt (`<img>`, `<video>`, Download-Link).
   * Das Cookie schickt er dabei von sich aus mit.
   */
  createUrl(path: string): string {
    return this.baseUrl + path
  }

  /** Setzt oder entfernt (`null`) den Handler, der nach einer 401 die Sitzung erneuert. */
  setSessionRenewalHandler(sessionRenewalHandler: SessionRenewalHandler | null): void {
    this.sessionRenewalHandler = sessionRenewalHandler
  }

  /**
   * Schickt den Request und liefert die Antwort des Backends: JSON als Objekt, sonst Text,
   * bei 204 nichts.
   *
   * @throws ApiError bei jedem Fehler
   */
  async send<T>(apiRequest: ApiRequest): Promise<T> {
    const method = apiRequest.method
    const hasBody = apiRequest.body !== undefined
    const fileBody = apiRequest.fileBody
    const hasFileBody = fileBody !== undefined
    const multipartBody = apiRequest.multipartBody
    const hasMultipartBody = multipartBody !== undefined
    let bodyKindCount = 0
    if (hasBody) {
      bodyKindCount = bodyKindCount + 1
    }
    if (hasFileBody) {
      bodyKindCount = bodyKindCount + 1
    }
    if (hasMultipartBody) {
      bodyKindCount = bodyKindCount + 1
    }
    if (method === 'GET' && bodyKindCount > 0) {
      throw new ApiError(0, 'Ungültiger Request', 'Ein GET darf keinen Request Body haben.')
    }
    if (bodyKindCount > 1) {
      throw new ApiError(0, 'Ungültiger Request', 'Entweder JSON, eine Datei oder ein Formular als Body, nie mehreres.')
    }

    const url = this.baseUrl + apiRequest.path
    let sendOnce: () => Promise<Response>
    if (hasMultipartBody) {
      const onUploadProgress = apiRequest.onUploadProgress
      const abortSignal = apiRequest.abortSignal
      sendOnce = () => this.sendMultipartWithProgress(url, method, multipartBody, onUploadProgress, abortSignal)
    } else {
      let acceptHeader = 'application/json'
      if (apiRequest.responseAsBlob === true) {
        // Die Bytes einer Datei, jeder Typ; ein Fehler kommt trotzdem als ProblemDetail (JSON)
        acceptHeader = '*/*'
      }
      const headers: Record<string, string> = { Accept: acceptHeader }
      let requestBody: BodyInit | undefined = undefined
      if (hasBody) {
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(apiRequest.body)
      }
      if (hasFileBody) {
        // Ausdrücklich gesetzt: Sonst schickt der Browser den Typ, den er aus der Dateiendung rät.
        headers['Content-Type'] = 'application/octet-stream'
        requestBody = fileBody
      }
      const requestInit: RequestInit = { method, headers, body: requestBody, credentials: 'include' }
      if (apiRequest.abortSignal !== undefined) {
        requestInit.signal = apiRequest.abortSignal
      }
      sendOnce = () => this.fetchResponse(url, requestInit)
    }

    let response = await sendOnce()
    const sessionRenewalHandler = this.sessionRenewalHandler
    const isSharePath = apiRequest.path.startsWith(SHARE_PATH_PREFIX)
    const renewSession = response.status === 401 && !isSharePath && sessionRenewalHandler !== null
    if (renewSession) {
      const sessionRenewed = await sessionRenewalHandler()
      if (sessionRenewed) {
        response = await sendOnce()
      }
    }

    if (!response.ok) {
      const responseApiError = await this.readApiError(response)
      throw responseApiError
    }
    if (apiRequest.responseAsBlob === true) {
      const responseBlob = await this.readResponseBlob(response, apiRequest.onDownloadProgress)
      return responseBlob as T
    }
    return this.readResponseBody<T>(response)
  }

  /** Ein Aufruf von `fetch`; kommt keine Antwort, ein {@link ApiError} mit Status 0. */
  private async fetchResponse(url: string, requestInit: RequestInit): Promise<Response> {
    try {
      return await fetch(url, requestInit)
    } catch (networkError) {
      const requestAborted = requestInit.signal !== undefined && requestInit.signal !== null && requestInit.signal.aborted
      if (requestAborted) {
        throw new ApiError(0, 'Abgebrochen', 'Der Request wurde abgebrochen.')
      }
      const networkApiError = ApiError.from(networkError)
      throw new ApiError(0, 'Backend nicht erreichbar', networkApiError.detail)
    }
  }

  /**
   * Ein Multipart-Request über `XMLHttpRequest`, mit Fortschritt beim Senden. Die Antwort kommt als `Response` zurück,
   * damit Fehler und Body genau wie beim `fetch`-Weg gelesen werden. Kommt keine Antwort, ein {@link ApiError} mit
   * Status 0. Den Content-Type mit der Grenze (boundary) setzt der Browser selbst. Das `abortSignal` bricht ihn ab,
   * auch mitten im Senden.
   */
  private sendMultipartWithProgress(
    url: string,
    method: ApiMethod,
    multipartBody: FormData,
    onUploadProgress: UploadProgressListener | undefined,
    abortSignal: AbortSignal | undefined,
  ): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      if (abortSignal !== undefined && abortSignal.aborted) {
        reject(new ApiError(0, 'Abgebrochen', 'Das Hochladen wurde abgebrochen.'))
        return
      }
      const request = new XMLHttpRequest()
      request.open(method, url)
      request.withCredentials = true
      request.setRequestHeader('Accept', 'application/json')
      if (onUploadProgress !== undefined) {
        request.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) {
            onUploadProgress(progressEvent.loaded, progressEvent.total)
          }
        }
      }
      request.onload = () => {
        const contentType = request.getResponseHeader('Content-Type') ?? ''
        let responseBody: string | null = request.responseText
        // Eine Antwort ohne Inhalt darf keinen Body haben, sonst wirft der Response-Konstruktor
        if (request.status === 204) {
          responseBody = null
        }
        const responseHeaders = { 'Content-Type': contentType }
        const response = new Response(responseBody, { status: request.status, headers: responseHeaders })
        resolve(response)
      }
      request.onerror = () => {
        reject(new ApiError(0, 'Backend nicht erreichbar', 'Beim Hochladen kam keine Antwort vom Backend.'))
      }
      request.onabort = () => {
        reject(new ApiError(0, 'Abgebrochen', 'Das Hochladen wurde abgebrochen.'))
      }
      if (abortSignal !== undefined) {
        abortSignal.addEventListener('abort', () => request.abort(), { once: true })
      }
      request.send(multipartBody)
    })
  }

  /**
   * Liest den Body als Blob, Stück für Stück, damit `onDownloadProgress` den Fortschritt melden kann. Die Länge kommt aus
   * `Content-Length`, fehlt sie, ist sie 0. Der Typ des Blobs ist der `Content-Type` der Antwort.
   */
  private async readResponseBlob(
    response: Response,
    onDownloadProgress: DownloadProgressListener | undefined,
  ): Promise<Blob> {
    const responseBody = response.body
    if (onDownloadProgress === undefined || responseBody === null) {
      return response.blob()
    }
    const contentLengthText = response.headers.get('Content-Length') ?? '0'
    const totalBytes = Number(contentLengthText)
    const contentType = response.headers.get('Content-Type') ?? ''
    const responseBodyReader = responseBody.getReader()
    const receivedChunks: Uint8Array<ArrayBuffer>[] = []
    let receivedBytes = 0
    for (;;) {
      const readResult = await responseBodyReader.read()
      if (readResult.done) {
        break
      }
      const receivedChunk = readResult.value
      receivedChunks.push(receivedChunk)
      receivedBytes = receivedBytes + receivedChunk.byteLength
      onDownloadProgress(receivedBytes, totalBytes)
    }
    return new Blob(receivedChunks, { type: contentType })
  }

  private async readResponseBody<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T
    }
    const contentType = response.headers.get('Content-Type') ?? ''
    const isJson = contentType.includes('json')
    if (isJson) {
      const responseJson: unknown = await response.json()
      return responseJson as T
    }
    const responseText = await response.text()
    return responseText as T
  }

  /** Liest das ProblemDetail des Backends. Fehlt es, bleiben Status und Statustext. */
  private async readApiError(response: Response): Promise<ApiError> {
    const status = response.status
    const fallbackTitle = response.statusText
    const fallbackDetail = 'Der Request ist fehlgeschlagen (HTTP ' + status + ').'
    let problemDetail: ProblemDetail = {}
    try {
      problemDetail = (await response.json()) as ProblemDetail
    } catch {
      return new ApiError(status, fallbackTitle, fallbackDetail)
    }
    const title = problemDetail.title ?? fallbackTitle
    const detail = problemDetail.detail ?? fallbackDetail
    return new ApiError(status, title, detail)
  }
}
