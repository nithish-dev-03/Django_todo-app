import { useMemo, useState } from 'react'
import { Alert, Button, Empty, Table, Tooltip, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableTodoRow from './SortableTodoRow'
import { useElementHeight } from '@/hooks/useElementHeight'
import type { Tag as TagModel, Todo, TodoPatch } from '@/types'

interface TodoTableProps {
  todos: Todo[]
  allTags: TagModel[]
  loading: boolean
  error: string | null
  busyIds: Set<number>
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, patch: TodoPatch) => void
  onReorder: (ordered: Todo[]) => void
  onCreate: () => void
  onRetry: () => void
}

export default function TodoTable({
  todos,
  allTags,
  loading,
  error,
  busyIds,
  onToggle,
  onDelete,
  onUpdate,
  onReorder,
  onCreate,
  onRetry,
}: TodoTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)

  // The tbody scrolls; this wrapper fills whatever height the layout leaves.
  const { ref: viewportRef, height: bodyHeight } = useElementHeight<HTMLDivElement>(160)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => todos.map((todo) => todo.id), [todos])
  const indexById = useMemo(() => new Map(todos.map((todo, index) => [todo.id, index])), [todos])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = indexById.get(Number(active.id))
    const to = indexById.get(Number(over.id))
    if (from === undefined || to === undefined) return
    onReorder(arrayMove(todos, from, to))
  }

  // The cell markup lives in SortableTodoRow, so these columns only reserve
  // width and render the header — widths must match the row's <td> widths.
  const columns: TableProps<Todo>['columns'] = [
    { key: 'drag', align: 'center', width: 36 },
    { key: 'done', align: 'center', width: 44 },
    { key: 'title', title: 'Task' },
    { key: 'tags', title: 'Tags', width: 190 },
    { key: 'priority', title: 'Priority', width: 108 },
    { key: 'status', title: 'Status', width: 124 },
    { key: 'due_date', title: 'Due', width: 168 },
    { key: 'actions', align: 'right', width: 92 },
  ]

  const components: TableProps<Todo>['components'] = {
    body: {
      row: (rowProps) => {
        const record = rowProps as React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string }
        const id = Number(record['data-row-key'])
        const todo = todos.find((item) => item.id === id)
        if (!todo) return <tr {...rowProps} />
        return (
          <SortableTodoRow
            todo={todo}
            allTags={allTags}
            busy={busyIds.has(todo.id)}
            editing={editingId === todo.id}
            restProps={record}
            onStartEdit={() => setEditingId(todo.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={(patch) => void onUpdate(todo.id, patch)}
            onToggle={() => void onToggle(todo.id)}
            onDelete={() => void onDelete(todo.id)}
          />
        )
      },
    },
  }

  return (
    <>
      {error ? (
        <Alert
          type="error"
          showIcon
          className="toolbar-note"
          style={{ marginBottom: 16 }}
          title="Could not load tasks"
          description={error}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : null}

      <div className="table-viewport" ref={viewportRef}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <Table<Todo>
            className="todo-table"
            rowKey="id"
            columns={columns}
            dataSource={todos}
            components={components}
            loading={{ spinning: loading, description: 'Fetching tasks…' }}
            pagination={false}
            // `y` makes the tbody scroll on its own; the page stays fixed.
            scroll={{ x: 900, y: bodyHeight }}
            // Keeps the header visible while the body scrolls.
            sticky={bodyHeight ? true : undefined}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Typography.Text type="secondary">
                        {loading ? 'Loading your tasks…' : 'No tasks match the current filters'}
                      </Typography.Text>
                    }
                  >
                    <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
                      Create the first task
                    </Button>
                  </Empty>
                </div>
              ),
            }}
          />
        </SortableContext>
        </DndContext>
      </div>

      <div className="table-footer">
        <Typography.Text type="secondary" className="toolbar-note">
          Click a title to edit inline · Enter saves the title · drag the handle to reorder
        </Typography.Text>
        <Tooltip title="Reordering persists to POST /todos/reorder/">
          <Typography.Text type="secondary" className="toolbar-note mono" style={{ marginLeft: 'auto' }}>
            {todos.length} loaded
          </Typography.Text>
        </Tooltip>
      </div>
    </>
  )
}