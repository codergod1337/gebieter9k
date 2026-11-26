import Alert from 'react-bootstrap/Alert'
import { ContentBox } from '../../../components/ContentBox.tsx'
import { getTextInCurrentLanguage } from '../../../language/getTextInCurrentLanguage.ts'
import { DerivationBox } from '../../derivation/DerivationBox.tsx'
import { EquationView } from '../../math/EquationView.tsx'
import { ANGLE_DERIVATION } from './angleDerivation.ts'
import { CoordinateTransformationSketch } from './CoordinateTransformationSketch.tsx'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'
import { RADIUS_DERIVATION } from './radiusDerivation.ts'
import { X_COORDINATE_DERIVATION } from './xCoordinateDerivation.ts'
import { Y_COORDINATE_DERIVATION } from './yCoordinateDerivation.ts'

/**
 * Die Seite „Koordinatentransformation“ im Kapitel „Grundlagen“ (`/wissen/grundlagen/koordinatentransformation`):
 * worum es geht samt Skizze, dann die vier Umrechnungen zwischen kartesischen und Polarkoordinaten als Herleitungen
 * zum Durchklicken, am Ende die vier Ergebnisse auf einen Blick.
 */
export function CoordinateTransformationPage() {
  const xCoordinateResult = X_COORDINATE_DERIVATION.getResultEquation()
  const yCoordinateResult = Y_COORDINATE_DERIVATION.getResultEquation()
  const radiusResult = RADIUS_DERIVATION.getResultEquation()
  const angleResult = ANGLE_DERIVATION.getResultEquation()

  return (
    <>
      <ContentBox title={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.introTitle)}>
        <div className="knowledge-intro">
          <div className="knowledge-text">
            <p>{getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.introTwoWays)}</p>
            <p>{getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.introTriangle)}</p>
            <p>{getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.introHowToRead)}</p>
          </div>
          <CoordinateTransformationSketch />
        </div>
      </ContentBox>

      <DerivationBox
        title={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.xCoordinateTitle)}
        derivation={X_COORDINATE_DERIVATION}
      />
      <DerivationBox
        title={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.yCoordinateTitle)}
        derivation={Y_COORDINATE_DERIVATION}
      />
      <DerivationBox title={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.radiusTitle)} derivation={RADIUS_DERIVATION} />
      <DerivationBox title={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.angleTitle)} derivation={ANGLE_DERIVATION} />

      <ContentBox title={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.summaryTitle)}>
        <div className="knowledge-summary">
          <section className="knowledge-summary-group">
            <h3 className="knowledge-summary-heading">
              {getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.summaryPolarToCartesian)}
            </h3>
            <div className="knowledge-summary-equation">
              <EquationView equation={xCoordinateResult} />
            </div>
            <div className="knowledge-summary-equation">
              <EquationView equation={yCoordinateResult} />
            </div>
          </section>
          <section className="knowledge-summary-group">
            <h3 className="knowledge-summary-heading">
              {getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.summaryCartesianToPolar)}
            </h3>
            <div className="knowledge-summary-equation">
              <EquationView equation={radiusResult} />
            </div>
            <div className="knowledge-summary-equation">
              <EquationView equation={angleResult} />
            </div>
          </section>
        </div>
        <Alert variant="warning" className="knowledge-hint">
          {getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.summaryArctangentHint)}
        </Alert>
      </ContentBox>
    </>
  )
}
