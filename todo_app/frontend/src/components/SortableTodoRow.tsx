import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { priorityMeta, statusMeta } from '@/theme'
import { formatDueDate, isOverdue } from '@/lib/format'
import type { Priority, Tag as TagModel, Todo, TodoPatch, TodoStatus } from '@/types'

interface Draft {
  title: string
  description: string
  priority: Priority
  status: TodoStatus
  due_date: string | null
  tag_ids: number[]
}

function toDraft(todo: Todo): Draft {
  return {
    title: todo.title,
    description: todo.description ?? '',
    priority: todo.priority,
    status: todo.status,
    due_date: todo.due_date,
    tag_ids: todo.tags.map((tag) => tag.id),
  }
}

export interface SortableTodoRowProps {
  todo: Todo
  allTags: TagModel[]
  busy: boolean
  editing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (patch: TodoPatch) => void
  onToggle: () => void
  onDelete: () => void
  /** Attributes rc-table attaches to the row (className, onClick, data-row-key…). */
  restProps?: React.HTMLAttributes<HTMLTableRowElement>
  style?: React.CSSProperties
}

export function SortableTodoRow({
  todo,
  allTags,
  busy,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onToggle,
  onDelete,
  restProps,
  style,
}: SortableTodoRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })
  const [draft, setDraft] = useState<Draft>(() => toDraft(todo))

  // Re-seed the editor whenever the row switches into edit mode or the record changes.
  useEffect(() => {
    if (editing) setDraft(toDraft(todo))
  }, [editing, todo])

  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  }

  const classNames = [
    'todo-row',
    todo.status === 'done' ? 'todo-row--done' : '',
    isOverdue(todo) ? 'todo-row--overdue' : '',
    isDragging ? 'todo-row--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const due = formatDueDate(todo)
  const patch = (values: Draft): TodoPatch => ({
    title: values.title.trim(),
    description: values.description,
    priority: values.priority,
    status: values.status,
    due_date: values.due_date,
    tag_ids: values.tag_ids,
  })

  const commitInline = () => {
    onSave(patch(draft))
    onCancelEdit()
  }

  return (
    <tr
      {...restProps}
      ref={setNodeRef}
      style={rowStyle}
      className={classNames}
      data-row-key={todo.id}
      aria-busy={busy || undefined}
    >
      <td style={{ width: 36 }}>
        <Tooltip title="Drag to reorder" mouseEnterDelay={0.4}>
          <button
            type="button"
            className="drag-handle"
            aria-label={`Reorder ${todo.title}`}
            {...attributes}
            {...listeners}
          >
            <HolderOutlined />
          </button>
        </Tooltip>
      </td>

      <td style={{ width: 44 }}>
        <Checkbox
          checked={todo.status === 'done'}
          disabled={busy}
          onChange={onToggle}
          aria-label={todo.status === 'done' ? 'Mark as not done' : 'Mark as done'}
        />
      </td>

      <td>
        {editing ? (
          <div className="inline-editor">
            <Input
              autoFocus
              size="small"
              value={draft.title}
              placeholder="Task title"
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              onPressEnter={() => commitInline()}
            />
            <Input.TextArea
              size="small"
              autoSize={{ minRows: 1, maxRows: 4 }}
              value={draft.description}
              placeholder="Description (optional)"
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="inline-editor__meta">
              <Select<Priority>
                size="small"
                value={draft.priority}
                style={{ width: 108 }}
                onChange={(priority) => setDraft((prev) => ({ ...prev, priority }))}
                options={Object.entries(priorityMeta).map(([value, meta]) => ({
                  value: value as Priority,
                  label: meta.label,
                }))}
              />
              <Select<TodoStatus>
                size="small"
                value={draft.status}
                style={{ width: 122 }}
                onChange={(status) => setDraft((prev) => ({ ...prev, status }))}
                options={Object.entries(statusMeta).map(([value, meta]) => ({
                  value: value as TodoStatus,
                  label: meta.label,
                }))}
              />
              <DatePicker
                size="small"
                value={draft.due_date ? dayjs(draft.due_date) : null}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, due_date: value ? value.format('YYYY-MM-DD') : null }))
                }
              />
              <Select
                size="small"
                mode="multiple"
                allowClear
                maxTagCount={2}
                placeholder="Tags"
                style={{ minWidth: 148 }}
                value={draft.tag_ids}
                onChange={(tag_ids) => setDraft((prev) => ({ ...prev, tag_ids }))}
                options={allTags.map((tag) => ({ value: tag.id, label: tag.name }))}
              />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => commitInline()}
              >
                Save
              </Button>
              <Button size="small" icon={<UndoOutlined />} onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="todo-title" onClick={onStartEdit} title="Click to edit inline">
              {todo.title}
            </div>
            {todo.description ? <div className="todo-desc">{todo.description}</div> : null}
          </>
        )}
      </td>

      <td style={{ width: 190 }}>
        {editing ? null : todo.tags.length ? (
          <Space size={4} wrap>
            {todo.tags.map((tag) => (
              <Tag key={tag.id} color={tag.color} style={{ marginInlineEnd: 0 }}>
                {tag.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary" className="toolbar-note">
            —
          </Typography.Text>
        )}
      </td>

      <td style={{ width: 104 }}>
        {editing ? null : (
          <Tag color={priorityMeta[todo.priority].color} style={{ marginInlineEnd: 0 }}>
            {priorityMeta[todo.priority].label}
          </Tag>
        )}
      </td>

      <td style={{ width: 128 }}>
        {editing ? null : (
          <Tag color={statusMeta[todo.status].color} style={{ marginInlineEnd: 0 }}>
            {statusMeta[todo.status].label}
          </Tag>
        )}
      </td>

      <td style={{ width: 168 }}>
        {editing ? null : todo.due_date ? (
          <span className="todo-due mono" style={{ color: due.tone === 'today' ? '#4f8cff' : undefined }}>
            {due.label}
          </span>
        ) : (
          <Typography.Text type="secondary" className="toolbar-note">
            no due date
          </Typography.Text>
        )}
      </td>

      <td style={{ width: 92 }}>
        <div className="cell-actions">
          <Tooltip title="Edit inline">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={onStartEdit} disabled={busy} />
          </Tooltip>
          {/* No tooltip here: it would sit on top of the confirm popover. */}
          <Popconfirm
            title="Delete this task?"
            description="This cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={onDelete}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={busy} aria-label="Delete task" />
          </Popconfirm>
        </div>
      </td>
    </tr>
  )
}

export default SortableTodoRow