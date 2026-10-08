# learn-basics

A full-stack todo app: Django 6.1 serves a JSON API and the built
single-page app; a Vite/React 19 + antd 6 frontend handles routing and state
client-side.

## What it is

- Create, edit, delete, and complete tasks, grouped with labels (tags)
- Drag-and-drop reordering, task stats, and filtering
- Fast, app-like UI: client-side routing with no full page reloads
- Django doubles as the API server *and* the web server for the frontend —
  one process, one port, no separate static host needed

## Why it's more advanced than a typical todo demo

| Typical tutorial todo app | This project |
| --- | --- |
| Server-rendered pages, full reloads | SPA with client-side routing (Overview, Tasks, Labels) |
| Basic CRUD forms | JSON API + optimistic UI updates with rollback on error |
| No structure | Generated SPA template pipeline (`scripts/build_spa.sh`) — edit React, one script rebuilds what Django serves |
| Manual ordering by hand | Drag-and-drop reorder persisted via `/api/todos/reorder/` |
| Monolithic templates | Strict page scroll invariants, optimistic mutations, shared app store that refreshes across screens |

## Layout

```
├── .venv/                  Python virtualenv (Django only; no DRF/pytest)
└── todo_app/
    ├── manage.py, todo_app/    Django project (settings, urls)
    ├── db.sqlite3
    ├── events/                 the only app
    │   ├── views.py            SPA shell + JSON API views
    │   ├── api_urls.py         /api/ routes
    │   ├── urls.py             SPA shell routes
    │   └── templates/events/   generated SPA template
    ├── frontend/               Vite SPA (own package.json)
    └── scripts/build_spa.sh    build frontend → regenerate template
```

## Setup

```bash
python -m venv .venv
.venv/bin/pip install django
cd todo_app/frontend && npm install
```

## Run (development, two terminals)

```bash
# Terminal 1 — API + serves built SPA, from todo_app/
../.venv/bin/python manage.py runserver        # :8000

# Terminal 2 — Vite dev server with HMR, from todo_app/frontend/
npm run dev                                    # :5173, proxies /api → :8000
```

## Run (Django serves the UI)

```bash
cd todo_app
./scripts/build_spa.sh        # npm build + regenerate the SPA template
../.venv/bin/python manage.py runserver
```

Then open http://127.0.0.1:8000/.

## Tests / checks

```bash
cd todo_app
../.venv/bin/python manage.py check
../.venv/bin/python manage.py test     # currently runs 0 tests
cd frontend && npm run typecheck
```

## API

Mounted at `/api/`; see `todo_app/frontend/README.md` for the full contract
(endpoints, query params, JSON shapes, reorder body).

| Endpoint | Description |
| --- | --- |
| `GET/POST /api/todos/` | list / create todos |
| `GET/PATCH/DELETE /api/todos/<id>/` | todo detail |
| `POST /api/todos/<id>/toggle/` | toggle done |
| `GET /api/todos/stats/` | counts by status |
| `POST /api/todos/reorder/` | reorder todos |
| `GET/POST /api/tags/` | list / create tags |
| `GET/PATCH/DELETE /api/tags/<id>/` | tag detail |

`events/templates/events/index.html` is generated — never hand-edit it.
