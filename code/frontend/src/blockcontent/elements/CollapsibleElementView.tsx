import Button from 'react-bootstrap/Button'
import { useCollapsibleOpenState } from './collapsibleState.ts'
import type { ElementViewProps } from './ElementViewProps.ts'

/**
 * Ein Aufklapper: sein Titel als Knopf (z. B. „Rechenweg“), sein Inhalt erst nach einem Klick, ein zweiter Klick klappt
 * ihn wieder zu. Ob er offen ist, steht in der Adresse ({@link useCollapsibleOpenState}).
 */
export function CollapsibleElementView({ element, children }: ElementViewProps<'COLLAPSIBLE'>) {
  const collapsibleOpenState = useCollapsibleOpenState()
  const open = collapsibleOpenState.openCollapsibleGuids.includes(element.guid)
  let iconClassName = 'bi bi-chevron-right me-1'
  if (open) {
    iconClassName = 'bi bi-chevron-down me-1'
  }
  return (
    <div className="blockcontent-collapsible">
      <Button
        size="sm"
        variant="outline-secondary"
        className="blockcontent-collapsible-toggle"
        aria-expanded={open}
        onClick={() => collapsibleOpenState.toggleCollapsible(element.guid)}>
        <i className={iconClassName} aria-hidden="true"></i>
        {element.title}
      </Button>
      {open && <div className="blockcontent-collapsible-content">{children}</div>}
    </div>
  )
}
