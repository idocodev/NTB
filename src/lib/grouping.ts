import { CATEGORIES, OTHER, isCategory, type Category } from './categories'
import type { Item } from './types'

export interface Section {
  category: Category
  items: Item[]
}

export interface Grouped {
  sections: Section[]
  bought: Item[]
}

/** Open items grouped by store section (in store order, empty sections left out), oldest first; bought items newest first. */
export function groupItems(items: readonly Item[]): Grouped {
  const byCategory = new Map<Category, Item[]>()
  const bought: Item[] = []
  for (const item of items) {
    if (item.bought) {
      bought.push(item)
      continue
    }
    const category = isCategory(item.category) ? item.category : OTHER
    const list = byCategory.get(category)
    if (list) list.push(item)
    else byCategory.set(category, [item])
  }
  const sections = CATEGORIES.filter((c) => byCategory.has(c)).map((category) => ({
    category,
    items: byCategory.get(category)!.sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }))
  bought.sort((a, b) => (b.bought_at ?? b.updated_at).localeCompare(a.bought_at ?? a.updated_at))
  return { sections, bought }
}
