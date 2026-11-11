/** Eine Authenticator-App mit ihren Links in die beiden Stores. */
type AuthenticatorApp = {
  name: string
  /** Bootstrap-Icon des Herstellers, als Vorschau-Symbol */
  iconClassName: string
  googlePlayUrl: string
  appStoreUrl: string
}

/**
 * Die Grundauswahl (Wunsch des Nutzers 2026-11-08): Google und Microsoft, je für Android und iPhone. Links geprüft am
 * 2026-11-08, alle vier antworten mit der richtigen App.
 */
const AUTHENTICATOR_APPS: AuthenticatorApp[] = [
  {
    name: 'Google Authenticator',
    iconClassName: 'bi bi-google',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
    appStoreUrl: 'https://apps.apple.com/app/google-authenticator/id388497605',
  },
  {
    name: 'Microsoft Authenticator',
    iconClassName: 'bi bi-microsoft',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.azure.authenticator',
    appStoreUrl: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
  },
]

/**
 * Wo man eine Authenticator-App bekommt: Google und Microsoft, je mit einem Knopf zu Google Play (Android) und zum App
 * Store (iPhone). Jede andere TOTP-App geht genauso, derselbe QR-Code gilt für alle.
 */
export function AuthenticatorAppLinks() {
  return (
    <div className="mb-3">
      <p className="small text-body-secondary mb-2">
        Noch keine App? Eine davon laden, oder jede andere Authenticator-App nehmen:
      </p>
      <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
        {AUTHENTICATOR_APPS.map((authenticatorApp) => (
          <li key={authenticatorApp.name} className="d-flex flex-wrap align-items-center gap-2">
            <span className="d-flex align-items-center gap-2 me-auto">
              <i className={authenticatorApp.iconClassName} aria-hidden="true"></i>
              <strong>{authenticatorApp.name}</strong>
            </span>
            <a
              className="btn btn-outline-secondary btn-sm"
              href={authenticatorApp.googlePlayUrl}
              target="_blank"
              rel="noopener noreferrer">
              <i className="bi bi-google-play me-1" aria-hidden="true"></i>
              Android
            </a>
            <a
              className="btn btn-outline-secondary btn-sm"
              href={authenticatorApp.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer">
              <i className="bi bi-apple me-1" aria-hidden="true"></i>
              iPhone
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
