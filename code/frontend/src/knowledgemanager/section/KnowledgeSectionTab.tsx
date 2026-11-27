import type { KnowledgeSection } from '../../knowledge/section/KnowledgeSection.ts'
import { getKnowledgeChapters, getKnowledgeRubrics, getKnowledgeSubChapters } from '../../knowledge/section/knowledgeSectionTree.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useUrlParam, useUrlParamsChanger } from '../../navigation/useUrlParam.ts'
import { KnowledgeSectionLevelBox } from './KnowledgeSectionLevelBox.tsx'
import {
  KNOWLEDGE_CHAPTER_TEXTS,
  KNOWLEDGE_RUBRIC_TEXTS,
  KNOWLEDGE_SECTION_TEXTS,
  KNOWLEDGE_SUB_CHAPTER_TEXTS,
} from './knowledgeSectionTexts.ts'

/** Die Parameter der Adresse: die gewählte Rubrik und das gewählte Kapitel, je mit ihrem Key. */
const RUBRIC_URL_PARAM = 'rubric'
const CHAPTER_URL_PARAM = 'chapter'

/** Die Kennungen der drei Tabellen für die Spalteneinstellungen des Users. */
const RUBRIC_TABLE_SETTING_KEY = 'KNOWLEDGE_RUBRIC'
const CHAPTER_TABLE_SETTING_KEY = 'KNOWLEDGE_CHAPTER'
const SUB_CHAPTER_TABLE_SETTING_KEY = 'KNOWLEDGE_SUB_CHAPTER'

/**
 * Reiter „Gliederung“ im Wissensmanager (Nutzer 2026-11-27: „das mapping der ganzen keys zum anzeigetext“ pflegen):
 * drei Boxen untereinander. Oben alle Rubriken, darunter die Kapitel der gewählten Rubrik, darunter die Unterkapitel
 * des gewählten Kapitels ({@link KnowledgeSectionLevelBox}). Gewählt wird über den Knopf „Darin“ einer Zeile; die Wahl
 * steht in der Adresse (`?rubric=MATHE&chapter=GRUNDLAGEN`). Die Gliederung kommt aus den Stammdaten und wird nach jeder
 * Änderung neu geladen. Auch die Keys lassen sich ändern (Klick auf den Key). Löschen gibt es noch nicht.
 */
