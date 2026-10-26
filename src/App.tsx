import { useEffect, useMemo, useRef, useState } from 'react'
import { AddForm } from './components/AddForm'
import { Chevron } from './components/Chevron'
import { EditSheet } from './components/EditSheet'
import { ItemRow } from './components/ItemRow'
import { Sheet } from './components/Sheet'
import { demoBackend, supabaseBackend, type Backend, type Status } from './lib/backend'
import { CATEGORY_ICON } from './lib/categories'
import { groupItems } from './lib/grouping'
import { learnCategory, readWho, saveWho } from './lib/prefs'
import { PEOPLE, type Item, type Person } from './lib/types'
import { useList } from './lib/useList'

function pickBackend(): Backend | null {
  const demo = new URLSearchParams(location.search).get('demo')
  if (demo !== null) return demoBackend(demo !== 'empty')
  return supabaseBackend()
}

export default function App() {
  const backend = useMemo(pickBackend, [])
  return backend ? <ListScreen backend={backend} /> : <NotConfigured />
}

function NotConfigured() {
  return (
    <div className="center-screen">
      <div className="hero-icon">🛒</div>
      <h1>רשימת קניות</h1>
      <p>האפליקציה עוד לא מחוברת למסד הנתונים.</p>
      <p className="muted">צריך להגדיר בהגדרות ה־Actions של הריפו ולפרסם מחדש (ההוראות ב־README):</p>
      <div className="env-names" dir="ltr">
        <code>VITE_SUPABASE_URL</code>
        <code>VITE_SUPABASE_ANON_KEY</code>
        <code>VITE_LIST_KEY</code>
      </div>
      <a className="btn btn-primary" href="?demo">
        לראות הדגמה
      </a>
    </div>
  )
}

const STATUS_LABEL: Record<Status, string> = { connecting: 'מתחבר…', live: 'מסונכרן', offline: 'לא מקוון' }

interface Toast {
  text: string
  undo?: () => void
}

function ListScreen({ backend }: { backend: Backend }) {
  const isDemo = !backend.cache
  const [who, setWho] = useState<Person | 'skip' | null>(() => (isDemo ? 'Ido' : readWho()))
  const [askWho, setAskWho] = useState(who === null)
  const actor = who === 'Ido' || who === 'Noa' ? who : null
  const list = useList(backend, actor)
  const { sections, bought } = useMemo(() => groupItems(list.items), [list.items])
  const [editing, setEditing] = useState<Item | null>(null)
  const [showBought, setShowBought] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  function notify(t: Toast) {
    setToast(t)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    if (list.error) {
      notify({ text: list.error })
      list.clearError()
    }
  }, [list.error, list])

  function chooseWho(p: Person | 'skip') {
    if (!isDemo) saveWho(p)
    setWho(p)
    setAskWho(false)
  }

  function toggle(item: Item) {
    void list.setBought(item.id, !item.bought)
    if (!item.bought) notify({ text: `״${item.name}״ נקנה`, undo: () => void list.setBought(item.id, false) })
  }

  function remove(item: Item) {
    setEditing(null)
    void list.remove(item.id)
    notify({ text: `״${item.name}״ נמחק`, undo: () => void list.restore([item]) })
  }

  async function clearBought() {
    const cleared = await list.clearBought()
    if (cleared.length) notify({ text: `נוקו ${cleared.length} פריטים`, undo: () => void list.restore(cleared) })
  }

  const open = list.items.length - bought.length

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <div>
            <h1>רשימת קניות</h1>
            <div className="top-sub">
              <span className={`dot ${list.status}`} />
              {isDemo ? 'הדגמה' : STATUS_LABEL[list.status]}
              {list.loaded && <> · {open === 0 ? 'אין מה לקנות' : open === 1 ? 'פריט אחד לקנות' : `${open} פריטים לקנות`}</>}
            </div>
          </div>
          <button className="who" onClick={() => setAskWho(true)} aria-label="מי משתמש במכשיר">
            <span className="who-avatar">{actor ? PEOPLE[actor][0] : '?'}</span>
            {actor ? PEOPLE[actor] : 'מי אני?'}
          </button>
        </div>
        <AddForm
          onAdd={(fields) => {
            void list.add(fields)
          }}
        />
      </header>

      <main className="content">
        {!list.loaded && list.status === 'offline' ? (
          <div className="empty">
            <div className="empty-icon">📡</div>
            <div className="empty-title">אין חיבור</div>
            <div className="empty-text">הרשימה תופיע כשהטלפון יתחבר לאינטרנט.</div>
          </div>
        ) : !list.loaded ? (
          <div className="empty">
            <div className="spinner" />
          </div>
        ) : open === 0 ? (
          <div className="empty">
            <div className="empty-icon">{bought.length ? '🎉' : '🛒'}</div>
            <div className="empty-title">{bought.length ? 'קנינו הכול!' : 'הרשימה ריקה'}</div>
            <div className="empty-text">{bought.length ? 'אפשר לנקות את מה שנקנה למטה.' : 'מה חסר בבית? הוסיפו פריט למעלה.'}</div>
          </div>
        ) : (
          sections.map((s) => (
            <section key={s.category} className="section">
              <h2 className="section-head">
                <span className="section-icon">{CATEGORY_ICON[s.category]}</span>
                {s.category}
                <span className="section-count">{s.items.length}</span>
              </h2>
              <ul className="items">
                {s.items.map((item) => (
                  <ItemRow key={item.id} item={item} me={actor} onToggle={() => toggle(item)} onEdit={() => setEditing(item)} />
                ))}
              </ul>
            </section>
          ))
        )}

        {bought.length > 0 && (
          <section className="section bought-section">
            <button className="bought-head" onClick={() => setShowBought((v) => !v)} aria-expanded={showBought}>
              <span className="section-icon">✅</span>
              נקנה
              <span className="section-count">{bought.length}</span>
              <Chevron up={showBought} />
            </button>
            {showBought && (
              <ul className="items">
                {bought.map((item) => (
                  <ItemRow key={item.id} item={item} me={actor} onToggle={() => toggle(item)} onEdit={() => setEditing(item)} />
                ))}
              </ul>
            )}
            <button className="btn btn-soft clear-btn" onClick={() => void clearBought()}>
              נקה את מה שנקנה
            </button>
          </section>
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              onClick={() => {
                toast.undo?.()
                setToast(null)
              }}
            >
              ביטול
            </button>
          )}
        </div>
      )}

      {editing && (
        <EditSheet
          key={editing.id}
          item={editing}
          onClose={() => setEditing(null)}
          onDelete={() => remove(editing)}
          onSave={(patch) => {
            if (patch.category && patch.category !== editing.category) learnCategory(patch.name ?? editing.name, patch.category)
            void list.update(editing.id, patch)
            setEditing(null)
          }}
        />
      )}

      {askWho && (
        <Sheet title="מי משתמש בטלפון הזה?" onClose={() => chooseWho(who ?? 'skip')}>
          <p className="sheet-text">כך נדע מי הוסיף כל פריט. אפשר לשנות בכל רגע.</p>
          <div className="who-options">
            {(Object.keys(PEOPLE) as Person[]).map((p) => (
              <button key={p} className={`who-option${who === p ? ' selected' : ''}`} onClick={() => chooseWho(p)}>
                <span className="who-avatar big">{PEOPLE[p][0]}</span>
                {PEOPLE[p]}
              </button>
            ))}
          </div>
          <button className="btn btn-link" onClick={() => chooseWho('skip')}>
            לא עכשיו
          </button>
        </Sheet>
      )}
    </div>
  )
}
