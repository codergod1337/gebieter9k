/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adresse des Backends. Leer = gleiche Adresse wie das Frontend. */
  readonly VITE_API_BASE_URL: string | undefined
  /** Key des Admin-Rechts, wie gebiter.accessrole.admin-key im Backend. */
  readonly VITE_ADMIN_ACCESS_ROLE_KEY: string | undefined
  /** Key des File-Manager-Rechts, wie gebiter.accessrole.file-manager-key im Backend. */
  readonly VITE_FILE_MANAGER_ACCESS_ROLE_KEY: string | undefined
  /** Der Solr-Kern der Dateien, wie gebiter.file.solr-core-key im Backend. */
  readonly VITE_FILE_SOLR_CORE_KEY: string | undefined
  /** Höchstens so viele Dateien in einer Upload-Liste der FileDropzone. */
  readonly VITE_UPLOAD_MAX_FILES_PER_LIST: string | undefined
  /** So viele Dateien einer Upload-Liste gehen gleichzeitig zum Backend. */
  readonly VITE_UPLOAD_MAX_PARALLEL_UPLOADS: string | undefined
  readonly VITE_ONLINE_USERS_POLL_SECONDS: string | undefined
  /** So oft (Sekunden) fragt die Upload-Seite, ob die Auswertung einer Datei fertig ist. */
  readonly VITE_FILE_ANALYSIS_POLL_SECONDS: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
