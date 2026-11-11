import { Outlet } from 'react-router'
import { Subheader } from '../../components/Subheader.tsx'

/**
 * Der Rahmen um die Seiten einer Datei (`/file/<id>` und Viewer), wie die Dokumentseite der Vorlage aus jedem
 * Modul erreichbar: Subheader mit „Datei“, darunter die Seite. Zurück geht es über das „Zurück zu …“ des Origins.
 */
export function FileDocumentModule() {
  const subheaderStatus = (
    <>
      <i className="bi bi-file-earmark-image me-2"></i>
      Datei
    </>
  )
  return (
    <>
      <Subheader status={subheaderStatus} />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  )
}
