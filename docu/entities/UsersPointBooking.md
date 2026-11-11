# UsersPointBooking

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Doku: `docu/entities/UsersPointBooking.md`.

- **Tabelle:** `users_point_booking`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersPointBooking.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersPointBooking.java)
- **Frontend-Typ:** [`code/frontend/src/users/UsersPointBooking.ts`](../../code/frontend/src/users/UsersPointBooking.ts)
- **DTOs:** `UsersPointBookingPage`, `UsersPointBookingResolveRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "amountPoints": 0,
  "balanceAfter": 0,
  "bookingReason": "ACHIEVEMENT_REWARD",
  "referenceKey": "BEISPIEL_KEY",
  "referenceId": "Beispieltext",
  "bookedAt": "2026-11-09T14:05:27Z",
  "bookedByUsersGuid": "77777777-7777-7777-7777-777777777777"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, Spalte `users_guid`, unveränderlich | ja | Wessen Konto. |
| `amountPoints` | `long` | Pflicht, unveränderlich | ja | Wie viele Punkte, positiv: rein, negativ: raus. |
| `balanceAfter` | `long` | Pflicht, unveränderlich | ja | Der Kontostand nach dieser Buchung. |
| `bookingReason` | `UsersPointBookingReason` | Enum als Text, Pflicht, max. 50 Zeichen, Spalte `booking_reason`, unveränderlich | ja | Wofür: `ACHIEVEMENT_REWARD`, `ACTIVITY_REWARD`, seit 2026-11-11 `SHOP_PURCHASE` (Kauf im Gebietermarkt, beim Käufer, negativ) und `SHOP_SALE` (Verkauf, beim Verkäufer, Preis abzüglich Marktgebühr). In der Pi-DB sichert die Prüfregel `users_point_booking_booking_reason_check` die erlaubten Werte; ein neuer Grund braucht sie neu. |
| `referenceKey` | `String` | max. 100 Zeichen, Spalte `reference_key`, unveränderlich | ja | Woher, als Key zum Anzeigen, z. B. der Key des Achievements (`ONLINE_STUNDE`) oder der Tätigkeit; bei Kauf und Verkauf die id der Datei (SHA-256). |
| `referenceId` | `String` | max. 100 Zeichen, Spalte `reference_id`, unveränderlich | ja | Woher, zum Nachvollziehen: die id der Zeile in `users_achievement`, des Gästebucheintrags oder Kommentars oder der SHA-256 der Datei, bei Kauf und Verkauf die id des Belegs ([ShopOrder](ShopOrder.md)); mit Grund und Key höchstens einmal. |
| `bookedAt` | `Instant` | Pflicht, Spalte `booked_at`, unveränderlich | ja | Wann gebucht, von der Uhr des Servers. |
| `bookedByUsersGuid` | `UUID` | unveränderlich | ja | Wer die Buchung ausgelöst hat; `null`: das System selbst, z. B. für ein Achievement. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/users-point-booking/resolve` | [`UsersPointBookingController.resolveOwnUsersPointBookingPage`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersPointBookingController.java) | `UsersPointBookingPage`, `UsersPointBookingResolveRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/dto/UsersPointBookingPage.java`](../../code/backend/src/main/java/de/gebiter/users/dto/UsersPointBookingPage.java): `(Record-Komponenten)`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersPointBookingRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersPointBookingRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersPointBookingService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersPointBookingService.java): `createAchievementRewardBooking`, `createActivityRewardBooking`, `createShopPurchaseBooking`, `createShopSaleBooking` (beide nur vom `ShopOrderService` gerufen, in der Transaktion des Kaufs), `resolveOwnUsersPointBookingPage`, `doCreateUsersPointBooking`

## Verwendung im Frontend

- [`code/frontend/src/profile/ProfilePointsBox.tsx`](../../code/frontend/src/profile/ProfilePointsBox.tsx): `ProfilePointsBox`, `loadPage`, `describeBooking` („Kauf im Gebietermarkt“, „Verkauf im Gebietermarkt“ aus `USERS_POINT_BOOKING_REASON_LABELS`)
- [`code/frontend/src/users/useUsersPointBooking.ts`](../../code/frontend/src/users/useUsersPointBooking.ts): `useUsersPointBooking`, `resolveOwnUsersPointBookingPage`
