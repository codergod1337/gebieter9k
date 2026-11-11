type HighlightedTextProps = {
  text: string
  /** Die gesuchte Zeichenfolge, ohne Groß- und Kleinschreibung. Leer: nichts markiert. */
  searchText: string
}

/** Ein Text, in dem jede Fundstelle der Suche markiert ist (`<mark>`), z. B. in einer Auswahl mit Suchfeld. */
export function HighlightedText({ text, searchText }: HighlightedTextProps) {
  const trimmedSearchText = searchText.trim()
  if (trimmedSearchText === '') {
    return <>{text}</>
  }
  const lowerCaseText = text.toLowerCase()
  const lowerCaseSearchText = trimmedSearchText.toLowerCase()
  const textParts: { content: string; matches: boolean; start: number }[] = []
  let position = 0
  while (position < text.length) {
    const matchIndex = lowerCaseText.indexOf(lowerCaseSearchText, position)
    if (matchIndex < 0) {
      textParts.push({ content: text.slice(position), matches: false, start: position })
      break
    }
    if (matchIndex > position) {
      textParts.push({ content: text.slice(position, matchIndex), matches: false, start: position })
    }
    const matchEnd = matchIndex + lowerCaseSearchText.length
    textParts.push({ content: text.slice(matchIndex, matchEnd), matches: true, start: matchIndex })
    position = matchEnd
  }
  return (
    <>
      {textParts.map((textPart) => {
        if (textPart.matches) {
          return <mark key={textPart.start}>{textPart.content}</mark>
        }
        return <span key={textPart.start}>{textPart.content}</span>
      })}
    </>
  )
}
