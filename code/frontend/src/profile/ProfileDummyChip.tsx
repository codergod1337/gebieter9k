/**
 * Kennzeichnet einen Bereich des Profils, der noch nicht echt ist: Platzhalter zum Hinschieben, bis wir wissen, was
 * wir dort wirklich brauchen. Fällt weg, sobald der Bereich echte Daten hat.
 */
export function ProfileDummyChip() {
  return (
    <span className="profile-dummy-chip">
      <i className="bi bi-cone-striped"></i>
      Dummy
    </span>
  )
}
