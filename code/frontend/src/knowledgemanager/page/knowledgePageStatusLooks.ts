import type { StatusMarkLook } from '../../components/StatusMark.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { KNOWLEDGE_PAGE_TEXTS } from './knowledgePageTexts.ts'

/** Die Status einer Wissensseite, wie das Enum `KnowledgePageStatus` im Backend, in der Reihenfolge der Auswahl. */
export const KNOWLEDGE_PAGE_STATUSES: string[] = ['DRAFT', 'PUBLISHED', 'DELETED']

/** Der Status, in dem Besucher eine Seite sehen. */
export const KNOWLEDGE_PAGE_STATUS_PUBLISHED = 'PUBLISHED'

/** Wie ein Status aussieht: Farbe, Symbol und Text in Worten (nie der Wert selbst). */
export function getKnowledgePageStatusLook(status: string | null): StatusMarkLook {
  if (status === 'DRAFT') {
    return { tone: 'NEUTRAL', iconClassName: 'bi bi-pencil', label: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.statusDraft) }
  }
  if (status === 'PUBLISHED') {
    return {
      tone: 'SUCCESS',
      iconClassName: 'bi bi-check-circle',
      label: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.statusPublished),
    }
  }
  if (status === 'DELETED') {
    return { tone: 'DANGER', iconClassName: 'bi bi-trash', label: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.statusDeleted) }
  }
  return {
    tone: 'NEUTRAL',
    iconClassName: 'bi bi-question-circle',
    label: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.statusUnknown),
  }
}
