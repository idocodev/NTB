import { normalize } from './categories'
import type { Person } from './types'

const WHO = 'ntb:who'
const LEARNED = 'ntb:learned'

/** Who uses this device: a person, 'skip' (asked, declined), or null (not asked yet). */
export function readWho(): Person | 'skip' | null {
  const v = localStorage.getItem(WHO)
  return v === 'Ido' || v === 'Noa' || v === 'skip' ? v : null
}

export function saveWho(who: Person | 'skip') {
  localStorage.setItem(WHO, who)
}

/** Sections the user chose by hand, by normalized item name, so the next guess for that name follows them. */
export function readLearned(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LEARNED) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function learnCategory(name: string, category: string) {
  const learned = readLearned()
  learned[normalize(name)] = category
  localStorage.setItem(LEARNED, JSON.stringify(learned))
}
