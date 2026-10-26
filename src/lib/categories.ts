// Store sections and a small Hebrew keyword map that guesses an item's section from its name.

export const CATEGORIES = [
  'ירקות ופירות',
  'מוצרי חלב',
  'בשר ועוף',
  'מאפים ולחם',
  'מזווה',
  'קפואים',
  'ניקיון וטואלטיקה',
  'תינוק',
  'חיות מחמד',
  'אחר',
] as const

export type Category = (typeof CATEGORIES)[number]

export const OTHER: Category = 'אחר'

export const CATEGORY_ICON: Record<Category, string> = {
  'ירקות ופירות': '🥬',
  'מוצרי חלב': '🧀',
  'בשר ועוף': '🍗',
  'מאפים ולחם': '🥖',
  'מזווה': '🥫',
  'קפואים': '🧊',
  'ניקיון וטואלטיקה': '🧴',
  'תינוק': '🍼',
  'חיות מחמד': '🐾',
  'אחר': '🛍️',
}

export function isCategory(c: unknown): c is Category {
  return typeof c === 'string' && (CATEGORIES as readonly string[]).includes(c)
}

// Checked in this order, so the more specific sections win:
// "ג'ינג'ר קפוא" is frozen before it is a vegetable, "מגבונים לתינוק" is baby before cleaning.
const KEYWORDS: [Category, string[]][] = [
  ['חיות מחמד', ['ברונו', 'חתול', 'חתולים', 'כלב', "צ'ורו", 'חול', 'מזון יבש', 'שימורי חתול', 'פרסקיז', 'whiskas']],
  ['תינוק', ['תינוק', 'תינוקות', 'טיטול', 'טיטולים', 'חיתול', 'חיתולים', 'מוצץ', 'בקבוק', 'מטרנה', 'סימילאק', 'תמ"ל', 'עגלה', 'בייבי', 'האגיס', 'פמפרס']],
  ['קפואים', ['קפוא', 'קפואה', 'קפואים', 'קפואות', 'בקפסולות', 'קפסולות', 'גלידה', 'שלגון', 'בורקס', 'אפונה', 'שניצל תירס', 'צ\'יפס']],
  ['ניקיון וטואלטיקה', ['ניקוי', 'ניקיון', 'כביסה', 'מרכך', 'אקונומיקה', 'רצפה', 'כלים', 'סבון', 'שמפו', 'מרכך שיער', 'משחת שיניים', 'מברשת', 'נייר טואלט', 'טואלט', 'מגבונים', 'מגבות נייר', 'שקיות זבל', 'ספוג', 'סקוטש', 'דאודורנט', 'גילוח', 'טמפונים', 'תחבושות', 'פיניש', 'סנו']],
  ['בשר ועוף', ['עוף', 'בשר', 'חזה', 'כרעיים', 'כרעי', 'שוקיים', 'פרגית', 'כבד', 'טחון', 'סטייק', 'אנטריקוט', 'קציצות', 'הודו', 'נקניק', 'נקניקיות', 'שניצל', 'דג', 'דגים', 'סלמון', 'טונה טרייה']],
  ['מוצרי חלב', ['חלב', 'חלבים', "קוטג'", 'גבינה', 'גבינות', 'יוגורט', 'שמנת', 'חמאה', 'לבנה', 'מעדן', 'ביצים', 'ביצה', 'בולגרית', 'צפתית', 'מוצרלה', 'פרמזן', 'אשל', 'גיל', 'דנונה', 'מילקי', 'יופלה']],
  ['ירקות ופירות', ['עגבניה', 'עגבניות', 'מלפפון', 'מלפפונים', 'חסה', 'בצל', 'בצלים', 'שום', 'גזר', 'תפוח', 'תפוחים', 'תפוחי', 'תפו"א', 'בננה', 'בננות', 'פלפל', 'פלפלים', 'קישוא', 'קישואים', 'חציל', 'חצילים', 'לימון', 'לימונים', 'אבוקדו', 'תפוז', 'תפוזים', 'ענבים', 'אבטיח', 'מלון', 'תות', 'תותים', 'אגס', 'אפרסק', 'שזיף', 'מנגו', 'פטרוזיליה', 'כוסברה', 'שמיר', 'נענע', 'בטטה', 'ברוקולי', 'כרובית', 'כרוב', 'פטריות', 'סלק', "ג'ינג'ר", 'תרד', 'קולורבי', 'דלעת', 'ירקות', 'פירות', 'רימון', 'קלמנטינה', 'קלמנטינות']],
  ['מאפים ולחם', ['לחם', 'לחמניה', 'לחמניות', 'פיתה', 'פיתות', 'חלה', 'חלות', 'באגט', 'טורטיה', 'טורטיות', 'לאפה', 'פתית', 'פריכיות', 'קרקר', 'קרקרים', 'עוגה', 'עוגיות', 'קרואסון', 'מאפה', 'מאפים', 'בייגל']],
  ['מזווה', ['אורז', 'פסטה', 'ספגטי', 'קמח', 'סוכר', 'מלח', 'שמן', 'קפה', 'תה', 'קקאו', 'דבש', 'סילאן', 'ריבה', 'טחינה', 'חומוס', 'שימורים', 'שימורי', 'טונה', 'תירס', 'רסק', 'קטשופ', 'מיונז', 'חרדל', 'תבלין', 'תבלינים', 'פפריקה', 'כמון', 'אבקת', 'קורנפלקס', 'דגני', 'שיבולת', 'גרנולה', 'תמרים', 'אגוזים', 'שקדים', 'צימוקים', 'חטיף', 'חטיפים', 'במבה', 'ביסלי', 'שוקולד', 'עדשים', 'קינואה', 'בורגול', 'פתיתים', 'קוסקוס', 'מרק', 'ציר', 'רוטב', 'חומץ', 'זיתים', 'מים', 'סודה', 'מיץ', 'שתייה', 'יין', 'בירה']],
]

// Hebrew one-letter prefixes (ה ו ב ל מ ש כ) and pairs of them ("וה", "שב").
const PREFIX_LETTERS = 'והבלמשכ'

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[׳`´‘’]/g, "'")
    .replace(/[״“”]/g, '"')
    .replace(/[^\p{L}\p{N}'"\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenMatches(token: string, keyword: string): boolean {
  if (token === keyword) return true
  for (let i = 0; i < 2 && PREFIX_LETTERS.includes(token[i] ?? '-'); i++) {
    if (token.slice(i + 1) === keyword) return true
  }
  return false
}

function matches(name: string, tokens: string[], keyword: string): boolean {
  const kw = normalize(keyword)
  if (kw.includes(' ')) return ` ${name} `.includes(` ${kw} `)
  return tokens.some((t) => tokenMatches(t, kw))
}

/** Guess a store section from an item's name. `learned` maps a normalized name to a section the user picked before. */
export function guessCategory(name: string, learned: Record<string, string> = {}): Category {
  const n = normalize(name)
  if (!n) return OTHER
  const remembered = learned[n]
  if (isCategory(remembered)) return remembered
  const tokens = n.split(' ')
  for (const [category, words] of KEYWORDS) {
    if (words.some((w) => matches(n, tokens, w))) return category
  }
  return OTHER
}
