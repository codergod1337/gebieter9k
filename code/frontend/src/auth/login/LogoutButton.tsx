import Button from 'react-bootstrap/Button'
import { useCurrentSession } from './useCurrentSession.ts'

/** Der Knopf zum Abmelden. */
export function LogoutButton() {
  const { logout } = useCurrentSession()

  async function handleClick() {
    await logout()
  }

  return (
    <Button variant="outline-secondary" size="sm" onClick={handleClick}>
      <i className="bi bi-box-arrow-right me-1"></i>
      Abmelden
    </Button>
  )
}
