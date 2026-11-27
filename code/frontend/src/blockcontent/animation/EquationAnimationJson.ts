/**
 * Was mit einem Teil einer Gleichung beim Übergang zur nächsten geschieht, so wie es gespeichert wird:
 *
 * - `MOVES_TO`: Der Teil mit der id `id` wandert an die Stelle des Teils `target` der NÄCHSTEN Gleichung.
 * - `CANCELLED`: Der Teil mit der id `id` wird durchgestrichen, bevor die nächste Gleichung erscheint.
 * - `APPEARS`: Der Teil mit der id `id` der NÄCHSTEN Gleichung kommt aus der Notiz der Umformung (z. B. das `r` aus
 *   „· r“).
 */
export type AnimationActionJson =
  | { id: string; does: 'MOVES_TO'; target: string }
  | { id: string; does: 'CANCELLED' }
  | { id: string; does: 'APPEARS' }

/**
 * Die Animation EINES Übergangs (Nutzer 2026-11-27: „wir müssen ja nur die gleichungsnummer angeben und dann welches
 * element mit welcher id sich wie in der nächsten gleichungsnummer verhält“): von der Gleichung mit der festen Kennung
 * `from` zur nächsten Gleichung im Inhalt. `note` ist die Notiz der Umformung als LaTeX, wie man sie hinter den Strich
 * am Zeilenende schreibt (z. B. `\cdot r`); freiwillig.
 */
export type EquationAnimationJson = {
  from: string
  note?: string | null
  actions: AnimationActionJson[]
}
