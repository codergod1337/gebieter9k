import {
  BADGE_EFFECT_OPTIONS,
  BADGE_GRADIENT_OPTIONS,
  BADGE_STRUCTURE_OPTIONS,
  type BadgeEffect,
  type BadgeLook,
  type BadgeStructure,
} from './BadgeLook.ts'

function pickRandom<T>(items: T[]): T {
  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex]
}

/** Eine Farbe aus Farbton, Sättigung und Helligkeit (je 0–100 bzw. 0–360) als `#rrggbb`. */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const saturationFraction = saturation / 100
  const lightnessFraction = lightness / 100
  const chroma = (1 - Math.abs(2 * lightnessFraction - 1)) * saturationFraction
  const hueSection = hue / 60
  const secondLargest = chroma * (1 - Math.abs((hueSection % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0
  if (hueSection < 1) {
    red = chroma
    green = secondLargest
  } else if (hueSection < 2) {
    red = secondLargest
    green = chroma
  } else if (hueSection < 3) {
    green = chroma
    blue = secondLargest
  } else if (hueSection < 4) {
    green = secondLargest
    blue = chroma
  } else if (hueSection < 5) {
    red = secondLargest
    blue = chroma
  } else {
    red = chroma
    blue = secondLargest
  }
  const lightnessOffset = lightnessFraction - chroma / 2
  const channels = [red, green, blue].map((channel) => {
    const channelValue = Math.round((channel + lightnessOffset) * 255)
    return channelValue.toString(16).padStart(2, '0')
  })
  return '#' + channels.join('')
}

/**
 * Würfelt ein stimmiges Aussehen, z. B. zum Ausprobieren im Editor: zwei Farben mit verwandtem Farbton, eine Struktur
 * (manchmal keine), bis zu drei Effekte. Das Symbol bleibt, wie es ist.
 */
export function randomBadgeLook(currentLook: BadgeLook): BadgeLook {
  const baseHue = Math.floor(Math.random() * 360)
  const hueShift = 20 + Math.floor(Math.random() * 60)
  const endHue = (baseHue + hueShift) % 360
  const gradientStartColor = hslToHex(baseHue, 65, 48)
  const gradientEndColor = hslToHex(endHue, 70, 22)

  const gradientOption = pickRandom(BADGE_GRADIENT_OPTIONS)
  let structure: BadgeStructure | null = null
  if (Math.random() < 0.7) {
    const structureOption = pickRandom(BADGE_STRUCTURE_OPTIONS)
    structure = structureOption.value
  }
  const effectCount = Math.floor(Math.random() * 4)
  const effects: BadgeEffect[] = []
  for (let effectIndex = 0; effectIndex < effectCount; effectIndex++) {
    const effectOption = pickRandom(BADGE_EFFECT_OPTIONS)
    if (!effects.includes(effectOption.value)) {
      effects.push(effectOption.value)
    }
  }
  let chosenEffects: BadgeEffect[] | null = null
  if (effects.length > 0) {
    chosenEffects = effects
  }

  const borderColor = hslToHex(baseHue, 60, 70)
  const shadowColor = hslToHex(baseHue, 90, 60)
  return {
    ...currentLook,
    gradient: gradientOption.value,
    structure,
    effects: chosenEffects,
    gradientStartColor,
    gradientEndColor,
    textColor: '#ffffff',
    textShadowColor: '#000000',
    borderColor,
    shadowColor,
    structureColor: null,
  }
}
