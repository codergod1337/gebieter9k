import { MarkedTerm } from '../../math/MarkedTerm.ts'
import { SymbolTerm } from '../../math/SymbolTerm.ts'
import { TermMark } from '../../math/TermMark.ts'

/**
 * Die vier Größen der Seite „Koordinatentransformation“, jede mit ihrer Marke: An der Kennung erkennt eine Herleitung
 * die Größe in zwei Schritten wieder, und der Platz in der Palette gibt ihr auf der ganzen Seite dieselbe Farbe, in
 * jeder Formel und in der Skizze.
 */

/** Die kartesische Koordinate x. */
const xCoordinateSymbol = new SymbolTerm('x')
export const X_COORDINATE_MARK = new TermMark('xCoordinate', 'FIRST')
export const X_COORDINATE = new MarkedTerm(xCoordinateSymbol, X_COORDINATE_MARK)

/** Die kartesische Koordinate y. */
const yCoordinateSymbol = new SymbolTerm('y')
export const Y_COORDINATE_MARK = new TermMark('yCoordinate', 'SECOND')
export const Y_COORDINATE = new MarkedTerm(yCoordinateSymbol, Y_COORDINATE_MARK)

/** Der Abstand r vom Ursprung. */
const radiusSymbol = new SymbolTerm('r')
export const RADIUS_MARK = new TermMark('radius', 'THIRD')
export const RADIUS = new MarkedTerm(radiusSymbol, RADIUS_MARK)

/** Der Winkel φ zur x-Achse. */
const angleSymbol = new SymbolTerm('φ')
export const ANGLE_MARK = new TermMark('angle', 'FOURTH')
export const ANGLE = new MarkedTerm(angleSymbol, ANGLE_MARK)
