import { useCallback, useEffect, useRef, useState } from 'react'
import type { Backend, Change, Patch, Status } from './backend'
import { makeItem } from './backend'
import type { Item } from './types'

const cacheKey = (listKey: string) => `ntb:cache:${listKey}`

function readCache(b: Backend): Item[] | null {
  if (!b.cache) return null
  try {
    const raw = localStorage.getItem(cacheKey(b.listKey))
    return raw ? (JSON.parse(raw) as Item[]) : null
  } catch {
    return null
  }
}

function applyChange(items: Item[], c: Change): Item[] {
  if (c.type === 'delete') return items.filter((i) => i.id !== c.id)
  const at = items.findIndex((i) => i.id === c.item.id)
  if (at < 0) return [...items, c.item]
  const next = items.slice()
  next[at] = c.item
  return next
}

/**
 * The list, kept in sync with the backend. Writes are optimistic: they show at once,
 * and are rolled back (with an error) if the server refuses them. Writes still in flight
 * are laid over each fresh snapshot, so a resync never makes them flicker.
 */
export function useList(backend: Backend, actor: string | null) {
  const cached = useRef(readCache(backend))
  const [items, setItems] = useState<Item[]>(cached.current ?? [])
  const [loaded, setLoaded] = useState(cached.current !== null)
  const [status, setStatus] = useState<Status>('connecting')
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(new Map<string, Item | null>())

  const resync = useCallback(async () => {
    try {
      let rows = await backend.load()
      for (const [id, item] of pending.current) {
        rows = applyChange(rows, item ? { type: 'upsert', item } : { type: 'delete', id })
      }
      setItems(rows)
      setLoaded(true)
    } catch {
      setStatus('offline')
      setLoaded(true)
    }
  }, [backend])

  useEffect(() => {
    void resync()
    const unsubscribe = backend.subscribe((c) => setItems((cur) => applyChange(cur, c)), setStatus, () => void resync())
    const wake = () => {
      if (document.visibilityState === 'visible') void resync()
    }
    window.addEventListener('online', wake)
    document.addEventListener('visibilitychange', wake)
    return () => {
      unsubscribe()
      window.removeEventListener('online', wake)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [backend, resync])

  useEffect(() => {
    if (backend.cache && loaded) localStorage.setItem(cacheKey(backend.listKey), JSON.stringify(items))
  }, [backend, items, loaded])

  const itemsRef = useRef(items)
  itemsRef.current = items

  // Apply `changes` locally now, run `write`, and undo the local changes if it fails.
  const optimistic = useCallback(async (changes: Change[], write: () => Promise<void>) => {
    const before = new Map(itemsRef.current.map((i) => [i.id, i]))
    const ids = changes.map((c) => (c.type === 'delete' ? c.id : c.item.id))
    for (const c of changes) pending.current.set(c.type === 'delete' ? c.id : c.item.id, c.type === 'delete' ? null : c.item)
    setItems((cur) => changes.reduce(applyChange, cur))
    try {
      await write()
      return true
    } catch {
      setItems((cur) =>
        ids.reduce((acc, id) => {
          const old = before.get(id)
          return applyChange(acc, old ? { type: 'upsert', item: old } : { type: 'delete', id })
        }, cur),
      )
      setError(navigator.onLine ? 'השינוי לא נשמר. נסו שוב.' : 'אין חיבור לאינטרנט. השינוי לא נשמר.')
      return false
    } finally {
      for (const id of ids) pending.current.delete(id)
    }
  }, [])

  const add = useCallback(
    (fields: Pick<Item, 'name' | 'quantity' | 'note' | 'category'>) => {
      const item = makeItem(backend.listKey, { ...fields, added_by: actor })
      return optimistic([{ type: 'upsert', item }], () => backend.insert([item], actor))
    },
    [backend, actor, optimistic],
  )

  const restore = useCallback(
    (restored: Item[]) =>
      optimistic(
        restored.map((item) => ({ type: 'upsert', item })),
        () => backend.insert(restored, actor),
      ),
    [backend, actor, optimistic],
  )

  const update = useCallback(
    (id: string, patch: Patch) => {
      const cur = itemsRef.current.find((i) => i.id === id)
      if (!cur) return Promise.resolve()
      const item = { ...cur, ...patch, updated_at: new Date().toISOString() }
      return optimistic([{ type: 'upsert', item }], () => backend.update(id, patch, actor))
    },
    [backend, actor, optimistic],
  )

  const setBought = useCallback(
    (id: string, bought: boolean) =>
      update(id, bought ? { bought, bought_by: actor, bought_at: new Date().toISOString() } : { bought, bought_by: null, bought_at: null }),
    [update, actor],
  )

  const remove = useCallback(
    (id: string) => optimistic([{ type: 'delete', id }], () => backend.remove(id, actor)),
    [backend, actor, optimistic],
  )

  const clearBought = useCallback(() => {
    const bought = itemsRef.current.filter((i) => i.bought)
    return optimistic(
      bought.map((i) => ({ type: 'delete', id: i.id })),
      () => backend.clearBought(actor),
    ).then((ok) => (ok ? bought : []))
  }, [backend, actor, optimistic])

  return { items, loaded, status, error, clearError: () => setError(null), add, update, setBought, remove, clearBought, restore }
}
