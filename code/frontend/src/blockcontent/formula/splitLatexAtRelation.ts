/** Eine Gleichung, an ihrem Relationszeichen geteilt: was links steht, das Zeichen selbst, was rechts steht. */
export type LatexRelationSplit = {
  left: string
  relation: string
  right: string
}

/** Zeichen, die für sich eine Relation sind. */
const RELATION_CHARACTERS = ['=', '<', '>']

/** Befehle, die eine Relation setzen (ohne den Schrägstrich davor). */
const RELATION_COMMAND_NAMES = [
  'approx',
  'equiv',
  'neq',
  'ne',
  'leq',
  'le',
  'geq',
  'ge',
  'll',
  'gg',
  'sim',
  'simeq',
  'cong',
  'propto',
  'coloneq',
  'coloneqq',
  'Rightarrow',
  'Leftarrow',
  'Leftrightarrow',
  'rightarrow',
  'leftarrow',
  'leftrightarrow',
  'to',
  'mapsto',
  'implies',
  'iff',
]

const LETTER_PATTERN = /[A-Za-z]/

/** Der Name des Befehls, der an dieser Stelle mit `\` beginnt: seine Buchstaben, oder das eine Zeichen dahinter (`\{`, `\,`). */
function readCommandName(latex: string, backslashPosition: number): string {
  let position = backslashPosition + 1
  let commandName = ''
  while (position < latex.length && LETTER_PATTERN.test(latex[position])) {
    commandName = commandName + latex[position]
    position = position + 1
  }
  if (commandName === '' && position < latex.length) {
    return latex[position]
  }
  return commandName
}

/**
 * Teilt das LaTeX einer Gleichung an ihrem ersten Relationszeichen auf oberster Ebene (`=`, `\approx`, `\le`, `\Rightarrow`
 * …): So stehen die Zeichen aufeinanderfolgender Gleichungen untereinander, und ein Teil, der die Seite wechselt, kann
 * auf einem Bogen wandern. „Oberste Ebene“ heißt: nicht in geschweiften Klammern (also auch nicht in einem Teil mit id,
 * einem Bruch, einem Index), nicht zwischen `\left` und `\right`, nicht in einer Umgebung (`\begin` … `\end`).
 * Ohne solches Zeichen kommt `null`: Die Formel bleibt dann ein Stück.
 */
export function splitLatexAtRelation(latex: string): LatexRelationSplit | null {
  let braceDepth = 0
  let delimiterDepth = 0
  let environmentDepth = 0
  let position = 0
  while (position < latex.length) {
    const character = latex[position]
    const onTopLevel = braceDepth === 0 && delimiterDepth === 0 && environmentDepth === 0
    if (character === '\\') {
      const commandName = readCommandName(latex, position)
      const commandEnd = position + 1 + commandName.length
      if (commandName === 'left') {
        delimiterDepth = delimiterDepth + 1
        // das Zeichen hinter \left gehört zur Klammer (auch ein `<`), es ist keine Relation
        position = skipDelimiter(latex, commandEnd)
        continue
      }
      if (commandName === 'right') {
        delimiterDepth = Math.max(0, delimiterDepth - 1)
        position = skipDelimiter(latex, commandEnd)
        continue
      }
      if (commandName === 'begin') {
        environmentDepth = environmentDepth + 1
      } else if (commandName === 'end') {
        environmentDepth = Math.max(0, environmentDepth - 1)
      } else if (onTopLevel && RELATION_COMMAND_NAMES.includes(commandName)) {
        const left = latex.slice(0, position)
        const relation = latex.slice(position, commandEnd)
        const right = latex.slice(commandEnd)
        return { left, relation, right }
      }
      position = Math.max(commandEnd, position + 1)
      continue
    }
    if (character === '{') {
      braceDepth = braceDepth + 1
    } else if (character === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
    } else if (onTopLevel && RELATION_CHARACTERS.includes(character)) {
      const left = latex.slice(0, position)
      const right = latex.slice(position + 1)
      return { left, relation: character, right }
    }
    position = position + 1
  }
  return null
}

/** Die Stelle hinter dem Klammerzeichen, das auf `\left` oder `\right` folgt (ein Zeichen oder ein Befehl wie `\langle`). */
function skipDelimiter(latex: string, fromPosition: number): number {
  let position = fromPosition
  while (position < latex.length && latex[position] === ' ') {
    position = position + 1
  }
  if (position >= latex.length) {
    return position
  }
  if (latex[position] === '\\') {
    const delimiterName = readCommandName(latex, position)
    return position + 1 + delimiterName.length
  }
  return position + 1
}
