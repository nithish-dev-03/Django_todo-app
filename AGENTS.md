# AGENTS.md

Django 6.1 project + a Vite/React 19/antd 6 SPA living in `todo_app/frontend`.
The JSON API lives in `events/views.py` + `events/api_urls.py` (mounted at `/api/`).

## Layout

```
todo_app/
├── manage.py, todo_app/          Django project (settings, urls)
├── db.sqlite3
├── events/                       the only app
│   ├── views.py                  spa_shell — renders the SPA shell + API views
│   ├── api_urls.py               JSON API routes (no app_name)
│   ├── urls.py                   SPA shell only; no app_name
│   └── templates/events/index.html   GENERATED — see below
├── frontend/                     Vite SPA (own package.json + .gitignore)
└── scripts/build_spa.sh          build frontend → regenerate the template
```

Python venv is at the **repo root** (`.venv/`), one level above the Django project.
Only Django is installed — no DRF, no pytest, no linters.

## Commands

```bash
# Django — run from todo_app/, venv is at ../.venv
../.venv/bin/python manage.py runserver
../.venv/bin/python manage.py check
../.venv/bin/python manage.py test        # currently runs 0 tests

# Frontend — run from todo_app/frontend/
npm run dev          # :5173, proxies /api -> http://127.0.0.1:8000
npm run typecheck    # tsc -b --noEmit
npm run build        # tsc -b && vite build  -> dist/

# Full cycle when Django serves the UI
../todo_app/scripts/build_spa.sh    # or: ./scripts/build_spa.sh from todo_app/
```

There is **no lint or test tooling** in the frontend. Don't invent `npm run lint` or
claim tests exist; `manage.py test` reporting "NO TESTS RAN" is the current truth.

Dev workflow is two terminals: Django on :8000 for the API, Vite on :5173 for the UI.
Django only serves the built SPA.

## The generated template (most important)

`events/templates/events/index.html` is **generated** by `scripts/build_spa.sh` from
`frontend/dist/index.html`, rewriting `/assets/...` into `{% static %}`. Vite hashes
those filenames, so:

- Never hand-edit `events/templates/events/index.html` — your changes are erased on
  the next build, and stale hashes 404.
- The edit source is `frontend/index.html` (Vite's entry, references `/src/main.tsx`).
- After any frontend change, run `scripts/build_spa.sh`, then hard-refresh the browser.
- `frontend/dist` is gitignored, so a **fresh clone has no build at all**. Run
  `scripts/build_spa.sh` before Django can serve any asset.
- Keep `STATIC_URL = 'static/'` as-is. The missing leading slash is fine — Django
  normalizes it via the script prefix. Don't "fix" it.

## Routing (already wired)

| Path | Status |
| --- | --- |
| `/` and client routes (`/todos`, `/tags`) | 200 via SPA catch-all `re_path(r'^(?!api/\|admin/\|static/)', ...)` in `todo_app/urls.py` |
| `/static/assets/*` | 200 — `STATICFILES_DIRS` → `frontend/dist`, no `collectstatic` needed in DEBUG |
| `/api/todos/`, `/api/tags/`, `/api/todos/stats/`, `/api/todos/reorder/`, ... | implemented in `events/api_urls.py` + `events/views.py` |

`spa_shell` uses `@ensure_csrf_cookie` + `render(request, ...)`, so the CSRF
cookie is set and frontend writes won't 403.

The API contract the frontend expects (endpoints, query params, JSON shapes,
reorder body) is documented in `todo_app/frontend/README.md` — read it before
implementing or changing anything in `frontend/src/api/`.

## Frontend invariants and traps

**Page scrolling.** `body` is `overflow: hidden` and `.app-content` is pinned to
`calc(100vh - header)`. Every page root must therefore carry a scroll class:
- `page--scroll` — normal document scrolling inside the pane (Overview, Labels)
- `page--fill` — stretches; only the inner table body scrolls (Tasks)

A new page with neither class renders clipped and unreachable.

**Table cells live in two places.** `TodoTable.tsx` declares column widths and
`SortableTodoRow.tsx` repeats them on each `<td>`. Changing one without the other
misaligns the row.

**antd 6 is not antd 5.** Already hit: `List` → `Listy`, `Alert message` → `title`,
`Spin tip` → `description`. Check the installed version's types before using a
component prop you're unsure about.

**Stale `tsc` errors.** `typecheck` uses incremental `tsc -b`. If it reports errors
that contradict the code (e.g. "declared but never read" on things plainly used),
delete `tsconfig.*.tsbuildinfo` and rerun before changing any code.

**Keep the `@/` alias in sync** between `vite.config.ts` and `tsconfig.app.json`;
they are configured separately and only work together.

**Vite 8 bundles with rolldown.** Chunk config lives under
`build.rolldownOptions.output.codeSplitting` — `advancedChunks` is deprecated and warns.

Other invariants worth preserving: mutations in `hooks/useTodos.ts` are optimistic
with snapshot rollback; `context/AppStore.tsx` owns a `refreshKey` that pages watch
so mutations on one screen refresh the others.

## Before the first commit

Root `.gitignore` covers `.venv/*`, `.opencode/*`, `__pycache__/`, `*.py[cod]`,
`db.sqlite3`, and `*.tsbuildinfo`. `node_modules` and `dist` are covered by
`frontend/.gitignore`. There are no commits on `master` yet.