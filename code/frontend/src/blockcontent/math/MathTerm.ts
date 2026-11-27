import type { MathTermVisitor } from './MathTermVisitor.ts'

/**
 * Ein Term einer Formel: der Baustein, aus dem sich jede Formel als Baum zusammensetzt, z. B. das Symbol `r`, der Bruch
 * `x / r` oder das Produkt `r · cos φ`. Ein Term ändert sich nach dem Anlegen nicht; derselbe Term darf deshalb in
 * mehreren Formeln stehen.
 *
 * Ein Term weiß nichts von seiner Anzeige. Wer mit dem Baum etwas tut (zeichnen, später rechnen), ist ein
 * {@link MathTermVisitor}: Der Term reicht sich über {@link accept} an dessen passende Methode weiter. Eine neue Art
 * von Term ist eine neue Klasse in diesem Ordner und eine neue Methode im Visitor.
 */
export abstract class MathTerm {
  abstract accept<Result>(visitor: MathTermVisitor<Result>): Result
}
