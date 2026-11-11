import { useCallback, useState } from 'react'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { PageNavigation } from '../components/PageNavigation.tsx'
import { Table, type TableColumn } from '../components/Table.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { USERS_POINT_BOOKING_REASON_LABELS, type UsersPointBooking } from '../users/UsersPointBooking.ts'
import { useUsersPointBooking } from '../users/useUsersPointBooking.ts'

/** Breiten und ausgeblendete Spalten je User (UsersSetting `TABLE_USERS_POINT_BOOKING`). */
const USERS_POINT_BOOKING_TABLE_SETTING_KEY = 'USERS_POINT_BOOKING'

/** Punkte mit Vorzeichen und Tausenderpunkt, z. B. „+1.000“ oder „−50“. */
function formatSignedPoints(amountPoints: number): string {
  const absoluteText = Math.abs(amountPoints).toLocaleString('de-DE')
  if (amountPoints < 0) {
    return '−' + absoluteText
  }
  return '+' + absoluteText
}

/**
 * Box „Punktekonto“ im eigenen Profil (Nutzer 2026-11-09): der Kontostand und darunter der Kontoauszug, die neuesten
 * Buchungen zuerst: wann, wofür, wie viel rein oder raus, Stand danach. Nur lesen; gebucht wird nur im Backend. Der Stand
 * kommt aus `Users.points`, nie aufsummiert.
 */
export function ProfilePointsBox() {
  const { achievements, pointActivities } = useMasterData()
  const usersPointBookingHook = useUsersPointBooking()
  const resolveOwnUsersPointBookingPage = usersPointBookingHook.resolveOwnUsersPointBookingPage
  const [page, setPage] = useState<number>(0)
  const loadPage = useCallback(() => resolveOwnUsersPointBookingPage(page), [resolveOwnUsersPointBookingPage, page])
  const loadedPage = useLoadedData(loadPage)
  const bookingPage = loadedPage.data

  let errorMessage: string | null = null
  if (usersPointBookingHook.error !== null) {
    errorMessage = usersPointBookingHook.error.detail
  }

  /** Wofür, in Worten: der Grund und, bei einem Achievement, sein Name. */
  function describeBooking(booking: UsersPointBooking): string {
    const reasonLabel = USERS_POINT_BOOKING_REASON_LABELS[booking.bookingReason]
    if (booking.bookingReason === 'ACHIEVEMENT_REWARD' && booking.referenceKey !== null) {
      const achievement = (achievements ?? []).find((candidate) => candidate.key === booking.referenceKey)
      if (achievement !== undefined) {
        return reasonLabel + ': ' + getTextInCurrentLanguage(achievement.displayName)
      }
      return reasonLabel + ': ' + booking.referenceKey
    }
    if (booking.bookingReason === 'ACTIVITY_REWARD' && booking.referenceKey !== null) {
      const pointActivity = (pointActivities ?? []).find((candidate) => candidate.key === booking.referenceKey)
      if (pointActivity !== undefined) {
        return getTextInCurrentLanguage(pointActivity.displayName)
      }
      return reasonLabel + ': ' + booking.referenceKey
    }
    return reasonLabel
  }

  const columns: TableColumn<UsersPointBooking>[] = [
    {
      header: 'Wann',
      key: 'BOOKED_AT',
      width: '10rem',
      cell: (booking) => <DateTimeText isoDateTime={booking.bookedAt} label="Gebucht" />,
    },
    {
      header: 'Wofür',
      key: 'REASON',
      cell: (booking) => describeBooking(booking),
    },
    {
      header: 'Punkte',
      key: 'AMOUNT',
      width: '6rem',
      headerHint: 'Rein mit +, raus mit −.',
      cellClassName: 'text-end',
      cell: (booking) => {
        let amountClassName = 'profile-points-amount is-incoming'
        if (booking.amountPoints < 0) {
          amountClassName = 'profile-points-amount is-outgoing'
        }
        return <span className={amountClassName}>{formatSignedPoints(booking.amountPoints)}</span>
      },
    },
    {
      header: 'Stand',
      key: 'BALANCE_AFTER',
      width: '6rem',
      headerHint: 'Der Kontostand nach dieser Buchung.',
      cellClassName: 'text-end',
      unimportant: true,
      cell: (booking) => booking.balanceAfter.toLocaleString('de-DE'),
    },
  ]

  let pageCount = 1
  let footerText = ''
  if (bookingPage !== null) {
    pageCount = Math.max(1, Math.ceil(bookingPage.totalCount / bookingPage.pageSize))
    footerText = bookingPage.totalCount.toLocaleString('de-DE') + ' Buchungen'
  }

  return (
    <ContentBox title="Punktekonto" footer={footerText}>
      <ErrorAlert message={errorMessage} />
      {bookingPage !== null && (
        <>
          <div className="profile-points-balance">
            <span className="profile-points-balance-value">{bookingPage.pointBalance.toLocaleString('de-DE')}</span>
            <span className="profile-points-balance-label">Punkte</span>
          </div>
          <Table
            columns={columns}
            rows={bookingPage.bookings}
            rowKey={(booking) => String(booking.id)}
            detailTitle={(booking) => describeBooking(booking)}
            emptyText="Noch keine Buchungen. Punkte gibt es z. B. für Achievements."
            settingKey={USERS_POINT_BOOKING_TABLE_SETTING_KEY}
          />
          <PageNavigation
            page={page}
            pageCount={pageCount}
            disabled={usersPointBookingHook.isLoading}
            onPageChange={setPage}
            ariaLabel="Seiten des Kontoauszugs"
          />
        </>
      )}
    </ContentBox>
  )
}
