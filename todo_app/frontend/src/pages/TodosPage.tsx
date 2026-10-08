import { useEffect } from 'react'
import { Button, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import TodoFilters, { countActiveFilters } from '@/components/TodoFilters'
import TagFilterBar from '@/components/TagFilterBar'
import TodoTable from '@/components/TodoTable'
import { useTodos } from '@/hooks/useTodos'
import { useAppStore } from '@/context/AppStore'

export default function TodosPage() {
  const {
    tags,
    tagsLoading,
    refreshTags,
    createTag,
    deleteTag,
    refreshKey,
    bumpRefresh,
    openCreate,
  } = useAppStore()

  const todos = useTodos(refreshKey)
  const [searchParams] = useSearchParams()

  // Deep link from the dashboard: /todos?overdue=1
  useEffect(() => {
    if (searchParams.get('overdue') === '1') todos.setFilter('overdue_only', true)
  }, [searchParams, todos.setFilter])

  const activeFilters = countActiveFilters(todos.query)

  // Every mutation notifies the rest of the app so dashboard counters stay honest.
  const handleToggle = async (id: number) => {
    await todos.toggle(id)
    bumpRefresh()
  }

  const handleDelete = async (id: number) => {
    await todos.remove(id)
    bumpRefresh()
  }

  const handleUpdate = async (id: number, patch: Parameters<typeof todos.update>[1]) => {
    await todos.update(id, patch)
    bumpRefresh()
  }

  const handleReorder = async (ordered: Parameters<typeof todos.reorder>[0]) => {
    await todos.reorder(ordered)
    bumpRefresh()
  }

  return (
    // page--fill makes this the one screen that owns its own scrolling.
    <div className="page--fill">
      <div className="page-head">
        <div>
          <h2 className="section-title">
            Tasks
            <span className="section-title__hint">/ inline editing, drag to reorder, live filters</span>
          </h2>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            All mutations are optimistic — failures roll back and surface as toasts.
          </Typography.Paragraph>
        </div>
        <div style={{ flex: 1 }} />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            void todos.refresh()
            void refreshTags()
          }}
        >
          Reload
        </Button>
      </div>

      <TodoFilters
        query={todos.query}
        resultCount={todos.todos.length}
        loading={todos.loading}
        activeCount={activeFilters}
        onChange={todos.setFilter}
        onReset={todos.resetFilters}
        onCreate={openCreate}
      />

      <TagFilterBar
        tags={tags}
        loading={tagsLoading}
        refresh={refreshTags}
        create={createTag}
        remove={deleteTag}
        selected={todos.query.tag_ids ?? []}
        onToggle={todos.toggleTagFilter}
        onClear={() => todos.setFilter('tag_ids', [])}
      />

      <TodoTable
        todos={todos.todos}
        allTags={tags}
        loading={todos.loading}
        error={todos.error}
        busyIds={todos.busyIds}
        onToggle={(id) => void handleToggle(id)}
        onDelete={(id) => void handleDelete(id)}
        onUpdate={(id, patch) => void handleUpdate(id, patch)}
        onReorder={(ordered) => void handleReorder(ordered)}
        onCreate={openCreate}
        onRetry={todos.refresh}
      />
    </div>
  )
}