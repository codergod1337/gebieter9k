# DiscardedSymbol

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Symbol, das im Icon-Manager gelöscht wurde: Es gefällt nicht und taucht nirgends mehr zur Auswahl auf. Die Icon-Pakete selbst lassen sich nicht ausdünnen, deshalb merkt sich diese Tabelle, was ausgeblendet ist. Wieder einblenden heißt, die Zeile zu löschen. Ein Symbol ist Paket plus Name, z. B. `gameicons` und `3d-glasses`.

- **Tabelle:** `discarded_symbol`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/symbol/model/DiscardedSymbol.java`](../../code/backend/src/main/java/de/gebiter/symbol/model/DiscardedSymbol.java)
- **Frontend-Typ:** [`code/frontend/src/iconmanager/DiscardedSymbol.ts`](../../code/frontend/src/iconmanager/DiscardedSymbol.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "symbolPack": "Beispieltext",
  "symbolName": "Beispielname"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `symbolPack` | `String` | Pflicht, max. 120 Zeichen, unveränderlich | ja | Das Icon-Paket, z. B. `bootstrap`, `tabler`, `lucide`, `gameicons`, `pixelart`. |
| `symbolName` | `String` | Pflicht, max. 120 Zeichen, unveränderlich | ja | Der Name im Paket, z. B. `3d-glasses`. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/discarded-symbol` | [`DiscardedSymbolAdminController.createDiscardedSymbols`](../../code/backend/src/main/java/de/gebiter/symbol/controller/DiscardedSymbolAdminController.java) | `DiscardedSymbol` |
| GET | `/api/admin/discarded-symbol` | [`DiscardedSymbolAdminController.getAllDiscardedSymbol`](../../code/backend/src/main/java/de/gebiter/symbol/controller/DiscardedSymbolAdminController.java) | `DiscardedSymbol` |
| DELETE | `/api/admin/discarded-symbol` | [`DiscardedSymbolAdminController.deleteDiscardedSymbols`](../../code/backend/src/main/java/de/gebiter/symbol/controller/DiscardedSymbolAdminController.java) | (eigener Controller) |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/symbol/controller/DiscardedSymbolAdminController.java`](../../code/backend/src/main/java/de/gebiter/symbol/controller/DiscardedSymbolAdminController.java): `createDiscardedSymbols`, `getAllDiscardedSymbol`
- [`code/backend/src/main/java/de/gebiter/symbol/repository/DiscardedSymbolRepository.java`](../../code/backend/src/main/java/de/gebiter/symbol/repository/DiscardedSymbolRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/symbol/service/DiscardedSymbolService.java`](../../code/backend/src/main/java/de/gebiter/symbol/service/DiscardedSymbolService.java): `createDiscardedSymbols`, `getAllDiscardedSymbol`

## Verwendung im Frontend

- [`code/frontend/src/iconmanager/IconManager.tsx`](../../code/frontend/src/iconmanager/IconManager.tsx): (Typ)
- [`code/frontend/src/iconmanager/useDiscardedSymbol.ts`](../../code/frontend/src/iconmanager/useDiscardedSymbol.ts): `useDiscardedSymbol`, `createDiscardedSymbols`, `getAllDiscardedSymbol`
