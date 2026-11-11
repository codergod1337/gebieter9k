import { Outlet } from 'react-router'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { ACHIEVEMENT_TAB_PATH } from './achievement/achievementPaths.ts'
import { POINT_ACTIVITY_TAB_PATH } from './pointactivity/pointActivityPaths.ts'
import { SHOP_CATEGORY_TAB_PATH } from './shopcategory/shopCategoryPaths.ts'
import { SHOP_CATEGORY_TEXTS } from './shopcategory/shopCategoryTexts.ts'

/** Die Tabs des Moduls. Vom Gebietermarkt gibt es bisher die Rubriken; Artikel und Angebote kommen dazu. */
const ACHIEVEMENT_MANAGER_TABS: SubheaderTab[] = [
  { label: 'Achievements', iconClassName: 'bi bi-award', to: ACHIEVEMENT_TAB_PATH },
  { label: 'Tätigkeiten', iconClassName: 'bi bi-coin', to: POINT_ACTIVITY_TAB_PATH },
  { label: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.tabLabel), iconClassName: 'bi bi-shop', to: SHOP_CATEGORY_TAB_PATH },
]

/**
 * Das Modul „Achievements & Markt“ (Nutzer 2026-11-09), vorerst nur ADMIN, später vielleicht ein Moderator-Modul:
 * alles zu Achievements, Punkten und dem Gebietermarkt. Subheader mit den Tabs, darunter der gewählte Tab.
 */
export function AchievementManager() {
  const subheaderStatus = (
    <>
      <i className="bi bi-award me-2"></i>
      Achievements &amp; Markt
    </>
  )
  return (
    <>
      <Subheader status={subheaderStatus} tabs={ACHIEVEMENT_MANAGER_TABS} />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  )
}
