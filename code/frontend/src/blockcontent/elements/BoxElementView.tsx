import { ContentBox } from '../../components/ContentBox.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Ein Kasten des Inhalts: die ContentBox der Plattform mit seinem Titel, darin seine Elemente. */
export function BoxElementView({ element, children }: ElementViewProps<'BOX'>) {
  return <ContentBox title={element.title}>{children}</ContentBox>
}
