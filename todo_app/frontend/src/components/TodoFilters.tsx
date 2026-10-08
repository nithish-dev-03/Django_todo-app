import { Button, DatePicker, Input, Select, Tooltip, Typography } from 'antd'
import { ClearOutlined, PlusOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { priorityMeta, statusMeta } from '@/theme'
import type { Priority, TodoQuery, TodoStatus } from '@/types'

interface TodoFiltersProps {
  query: TodoQuery
  resultCount: number
  loading: boolean
  activeCount: number
  onChange: <K extends keyof TodoQuery>(key: K, value: TodoQuery[K]) => void
  onReset: () => void
  onCreate: () => void
}

export default function TodoFilters({
  query,
  resultCount,
  loading,
  activeCount,
  onChange,
  onReset,
  onCreate,
}: TodoFiltersProps) {
  return (
    <div className="filter-bar">
      <Input
        className="filter-bar__search"
        allowClear
        prefix={<SearchOutlined style={{ color: 'var(--app-muted)' }} />}
        placeholder="Search title, description or tag…"
        value={query.search ?? ''}
        onChange={(event) => onChange('search', event.target.value)}
      />

      <Select<TodoStatus | 'all'>
        style={{ minWidth: 132 }}
        value={query.status ?? 'all'}
        onChange={(value) => onChange('status', value)}
        options={[
          { value: 'all', label: 'All statuses' },
          ...Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label })),
        ]}
      />

      <Select<Priority | 'all'>
        style={{ minWidth: 132 }}
        value={query.priority ?? 'all'}
        onChange={(value) => onChange('priority', value)}
        options={[
          { value: 'all', label: 'All priorities' },
          ...Object.entries(priorityMeta).map(([value, meta]) => ({ value, label: meta.label })),
        ]}
      />

      <Tooltip title="Only tasks due on or before this day">
        <DatePicker
          placeholder="Due before"
          allowClear
          style={{ minWidth: 150 }}
          value={query.due_before ? dayjs(query.due_before) : null}
          onChange={(value) => onChange('due_before', value ? value.format('YYYY-MM-DD') : undefined)}
          disabledDate={(date) => date.isAfter(dayjs(), 'day')}
        />
      </Tooltip>

      <Button
        danger={Boolean(query.overdue_only)}
        icon={<WarningOutlined />}
        onClick={() => onChange('overdue_only', query.overdue_only ? undefined : true)}
      >
        Overdue
      </Button>

      <div className="filter-bar__spacer" />

      <Typography.Text type="secondary" className="toolbar-note mono">
        {loading ? 'loading…' : `${resultCount} result${resultCount === 1 ? '' : 's'}`}
      </Typography.Text>

      <Button icon={<ClearOutlined />} onClick={onReset} disabled={!activeCount}>
        Reset{activeCount ? ` (${activeCount})` : ''}
      </Button>

      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        New task
      </Button>
    </div>
  )
}

export function countActiveFilters(query: TodoQuery): number {
  let count = 0
  if (query.search) count += 1
  if (query.status && query.status !== 'all') count += 1
  if (query.priority && query.priority !== 'all') count += 1
  if (query.overdue_only) count += 1
  if (query.due_before) count += 1
  count += query.tag_ids?.length ?? 0
  return count
}