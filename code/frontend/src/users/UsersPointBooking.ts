/** Wofür eine Buchung ist, wie `UsersPointBookingReason` im Backend. */
export type UsersPointBookingReason = 'ACHIEVEMENT_REWARD' | 'ACTIVITY_REWARD' | 'SHOP_PURCHASE' | 'SHOP_SALE'

/**
 * Eine Buchung im Kontobuch der Punkte, wie das Backend sie liefert (Tabelle `users_point_booking`): was rein- oder
 * rausging, wofür, wann und der Stand danach. Gebucht wird nur im Backend.
 * Doku: `docu/entities/UsersPointBooking.md`
 */
export type UsersPointBooking = {
  id: number
  usersGuid: string
  /** positiv: rein, negativ: raus */
  amountPoints: number
  /** der Kontostand nach dieser Buchung */
  balanceAfter: number
  bookingReason: UsersPointBookingReason
  /** woher als Key, z. B. der Key des Achievements oder der Tätigkeit; bei Kauf und Verkauf die id der Datei */
  referenceKey: string | null
  /** was entstand: id des Abschlusses, Eintrags, Kommentars oder SHA-256 der Datei; bei Kauf und Verkauf die id des Belegs */
  referenceId: string | null
  bookedAt: string
  /** wer sie ausgelöst hat, `null`: das System */
  bookedByUsersGuid: string | null
}

/**
 * Eine Seite des eigenen Kontoauszugs, wie `UsersPointBookingPage` im Backend.
 * Doku: `docu/entities/UsersPointBooking.md`
 */
export type UsersPointBookingPage = {
  pointBalance: number
  bookings: UsersPointBooking[]
  totalCount: number
  page: number
  pageSize: number
}

/** Wie ein Grund im Kontoauszug heißt (nie den Enum-Wert zeigen). */
export const USERS_POINT_BOOKING_REASON_LABELS: Record<UsersPointBookingReason, string> = {
  ACHIEVEMENT_REWARD: 'Achievement',
  ACTIVITY_REWARD: 'Tätigkeit',
  SHOP_PURCHASE: 'Kauf im Gebietermarkt',
  SHOP_SALE: 'Verkauf im Gebietermarkt',
}
