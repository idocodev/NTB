export type Person = 'Ido' | 'Noa'

export interface Item {
  id: string
  list_key: string
  name: string
  quantity: string | null
  note: string | null
  category: string | null
  added_by: string | null
  bought: boolean
  bought_by: string | null
  bought_at: string | null
  created_at: string
  updated_at: string
  source: 'web' | 'nano'
}

export const PEOPLE: Record<Person, string> = { Ido: 'עידו', Noa: 'נועה' }

export function personLabel(p: string | null | undefined): string | null {
  if (!p) return null
  return (PEOPLE as Record<string, string>)[p] ?? p
}
