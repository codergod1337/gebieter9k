import { type ReactNode, useEffect, useRef } from 'react'
import Nav from 'react-bootstrap/Nav'
import { NavLink, useLocation } from 'react-router'

/** Ein Tab im Subheader: Beschriftung, Symbol und Ziel. */
export type SubheaderTab = {
  label: string
  /** Bootstrap-Icon-Klassen, z. B. `bi bi-people`. */
  iconClassName: string
  to: string
  /** Nur bei genau dieser Adresse aktiv, nicht auch bei den Seiten darunter (z. B. „Übersicht“ neben „Galerien“). */
  end?: boolean
}

type SubheaderProps = {
  /** Links die Statuszelle: der Name des Moduls, z. B. Symbol und „Administration“. */
  status: ReactNode
  /** Optional, ohne Tabs nur die Statuszelle (z. B. im Profil). */
  tabs?: SubheaderTab[]
}

/**
 * Der eine Subheader aller Module, wie in der Vorlage: Statuszelle, dahinter die Tabs. Ihn rendert allein das Modul,
 * in dem man ist, nie das Grundgerüst. Jeder Tab ist eine Route, der aktive bekommt von `NavLink` die Klasse `active`.
 * Er bleibt unter dem Header stehen. Passen nicht alle Tabs hin, wischt man die Leiste seitlich, der aktive Tab wird
 * dabei in die Mitte geschoben.
 */
export function Subheader({ status, tabs = [] }: SubheaderProps) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  // Den aktiven Tab in die Mitte der Leiste schieben, nur waagerecht, die Seite bleibt stehen
  useEffect(() => {
    const tabStrip = tabsRef.current
    if (tabStrip === null) {
      return
    }
    const activeTab = tabStrip.querySelector<HTMLElement>('.nav-link.active')
    if (activeTab === null) {
      return
    }
    const activeTabLeft = activeTab.getBoundingClientRect().left
    const tabStripLeft = tabStrip.getBoundingClientRect().left
    const activeTabOffset = activeTabLeft - tabStripLeft
    const centeringGap = (tabStrip.clientWidth - activeTab.offsetWidth) / 2
    tabStrip.scrollLeft += activeTabOffset - centeringGap
  }, [pathname])

  return (
    <nav className="subheader">
      <span className="subheader-status">{status}</span>
      {tabs.length > 0 && (
        <Nav ref={tabsRef} className="subheader-tabs">
          {tabs.map((tab) => {
            const tabIconClasses = tab.iconClassName + ' me-1'
            return (
              <Nav.Item key={tab.to}>
                <Nav.Link as={NavLink} to={tab.to} end={tab.end}>
                  <i className={tabIconClasses}></i>
                  {tab.label}
                </Nav.Link>
              </Nav.Item>
            )
          })}
        </Nav>
      )}
    </nav>
  )
}
