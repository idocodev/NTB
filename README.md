# רשימת קניות

A shared shopping list for Ido and Noa: a mobile-first Hebrew PWA that syncs between phones in real time
through Supabase.

**Live:** https://idocodev.github.io/NTB/ · **Demo without a database:** https://idocodev.github.io/NTB/?demo
(`?demo=empty` for the empty list)

- Add an item (optional quantity and note). Its store section is guessed from a Hebrew keyword map
  (`src/lib/categories.ts`) and can be changed; a section picked by hand is remembered on that phone.
- Tap an item to mark it bought (it moves to the collapsed "נקנה" section), with undo. "⋯" edits or deletes.
  "נקה את מה שנקנה" removes the bought items.
- Each phone is asked once who uses it (עידו / נועה), stored in localStorage and shown on the items it adds.
- Changes show at once and are rolled back if the server refuses them. The last list is cached on the phone,
  so it opens offline (read only).

## Stack

React 19 + Vite + TypeScript (strict), `@supabase/supabase-js`, Heebo. No router, no state library.

```
src/lib/categories.ts  sections + keyword guesser        src/lib/backend.ts  Supabase / demo backends
src/lib/grouping.ts    open items by section, bought     src/lib/useList.ts  sync, optimistic writes, cache
supabase/schema.sql    tables, triggers, RLS, realtime   supabase/seed.sql   the list as it was (generated)
```

## Setting up Supabase

1. Create a project. In the SQL editor run `supabase/schema.sql` (safe to run again after changes).
2. Make a list key, a long random string: `openssl rand -hex 24`. Everything in the list is stored under it.
3. Optional: run `supabase/seed.sql` after replacing `:LIST_KEY` with that key.
4. In the GitHub repo, **Settings → Secrets and variables → Actions**:
   - Variable `VITE_SUPABASE_URL` - the project URL (`https://<ref>.supabase.co`)
   - Secret `VITE_SUPABASE_ANON_KEY` - the project's anon (public) key
   - Secret `VITE_LIST_KEY` - the list key from step 2
5. Re-run the "Deploy to GitHub Pages" workflow (or push to main).

Without these the app still builds and shows a "not connected yet" screen.

**Security:** there are no accounts. RLS lets the anon role read and write the tables, and the app only touches rows
with its `list_key`. The anon key and list key end up in the public JavaScript bundle (they are secrets only to keep
them out of the repo), so anyone who has the site's URL can read and change the list. It's a household list; don't put
anything sensitive in it.

### Data

- `items` - one row per item, with `list_key`, `bought`/`bought_by`/`bought_at`, `added_by` (`Ido`/`Noa`), and
  `source` (`web` or `nano`). `updated_at` is kept by a trigger.
- `item_events` - written by triggers only: `added`, `bought`, `unbought`, `edited`, `deleted`, `cleared`, with
  `actor` and `source`. The actor comes from the row (`added_by`, `bought_by`) or from the `x-ntb-actor` request
  header; `source` from `x-ntb-source`.
- `clear_bought(p_list_key, p_actor, p_source)` - deletes a list's bought items, logged as `cleared`.
- `items` is in the `supabase_realtime` publication with replica identity full; the app listens to
  `postgres_changes` filtered by `list_key`.

Writing from elsewhere (e.g. Nano) is a plain PostgREST call:

```bash
curl "$SUPABASE_URL/rest/v1/items" -H "apikey: $ANON_KEY" -H "authorization: Bearer $ANON_KEY" \
  -H 'content-type: application/json' -H 'x-ntb-actor: Nano' -H 'x-ntb-source: nano' \
  -d '{"list_key":"...","name":"חלב","category":"מוצרי חלב","source":"nano"}'
```

## Development

```bash
npm ci
cp .env.example .env.local   # fill in, or skip and open /NTB/?demo
npm run dev                  # http://localhost:5173/NTB/
npm test                     # vitest
npm run build                # typecheck + build
node scripts/gen-seed.ts     # regenerate supabase/seed.sql from src/lib/seed.ts
```

## Deploy

Push to `main`. `.github/workflows/deploy.yml` runs the tests and the build and force-pushes `dist/` to the
`gh-pages` branch; GitHub Pages serves that branch. Never push `gh-pages` by hand. After a change to `public/sw.js`
or the offline shell, bump `CACHE` in it.
