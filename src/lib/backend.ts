// Where the list lives: Supabase (shared, realtime) or an in-memory demo list.
import type { RealtimeChannel } from '@supabase/supabase-js'
import { SEED } from './seed'
import { config, supabase } from './supabase'
import type { Item } from './types'

export type Change = { type: 'upsert'; item: Item } | { type: 'delete'; id: string }
export type Status = 'connecting' | 'live' | 'offline'
export type Patch = Partial<Pick<Item, 'name' | 'quantity' | 'note' | 'category' | 'bought' | 'bought_by' | 'bought_at'>>

export interface Backend {
  listKey: string
  /** Cache the last list on this device for offline reading. */
  cache: boolean
  load(): Promise<Item[]>
  subscribe(onChange: (c: Change) => void, onStatus: (s: Status) => void, onResync: () => void): () => void
  insert(items: Item[], actor: string | null): Promise<void>
  update(id: string, patch: Patch, actor: string | null): Promise<void>
  remove(id: string, actor: string | null): Promise<void>
  clearBought(actor: string | null): Promise<void>
}

export function newId(): string {
  return crypto.randomUUID()
}

export function makeItem(listKey: string, fields: Pick<Item, 'name'> & Partial<Item>): Item {
  const now = new Date().toISOString()
  return {
    id: newId(),
    list_key: listKey,
    quantity: null,
    note: null,
    category: null,
    added_by: null,
    bought: false,
    bought_by: null,
    bought_at: null,
    created_at: now,
    updated_at: now,
    source: 'web',
    ...fields,
  }
}

function check<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message)
  return res
}

export function supabaseBackend(): Backend | null {
  if (!supabase || !config) return null
  const db = supabase
  const listKey = config.listKey
  const items = () => db.from('items')
  const withActor = <B extends { setHeader(n: string, v: string): B }>(b: B, actor: string | null) =>
    actor ? b.setHeader('x-ntb-actor', actor) : b

  return {
    listKey,
    cache: true,
    async load() {
      const res = check(await items().select('*').eq('list_key', listKey).order('created_at'))
      return (res.data ?? []) as Item[]
    },
    subscribe(onChange, onStatus, onResync) {
      onStatus('connecting')
      const filter = `list_key=eq.${listKey}`
      const channel: RealtimeChannel = db
        .channel(`items:${listKey.slice(0, 8)}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter }, (p) =>
          onChange({ type: 'upsert', item: p.new as Item }),
        )
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter }, (p) =>
          onChange({ type: 'upsert', item: p.new as Item }),
        )
        // DELETE events can't be filtered and carry only the id; removing an unknown id is a no-op.
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (p) => {
          const id = (p.old as { id?: string }).id
          if (id) onChange({ type: 'delete', id })
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            onStatus('live')
            onResync() // catch up on anything missed while disconnected
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            onStatus('offline')
          }
        })
      return () => {
        void db.removeChannel(channel)
      }
    },
    async insert(rows, actor) {
      check(await withActor(items().insert(rows), actor))
    },
    async update(id, patch, actor) {
      check(await withActor(items().update(patch).eq('id', id).eq('list_key', listKey), actor))
    },
    async remove(id, actor) {
      check(await withActor(items().delete().eq('id', id).eq('list_key', listKey), actor))
    },
    async clearBought(actor) {
      check(await db.rpc('clear_bought', { p_list_key: listKey, p_actor: actor, p_source: 'web' }))
    },
  }
}

/** A local list for ?demo (seeded) and ?demo=empty, so the UI can be tried without a database. */
export function demoBackend(seeded: boolean): Backend {
  const listKey = 'demo'
  const base = Date.now() - 3 * 24 * 3600_000
  let rows: Item[] = seeded
    ? SEED.map((s, i) =>
        makeItem(listKey, {
          name: s.name,
          quantity: s.quantity ?? null,
          category: s.category,
          added_by: i % 3 === 1 ? 'Noa' : 'Ido',
          created_at: new Date(base + i * 60_000).toISOString(),
        }),
      )
    : []
  if (seeded) {
    for (const name of ['עגבניות', 'בננות', 'מרכך כביסה']) {
      const r = rows.find((x) => x.name === name)!
      Object.assign(r, { bought: true, bought_by: 'Noa', bought_at: new Date(base + 9e6).toISOString() })
    }
  }
  return {
    listKey,
    cache: false,
    async load() {
      return rows.map((r) => ({ ...r }))
    },
    subscribe(_onChange, onStatus) {
      onStatus('live')
      return () => {}
    },
    async insert(items) {
      rows = [...rows, ...items]
    },
    async update(id, patch) {
      rows = rows.map((r) => (r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r))
    },
    async remove(id) {
      rows = rows.filter((r) => r.id !== id)
    },
    async clearBought() {
      rows = rows.filter((r) => !r.bought)
    },
  }
}
