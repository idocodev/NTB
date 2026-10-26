import { useState, type FormEvent } from 'react'
import { isCategory, OTHER, type Category } from '../lib/categories'
import type { Patch } from '../lib/backend'
import type { Item } from '../lib/types'
import { CategoryGrid } from './CategoryGrid'
import { Sheet } from './Sheet'

interface Props {
  item: Item
  onSave: (patch: Patch) => void
  onDelete: () => void
  onClose: () => void
}

export function EditSheet({ item, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity ?? '')
  const [note, setNote] = useState(item.note ?? '')
  const [category, setCategory] = useState<Category>(isCategory(item.category) ? item.category : OTHER)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), quantity: quantity.trim() || null, note: note.trim() || null, category })
  }

  return (
    <Sheet title="עריכת פריט" onClose={onClose}>
      <form className="edit" onSubmit={submit}>
        <label className="label">
          שם
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="edit-pair">
          <label className="label">
            כמות
            <input className="field" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="למשל 2" />
          </label>
          <label className="label">
            הערה
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="למשל של תנובה" />
          </label>
        </div>
        <div className="label">מחלקה</div>
        <CategoryGrid value={category} onPick={setCategory} />
        <div className="edit-actions">
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            שמירה
          </button>
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            מחיקה
          </button>
        </div>
      </form>
    </Sheet>
  )
}
