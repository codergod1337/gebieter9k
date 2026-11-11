import { useCallback, useMemo } from 'react'
import { useUsersSettings } from '../userssetting/useUsersSettings.ts'
import { MIN_COLUMN_REM } from './tableColumnWidths.ts'

/** Was sich eine Tabelle je User merkt, wie in der Vorlage: Breiten in rem je Spalte und die ausgeblendeten Spalten. */
export type TableUsersSettings = {
  widths: Record<string, number>
  hidden: string[]
}

/** Der Schlüssel der Einstellung je Tabelle: `TABLE_` plus die Kennung der Tabelle, z. B. `TABLE_SOLR_FIELD`. */
export const TABLE_SETTING_KEY_PREFIX = 'TABLE_'

const EMPTY_TABLE_USER_SETTINGS: TableUsersSettings = { widths: {}, hidden: [] }

/** Der gespeicherte Wert als JSON; kaputt oder leer heißt Standard. */
export function parseTableUsersSettings(rawSettingValue: string | null): TableUsersSettings {
  if (rawSettingValue === null) {
    return EMPTY_TABLE_USER_SETTINGS
  }
  try {
    const parsedSettingValue: unknown = JSON.parse(rawSettingValue)
    if (typeof parsedSettingValue !== 'object' || parsedSettingValue === null) {
      return EMPTY_TABLE_USER_SETTINGS
    }
    const widths: Record<string, number> = {}
    const rawWidths: unknown = 'widths' in parsedSettingValue ? parsedSettingValue.widths : null
    if (typeof rawWidths === 'object' && rawWidths !== null) {
      for (const [columnKey, widthRem] of Object.entries(rawWidths)) {
        const validWidth = typeof widthRem === 'number' && Number.isFinite(widthRem) && widthRem >= MIN_COLUMN_REM
        if (validWidth) {
          widths[columnKey] = widthRem
        }
      }
    }
    const rawHidden: unknown = 'hidden' in parsedSettingValue ? parsedSettingValue.hidden : null
    let hidden: string[] = []
    if (Array.isArray(rawHidden)) {
      hidden = rawHidden.filter((entry): entry is string => typeof entry === 'string')
    }
    return { widths, hidden }
  } catch {
    return EMPTY_TABLE_USER_SETTINGS
  }
}

export type TableUsersSettingsState = {
  /** false ohne Kennung: dann gibt es weder Ziehen noch Ausblenden */
  adjustable: boolean
  /** der Schlüssel der Einstellung, z. B. `TABLE_SOLR_FIELD`; `null` ohne Kennung. Steht im Spalten-Popup. */
  settingName: string | null
  settings: TableUsersSettings
  setColumnWidth: (columnKey: string, widthRem: number) => void
  toggleHidden: (columnKey: string) => void
  resetWidths: () => void
  resetAll: () => void
}

/**
 * Die Einstellungen einer Tabelle je User, wie in der Vorlage: gespeichert als eigene Einstellung `TABLE_<Kennung>`
 * über den {@link UsersSettingProvider}, sofort wirksam, beim nächsten Laden wiederhergestellt. Ohne Kennung gilt der
 * Standard. Ist nichts mehr eingestellt, wird die Einstellung gelöscht.
 */
export function useTableUsersSettings(settingKey: string | undefined): TableUsersSettingsState {
  const usersSettings = useUsersSettings()
  let settingName: string | null = null
  if (settingKey !== undefined) {
    settingName = TABLE_SETTING_KEY_PREFIX + settingKey
  }
  let rawSettingValue: string | null = null
  if (settingName !== null) {
    rawSettingValue = usersSettings.settingValue(settingName)
  }
  const settings = useMemo(() => parseTableUsersSettings(rawSettingValue), [rawSettingValue])

  const save = useCallback(
    (changedSettings: TableUsersSettings) => {
      if (settingName === null) {
        return
      }
      const widthCount = Object.keys(changedSettings.widths).length
      const nothingSet = widthCount === 0 && changedSettings.hidden.length === 0
      if (nothingSet) {
        usersSettings.deleteSetting(settingName)
        return
      }
      const changedSettingValue = JSON.stringify(changedSettings)
      usersSettings.changeSetting(settingName, changedSettingValue)
    },
    [settingName, usersSettings],
  )

  const setColumnWidth = useCallback(
    (columnKey: string, widthRem: number) => {
      const changedWidths = { ...settings.widths, [columnKey]: widthRem }
      save({ ...settings, widths: changedWidths })
    },
    [save, settings],
  )
  const toggleHidden = useCallback(
    (columnKey: string) => {
      const alreadyHidden = settings.hidden.includes(columnKey)
      let changedHidden: string[]
      if (alreadyHidden) {
        changedHidden = settings.hidden.filter((hiddenColumnKey) => hiddenColumnKey !== columnKey)
      } else {
        changedHidden = [...settings.hidden, columnKey]
      }
      save({ ...settings, hidden: changedHidden })
    },
    [save, settings],
  )
  const resetWidths = useCallback(() => save({ ...settings, widths: {} }), [save, settings])
  const resetAll = useCallback(() => save(EMPTY_TABLE_USER_SETTINGS), [save])

  const adjustable = settingName !== null
  return { adjustable, settingName, settings, setColumnWidth, toggleHidden, resetWidths, resetAll }
}
