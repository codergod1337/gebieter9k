import type { KnowledgeChapter } from '../KnowledgeChapter.ts'
import type { KnowledgePage } from '../KnowledgePage.ts'
import { BASICS_CHAPTER_TEXTS } from './basicsChapterTexts.ts'
import { CoordinateTransformationPage } from './coordinatetransformation/CoordinateTransformationPage.tsx'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinatetransformation/coordinateTransformationTexts.ts'

/** Die Seite „Koordinatentransformation“: `/wissen/grundlagen/koordinatentransformation`. */
const coordinateTransformationPage: KnowledgePage = {
  pathSegment: 'koordinatentransformation',
  title: COORDINATE_TRANSFORMATION_TEXTS.pageTitle,
  summary: COORDINATE_TRANSFORMATION_TEXTS.pageSummary,
  ContentComponent: CoordinateTransformationPage,
}

/** Das Kapitel „Grundlagen“ unter `/wissen/grundlagen`. Eine neue Seite ist ein neuer Ordner hier und ein Eintrag in `pages`. */
export const BASICS_CHAPTER: KnowledgeChapter = {
  pathSegment: 'grundlagen',
  title: BASICS_CHAPTER_TEXTS.chapterTitle,
  iconClassName: 'bi bi-rulers',
  pages: [coordinateTransformationPage],
}
