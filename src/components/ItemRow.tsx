import { personLabel, type Item } from '../lib/types'

interface Props {
  item: Item
  /** This phone's user: their own name isn't shown on items they added. */
  me: string | null
  onToggle: () => void
  onEdit: () => void
}

export function ItemRow({ item, me, onToggle, onEdit }: Props) {
  const who = item.bought ? item.bought_by : item.added_by
  const by = who && who !== me ? personLabel(who) : null
  return (
    <li className={`item${item.bought ? ' bought' : ''}`}>
      <button className="item-main" onClick={onToggle} aria-pressed={item.bought} aria-label={`${item.name}${item.bought ? ', נקנה' : ''}`}>
        <span className="check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="item-text">
          <span className="item-name">
            {item.name}
            {item.quantity && <span className="qty">{item.quantity}</span>}
          </span>
          {(item.note || by) && (
            <span className="item-sub">
              {item.note && <span className="note">{item.note}</span>}
              {by && <span className="by">{item.bought ? `נקנה ע״י ${by}` : by}</span>}
            </span>
          )}
        </span>
      </button>
      <button className="item-more" onClick={onEdit} aria-label={`עריכת ${item.name}`}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>
    </li>
  )
}
