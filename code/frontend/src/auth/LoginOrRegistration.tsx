import { useState } from 'react'
import { LoginForm } from './login/LoginForm.tsx'
import { RegistrationForm } from './register/RegistrationForm.tsx'

/** Für nicht angemeldete Besucher: das Login-Formular, auf Wunsch die Registrierung. */
export function LoginOrRegistration() {
  const [showRegistration, setShowRegistration] = useState<boolean>(false)

  function handleShowRegistration() {
    setShowRegistration(true)
  }

  function handleShowLogin() {
    setShowRegistration(false)
  }

  if (showRegistration) {
    return <RegistrationForm onShowLogin={handleShowLogin} />
  }
  return <LoginForm onShowRegistration={handleShowRegistration} />
}
