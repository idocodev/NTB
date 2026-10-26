import { useRef, useState, type FormEvent } from 'react'
import { CATEGORY_ICON, guessCategory, type Category } from '../lib/categories'
import { learnCategory, readLearned } from '../lib/prefs'
import { CategoryGrid } from './CategoryGrid'
import { Chevron } from './Chevron'
import { Sheet } from './Sheet'

interface Props {
  onAdd: (fields: { name: string; quantity: string | null; note: string | null; category: Category }) => void
}

export function AddForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState<Category | null>(null)
  const [extra, setExtra] = useState(false)
  const [picking, setPicking] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const trimmed = name.trim()
  const category = picked ?? guessCategory(trimmed, readLearned())

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!trimmed) return
    if (picked) learnCategory(trimmed, picked)
    onAdd({ name: trimmed, quantity: quantity.trim() || null, note: note.trim() || null, category })
    setName('')
    setQuantity('')
    setNote('')
    setPicked(null)
    setExtra(false)
    input.current?.focus()
  }

  return (
    <form className="add" onSubmit={submit}>
      <div className="add-row">
        <input
          ref={input}
          className="add-input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (!e.target.value.trim()) setPicked(null)
          }}
          placeholder="מה צריך לקנות?"
          aria-label="פריט חדש"
          enterKeyHint="done"
          autoComplete="off"
        />
        <button className="add-btn" type="submit" disabled={!trimmed} aria-label="הוספה">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {trimmed && (
        <div className="add-meta">
          <button type="button" className="chip chip-cat" onClick={() => setPicking(true)}>
            <span>{CATEGORY_ICON[category]}</span> {category} <Chevron />
          </button>
          {!extra && (
            <button type="button" className="chip chip-ghost" onClick={() => setExtra(true)}>
              + כמות / הערה
            </button>
          )}
        </div>
      )}
      {trimmed && extra && (
        <div className="add-extra">
          <input className="field" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="כמות" aria-label="כמות" />
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="הערה" aria-label="הערה" />
        </div>
      )}
      {picking && (
        <Sheet title="לאיזו מחלקה?" onClose={() => setPicking(false)}>
          <CategoryGrid
            value={category}
            onPick={(c) => {
              setPicked(c)
              setPicking(false)
            }}
          />
        </Sheet>
      )}
    </form>
  )
}
