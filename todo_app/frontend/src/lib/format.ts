import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Todo } from '@/types'

dayjs.extend(relativeTime)

export { dayjs }

export function isOverdue(todo: Todo): boolean {
  if (todo.status === 'done' || !todo.due_date) return false
  return dayjs(todo.due_date).endOf('day').isBefore(dayjs())
}

export function isDueToday(todo: Todo): boolean {
  if (!todo.due_date) return false
  return dayjs(todo.due_date).isSame(dayjs(), 'day')
}

export function formatDueDate(todo: Todo): { label: string; tone: 'overdue' | 'today' | 'soon' | 'none' } {
  if (!todo.due_date) return { label: '—', tone: 'none' }
  const date = dayjs(todo.due_date)
  if (todo.status === 'done') return { label: date.format('MMM D'), tone: 'none' }
  if (isOverdue(todo)) return { label: `${date.format('MMM D')} · overdue`, tone: 'overdue' }
  if (date.isSame(dayjs(), 'day')) return { label: 'Today', tone: 'today' }
  if (date.isSame(dayjs().add(1, 'day'), 'day')) return { label: 'Tomorrow', tone: 'soon' }
  return { label: date.format('MMM D'), tone: 'soon' }
}

export function fromNow(value: string | null): string {
  if (!value) return '—'
  return dayjs(value).fromNow()
}

export function initials(text: string): string {
  return text.trim().slice(0, 2).toUpperCase() || '··'
}