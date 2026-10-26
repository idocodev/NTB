import { CATEGORIES, CATEGORY_ICON, type Category } from '../lib/categories'

export function CategoryGrid({ value, onPick }: { value: Category; onPick: (c: Category) => void }) {
  return (
    <div className="cat-grid" role="radiogroup" aria-label="מחלקה">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          className={`cat-option${c === value ? ' selected' : ''}`}
          onClick={() => onPick(c)}
        >
          <span className="cat-option-icon">{CATEGORY_ICON[c]}</span>
          <span>{c}</span>
        </button>
      ))}
    </div>
  )
}
