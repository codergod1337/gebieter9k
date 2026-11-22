import type { CSSProperties } from 'react'
import { getDefaultUploadFrameColor, getUsersUploadFrameColor } from '../users/getUsersUploadFrameColor.ts'
import { useUsersAvatarForClient } from '../users/useUsersAvatarForClient.ts'

type UsersUploadFrameSwatchProps = {
  usersGuid: string
  /**
   * Optional statt der gespeicherten Farbe: eine Farbe, die gerade gewählt, aber noch nicht gespeichert ist (Vorschau im
   * Profil). `null`: die Farbe aus der GUID.
   */
  previewColor?: string | null
}

/**
 * Die Rahmenfarbe der Uploads eines Users als kleines Farbfeld, überall gleich (Nutzer 2026-11-22): in der Legende über
 * den Bildern einer gemeinsamen Galerie, in der Liste ihrer Uploadberechtigten und als Vorschau im Profil. Nur die GUID
 * einsetzen: Die Farbe kommt aus {@link getUsersUploadFrameColor} (im Profil gewählt, sonst aus der GUID), die
 * Darstellung des Users lädt die Seite je GUID einmal. Maße in `base.css`, Form im Theme (`.upload-frame-swatch`).
 */
export function UsersUploadFrameSwatch({ usersGuid, previewColor }: UsersUploadFrameSwatchProps) {
  const usersAvatar = useUsersAvatarForClient(usersGuid)
  let uploadFrameColor = getUsersUploadFrameColor(usersGuid, usersAvatar)
  if (previewColor === null) {
    uploadFrameColor = getDefaultUploadFrameColor(usersGuid)
  } else if (previewColor !== undefined) {
    uploadFrameColor = previewColor
  }
  const swatchStyle = { '--upload-frame-color': uploadFrameColor } as CSSProperties
  return <span className="upload-frame-swatch" style={swatchStyle} aria-hidden="true"></span>
}
