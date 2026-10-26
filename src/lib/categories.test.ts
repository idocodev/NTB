import { describe, expect, it } from 'vitest'
import { guessCategory, normalize } from './categories'
import { SEED } from './seed'

describe('guessCategory', () => {
  it('guesses the section of every item on the current list', () => {
    for (const item of SEED) expect([item.name, guessCategory(item.name)]).toEqual([item.name, item.category])
  })

  it('handles common items', () => {
    expect(guessCategory('מלפפונים')).toBe('ירקות ופירות')
    expect(guessCategory('גבינה צהובה')).toBe('מוצרי חלב')
    expect(guessCategory('פיתות')).toBe('מאפים ולחם')
    expect(guessCategory('אורז בסמטי')).toBe('מזווה')
    expect(guessCategory('נייר טואלט')).toBe('ניקיון וטואלטיקה')
    expect(guessCategory('חול לחתול')).toBe('חיות מחמד')
    expect(guessCategory('טיטולים מידה 1')).toBe('תינוק')
    expect(guessCategory('סוללות')).toBe('אחר')
  })

  it('lets the more specific section win', () => {
    expect(guessCategory('אפונה קפואה')).toBe('קפואים')
    expect(guessCategory('מגבונים לתינוק')).toBe('תינוק')
    expect(guessCategory('מגבונים')).toBe('ניקיון וטואלטיקה')
  })

  it('strips Hebrew prefixes without matching inside words', () => {
    expect(guessCategory('והחלב')).toBe('מוצרי חלב')
    expect(guessCategory('ושום')).toBe('ירקות ופירות')
    expect(guessCategory('תהילה')).toBe('אחר') // not "תה"
  })

  it('accepts other geresh characters', () => {
    expect(guessCategory('קוטג׳ 5%')).toBe('מוצרי חלב')
  })

  it('follows a section the user picked before', () => {
    expect(guessCategory('תמרים', { [normalize('תמרים')]: 'ירקות ופירות' })).toBe('ירקות ופירות')
    expect(guessCategory('תמרים', { [normalize('תמרים')]: 'not a section' })).toBe('מזווה')
  })

  it('returns אחר for empty input', () => {
    expect(guessCategory('   ')).toBe('אחר')
  })
})
