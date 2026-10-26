// The household list as it stood when the app was built. Used for the ?demo screen
// and as the source of supabase/seed.sql (scripts/gen-seed.mjs).
import type { Category } from './categories'

export const SEED: { name: string; quantity?: string; category: Category }[] = [
  { name: "ג'ינג'ר קפוא בקפסולות", category: 'קפואים' },
  { name: 'שום קלוף', category: 'ירקות ופירות' },
  { name: 'תמרים', category: 'מזווה' },
  { name: 'חזה עוף', quantity: '~1.2 ק"ג', category: 'בשר ועוף' },
  { name: "צ'ורו לברונו", category: 'חיות מחמד' },
  { name: 'סילאן', category: 'מזווה' },
  { name: "קוטג'", category: 'מוצרי חלב' },
  { name: 'פריכיות', category: 'מאפים ולחם' },
  { name: 'פתית שוודי', category: 'מאפים ולחם' },
  { name: 'מדחום קיר לחדר התינוק', category: 'תינוק' },
  { name: 'מכשיר אדים לחדר התינוק', category: 'תינוק' },
  { name: 'רולרים', category: 'אחר' },
  { name: 'מגהץ', category: 'אחר' },
  { name: 'עגבניות', category: 'ירקות ופירות' },
  { name: 'חסה', category: 'ירקות ופירות' },
  { name: 'חלבים', category: 'מוצרי חלב' },
  { name: 'בננות', category: 'ירקות ופירות' },
  { name: 'מגבונים לניקוי כללי', category: 'ניקיון וטואלטיקה' },
  { name: 'מרכך כביסה', category: 'ניקיון וטואלטיקה' },
  { name: 'לחם קל', category: 'מאפים ולחם' },
  { name: 'כרעי עוף', category: 'בשר ועוף' },
  { name: 'תפוחי אדמה', category: 'ירקות ופירות' },
  { name: 'שום כתוש בקפסולות', category: 'קפואים' },
  { name: 'נוזל רצפה', category: 'ניקיון וטואלטיקה' },
  { name: 'להזמין פילמנטים', category: 'אחר' },
]
