import { describe, expect, it } from 'vitest'
import { makeItem } from './backend'
import { groupItems } from './grouping'
import type { Item } from './types'

const item = (name: string, extra: Partial<Item> = {}) => makeItem('k', { name, ...extra })

describe('groupItems', () => {
  it('groups open items by section in store order and leaves out empty sections', () => {
    const { sections, bought } = groupItems([
      item('סבון', { category: 'ניקיון וטואלטיקה' }),
      item('חסה', { category: 'ירקות ופירות' }),
      item('חלב', { category: 'מוצרי חלב' }),
      item('עגבניות', { category: 'ירקות ופירות' }),
    ])
    expect(sections.map((s) => s.category)).toEqual(['ירקות ופירות', 'מוצרי חלב', 'ניקיון וטואלטיקה'])
    expect(sections[0].items.map((i) => i.name)).toEqual(['חסה', 'עגבניות'])
    expect(bought).toEqual([])
  })

  it('puts unknown or missing sections under אחר', () => {
    const { sections } = groupItems([item('x', { category: null }), item('y', { category: 'משהו' })])
    expect(sections).toHaveLength(1)
    expect(sections[0].category).toBe('אחר')
    expect(sections[0].items).toHaveLength(2)
  })

  it('orders items in a section oldest first', () => {
    const { sections } = groupItems([
      item('b', { category: 'מזווה', created_at: '2026-10-02T00:00:00Z' }),
      item('a', { category: 'מזווה', created_at: '2026-10-01T00:00:00Z' }),
    ])
    expect(sections[0].items.map((i) => i.name)).toEqual(['a', 'b'])
  })

  it('moves bought items out of their sections, newest first', () => {
    const { sections, bought } = groupItems([
      item('old', { category: 'מזווה', bought: true, bought_at: '2026-10-01T10:00:00Z' }),
      item('open', { category: 'מזווה' }),
      item('new', { category: 'קפואים', bought: true, bought_at: '2026-10-02T10:00:00Z' }),
    ])
    expect(sections.map((s) => s.category)).toEqual(['מזווה'])
    expect(sections[0].items.map((i) => i.name)).toEqual(['open'])
    expect(bought.map((i) => i.name)).toEqual(['new', 'old'])
  })
})