export function KnowledgeSectionTab() {
  const masterData = useMasterData()
  const rubricUrlParam = useUrlParam(RUBRIC_URL_PARAM)
  const chapterUrlParam = useUrlParam(CHAPTER_URL_PARAM)
  const changeUrlParams = useUrlParamsChanger()
  const allKnowledgeSections = masterData.knowledgeSections
  const reloadMasterData = masterData.reload

  // die drei Ebenen aus der einen Liste: Rubriken; Kapitel der gewählten Rubrik; Unterkapitel des gewählten Kapitels
  let rubrics: KnowledgeSection[] | null = null
  let chapters: KnowledgeSection[] | null = null
  let subChapters: KnowledgeSection[] | null = null
  let selectedRubric: KnowledgeSection | null = null
  let selectedChapter: KnowledgeSection | null = null
  if (allKnowledgeSections !== null) {
    rubrics = getKnowledgeRubrics(allKnowledgeSections)
    chapters = []
    subChapters = []
    const foundRubric = rubrics.find((rubric) => rubric.rubricKey === rubricUrlParam.value)
    if (foundRubric !== undefined) {
      selectedRubric = foundRubric
      chapters = getKnowledgeChapters(allKnowledgeSections, foundRubric.rubricKey)
      const foundChapter = chapters.find((chapter) => chapter.chapterKey === chapterUrlParam.value)
      if (foundChapter !== undefined && foundChapter.chapterKey !== null) {
        selectedChapter = foundChapter
        subChapters = getKnowledgeSubChapters(allKnowledgeSections, foundRubric.rubricKey, foundChapter.chapterKey)
      }
    }
  }

  /** Eine Rubrik wählen: ihre Kapitel stehen darunter, ein gewähltes Kapitel der alten Rubrik fällt weg. */
  function selectRubric(rubric: KnowledgeSection) {
    changeUrlParams({ [RUBRIC_URL_PARAM]: rubric.rubricKey, [CHAPTER_URL_PARAM]: null }, 'PUSH')
  }

  function selectChapter(chapter: KnowledgeSection) {
    chapterUrlParam.changeValue(chapter.chapterKey, 'PUSH')
  }

  /**
   * Der Key einer Rubrik hat sich geändert: War sie die gewählte, nennt die Adresse noch den alten Key. Sie bekommt
   * den neuen (REPLACE, es ist dieselbe Ansicht), sonst wäre nach dem Ändern plötzlich nichts mehr gewählt.
   */
  function followChangedRubricKey(rubricBefore: KnowledgeSection, changedKey: string) {
    const wasSelected = rubricBefore.rubricKey === rubricUrlParam.value
    if (wasSelected) {
      rubricUrlParam.changeValue(changedKey, 'REPLACE')
    }
  }

  /** Dasselbe für das gewählte Kapitel. */
  function followChangedChapterKey(chapterBefore: KnowledgeSection, changedKey: string) {
    const wasSelected = chapterBefore.chapterKey === chapterUrlParam.value
    if (wasSelected) {
      chapterUrlParam.changeValue(changedKey, 'REPLACE')
    }
  }

  /** Ein Unterkapitel steht nie in der Adresse: Nach dem Ändern seines Keys ist nichts nachzuführen. */
  function ignoreChangedSubChapterKey() {
    // nichts zu tun
  }

  function countChaptersOfRubric(rubric: KnowledgeSection): number {
    if (allKnowledgeSections === null) {
      return 0
    }
    const chaptersOfRubric = getKnowledgeChapters(allKnowledgeSections, rubric.rubricKey)
    return chaptersOfRubric.length
  }

  function countSubChaptersOfChapter(chapter: KnowledgeSection): number {
    if (allKnowledgeSections === null || chapter.chapterKey === null) {
      return 0
    }
    const subChaptersOfChapter = getKnowledgeSubChapters(allKnowledgeSections, chapter.rubricKey, chapter.chapterKey)
    return subChaptersOfChapter.length
  }

  let loadErrorMessage: string | null = null
  if (masterData.error !== null) {
    loadErrorMessage = masterData.error.detail
  }
  let selectedRubricId: number | null = null
  if (selectedRubric !== null) {
    selectedRubricId = selectedRubric.id
  }
  let selectedChapterId: number | null = null
  if (selectedChapter !== null) {
    selectedChapterId = selectedChapter.id
  }

  return (
    <>
      <p className="knowledge-section-intro">{getTextInCurrentLanguage(KNOWLEDGE_SECTION_TEXTS.intro)}</p>
      <KnowledgeSectionLevelBox
        level="RUBRIC"
        levelTexts={KNOWLEDGE_RUBRIC_TEXTS}
        settingKey={RUBRIC_TABLE_SETTING_KEY}
        parentKnowledgeSection={null}
        knowledgeSections={rubrics}
        loadErrorMessage={loadErrorMessage}
        countChildren={countChaptersOfRubric}
        selectedKnowledgeSectionId={selectedRubricId}
        onSelect={selectRubric}
        onChanged={reloadMasterData}
        onKeyChanged={followChangedRubricKey}
      />
      <KnowledgeSectionLevelBox
        level="CHAPTER"
        levelTexts={KNOWLEDGE_CHAPTER_TEXTS}
        settingKey={CHAPTER_TABLE_SETTING_KEY}
        parentKnowledgeSection={selectedRubric}
        knowledgeSections={chapters}
        loadErrorMessage={null}
        countChildren={countSubChaptersOfChapter}
        selectedKnowledgeSectionId={selectedChapterId}
        onSelect={selectChapter}
        onChanged={reloadMasterData}
        onKeyChanged={followChangedChapterKey}
      />
      <KnowledgeSectionLevelBox
        level="SUB_CHAPTER"
        levelTexts={KNOWLEDGE_SUB_CHAPTER_TEXTS}
        settingKey={SUB_CHAPTER_TABLE_SETTING_KEY}
        parentKnowledgeSection={selectedChapter}
        knowledgeSections={subChapters}
        loadErrorMessage={null}
        countChildren={null}
        selectedKnowledgeSectionId={null}
        onSelect={null}
        onChanged={reloadMasterData}
        onKeyChanged={ignoreChangedSubChapterKey}
      />
    </>
  )
}
