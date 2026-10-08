# Todo Console — Frontend

React 19 + TypeScript + Vite + Ant Design 6 UI for the Django todo app.
**Frontend only.** It talks to a Django JSON API over `/api`; every endpoint it
calls is listed in the contract below.

## Run it

```bash
npm install
cp .env.example .env      # adjust VITE_PROXY_TARGET if Django runs elsewhere
npm run dev               # http://localhost:5173
```

Vite proxies `/api` to `http://127.0.0.1:8000` (see `vite.config.ts`), so the
browser talks to one origin and Django CORS/CSRF stay simple. For production,
build with `npm run build` and serve `dist/` — then point `VITE_API_BASE_URL` at
your deployed API.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run typecheck` | `tsc` only, no emit |

## What's implemented

- **Overview** — stat cards (total / in progress / completed / overdue), a
  completion donut, a priority-distribution bar, recently-added list, and a
  deep link to a filtered board.
- **Tasks board** — sortable table with checkbox toggle, click-to-edit inline
  rows, drag-to-reorder, delete confirmation, and a create/edit modal. The table
  body scrolls on its own with a sticky header, so the page never scrolls.
- **Filters** — debounced search, status, priority, due-before, overdue-only, and
  clickable tag chips. Every filter maps to a query parameter.
- **Labels** — create, list, and delete tags; the palette is used by the tag
  editor and chips.
- **Theming** — dark by default with a light toggle, persisted in
  `localStorage`.
- **State** — optimistic updates with rollback on failure, per-row busy flags,
  toast notifications, and empty/loading/error states throughout.
- **Responsive** — on narrow or short viewports the board falls back to normal
  page scrolling, since an inner scroll area would clip rows.

## API contract

Base path is `VITE_API_BASE_URL` (default `/api`). Requests send cookies and
echo the `csrftoken` cookie back as `X-CSRFToken`. Set `VITE_AUTH_TOKEN` to send
`Authorization: Bearer …` instead.

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/todos/` | List, filtered by the query parameters below |
| `POST` | `/todos/` | Create |
| `PATCH` | `/todos/:id/` | Partial update |
| `DELETE` | `/todos/:id/` | Delete (204 or empty body) |
| `POST` | `/todos/:id/toggle/` | Flip `todo` ⇄ `done`, returns the updated task |
| `POST` | `/todos/reorder/` | Persist drag order |
| `GET` | `/todos/stats/` | Counters for the overview page |
| `GET` | `/tags/` | List tags |
| `POST` | `/tags/` | Create tag |
| `PATCH` | `/tags/:id/` | Update tag |
| `DELETE` | `/tags/:id/` | Delete tag |

`GET /todos/` accepts `search`, `status`, `priority`, `tag_ids` (comma-joined),
`overdue_only`, `due_before` (`YYYY-MM-DD`), and `ordering`. Empty values are
omitted, so an unfiltered list is a bare `/todos/`.

List responses may be a bare array, `{results: [...]}`, or
`{count, page, page_size, results}` — `src/api/client.ts` unwraps all three, and
DRF-style `{field: ["message"]}` errors are turned into readable toasts.

### `reorder` body

```json
{ "items": [{ "id": 3, "position": 0 }, { "id": 1, "position": 1 }] }
```

Positions are zero-based indexes in the new order.

### Shapes

```ts
type Priority = 'low' | 'medium' | 'high' | 'urgent'
type TodoStatus = 'todo' | 'in_progress' | 'done'

interface Tag { id: number; name: string; color: string; todo_count?: number }

interface Todo {
  id: number
  title: string
  description: string
  priority: Priority
  status: TodoStatus
  due_date: string | null      // 'YYYY-MM-DD'
  position: number
  completed_at: string | null
  created_at: string
  updated_at: string
  tags: Tag[]
}

interface Stats {
  total: number
  todo: number
  in_progress: number
  done: number
  overdue: number
  due_today: number
  completion_rate: number      // 0-100
  by_priority: Record<Priority, number>
}
```

Write endpoints accept `tag_ids: number[]` and return the saved object.

## Layout

```
src/
├── api/          client.ts (fetch, CSRF, error parsing) + index.ts (endpoints)
├── components/   AppLayout, StatCards, TodoTable, SortableTodoRow,
│                 TodoFormModal, TodoFilters, TagFilterBar, TagManager
├── context/      AppStore — shared tags, the create/edit modal, refresh signal
├── hooks/        useTodos (list + mutations), useTags, useStats, useDebouncedValue
├── lib/          date + overdue helpers
├── pages/        OverviewPage, TodosPage, TagsPage
├── styles/       global.css
├── theme.ts      antd tokens for both themes
└── types.ts      shared domain types
```

Two things worth knowing before editing:

- `useTodos` applies changes optimistically and restores the previous snapshot if
  the request fails. Every page reads `refreshKey` from `AppStore` so mutations
  made on one screen refresh the others.
- `TodoTable` renders its cells inside `SortableTodoRow`. Column widths are
  declared in `TodoTable` **and** on the matching `<td>`s in the row — if you
  add a column, update both.

### Scrolling

The board owns its scroll context: `body` is `overflow: hidden`, `.app-content`
is pinned to `calc(100vh - header)`, and `.page--fill` is a flex column whose
only growing child is `.table-viewport`. `useElementHeight` measures that
viewport and feeds the pixel value to antd's `scroll.y`, so the table fills
whatever space the filters leave over — no magic numbers. Under
`max-width: 900px` or `max-height: 620px` the media query in `global.css`
restores document scrolling; without it the inner scroll area would clip rows
that no one could reach.

## Notes

- Built against antd 6, which removed `List` (use `Listy`), `Alert.message`
  (use `title`), and `Spin.tip` (use `description`).
- The dark theme uses antd's `darkAlgorithm`; setting colors alone does not
  restyle components like `Alert` or `Button`.