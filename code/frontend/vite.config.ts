import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type ServerOptions } from 'vite'

/** Das selbst signierte Zertifikat des Dev-Servers (Anleitung: docu/neuer-rechner.md, Schritt 3). Nie ins Git. */
const DEV_CERTIFICATE_PATH = '.cert/dev-cert.pem'
const DEV_PRIVATE_KEY_PATH = '.cert/dev-key.pem'

/** Wohin der Dev-Server alles unter /api weiterreicht: das Backend auf dem Mac. */
const BACKEND_URL = 'http://localhost:8080'

/**
 * Der Dev-Server (npm run dev), auch für andere Rechner im LAN (z. B. den PC): https://192.168.1.28:3000.
 *
 * - host: alle Schnittstellen, nicht nur localhost.
 * - https: Krypto-API (Passwort-Hash beim Login), Web Locks (Sitzungserneuerung) und Zwischenablage gibt es im Browser
 *   nur in einem sicheren Kontext; über http wäre das nur auf localhost so. Firefox fragt beim ersten Aufruf einmal nach.
 * - proxy: Der Browser spricht nur mit dem Dev-Server, der reicht /api an das Backend weiter. So muss der PC das Backend
 *   nicht kennen, Cookies, Bilder und Videos laufen über dieselbe Adresse, und CORS spielt keine Rolle. Den Origin-Header
 *   nimmt der Proxy heraus, sonst hielte Spring jede Anfrage vom PC für fremd.
 */
function createDevServerOptions(): ServerOptions {
  const certificateMissing = !fs.existsSync(DEV_CERTIFICATE_PATH) || !fs.existsSync(DEV_PRIVATE_KEY_PATH)
  if (certificateMissing) {
    throw new Error(
      'Zertifikat des Dev-Servers fehlt (' + DEV_CERTIFICATE_PATH + '). Anlegen wie in docu/neuer-rechner.md, Schritt 3 beschrieben.',
    )
  }
  const devCertificate = fs.readFileSync(DEV_CERTIFICATE_PATH)
  const devPrivateKey = fs.readFileSync(DEV_PRIVATE_KEY_PATH)
  return {
    port: 3000,
    strictPort: true,
    host: true,
    // Auch über den Namen erreichbar, den die FritzBox vergibt (Zentrum-der-Macht.fritz.box), nicht nur über die IP
    allowedHosts: ['.fritz.box', '.local'],
    https: { cert: devCertificate, key: devPrivateKey },
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        configure: (proxyServer) => {
          proxyServer.on('proxyReq', (proxyRequest) => {
            proxyRequest.removeHeader('origin')
          })
        },
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Nur der Dev-Server braucht Zertifikat und Proxy; der Build (npm run build) läuft auch ohne.
  if (command === 'serve') {
    const devServerOptions = createDevServerOptions()
    return { plugins: [react()], server: devServerOptions }
  }
  return { plugins: [react()] }
})
