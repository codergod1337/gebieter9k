import { ContentBox } from '../../components/ContentBox.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Eine ContentBox des Inhalts: die ContentBox der Plattform mit ihrem Titel, darin ihre Elemente. */
export function ContentBoxElementView({ element, children }: ElementViewProps<'CONTENT_BOX'>) {
  return <ContentBox title={element.title}>{children}</ContentBox>
}
