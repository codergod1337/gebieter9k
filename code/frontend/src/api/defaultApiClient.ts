import { ApiClient } from './ApiClient.ts'

/**
 * Der eine ApiClient der Anwendung. Die Adresse des Backends kommt aus der Vite-Umgebung
 * (`VITE_API_BASE_URL` in `.env.development` bzw. `.env.production`), nie aus dem Code.
 * Ein leerer Wert heißt: gleiche Adresse wie das Frontend, z. B. hinter nginx auf dem Pi.
 */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
if (apiBaseUrl === undefined) {
  throw new Error('VITE_API_BASE_URL fehlt in der Vite-Umgebung (.env.development / .env.production).')
}

export const defaultApiClient = new ApiClient(apiBaseUrl)
