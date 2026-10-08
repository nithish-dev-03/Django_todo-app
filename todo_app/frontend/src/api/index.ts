import { request, unwrapList, queryString } from './client'
import type { Paginated, Stats, Tag, Todo, TodoPatch, TodoPayload, TodoQuery, ReorderItem } from '@/types'

/**
 * Every backend call the UI depends on lives in this file.
 * Swap the paths here to match the Django urls.py you build.
 */
export const endpoints = {
  todos: '/todos/',
  todo: (id: number) => `/todos/${id}/`,
  todoToggle: (id: number) => `/todos/${id}/toggle/`,
  todoReorder: '/todos/reorder/',
  tags: '/tags/',
  tag: (id: number) => `/tags/${id}/`,
  stats: '/todos/stats/',
} as const

export function fetchTodos(query: TodoQuery = {}, signal?: AbortSignal): Promise<Todo[]> {
  return request<unknown>(`${endpoints.todos}${queryString({ ...query })}`, { signal }).then(unwrapList<Todo>)
}

export function fetchTodosPaginated(query: TodoQuery = {}, signal?: AbortSignal): Promise<Paginated<Todo>> {
  return request<Paginated<Todo>>(`${endpoints.todos}${queryString({ ...query })}`, { signal }).then((data) => ({
    count: data?.count ?? unwrapList<Todo>(data).length,
    page: data?.page ?? 1,
    page_size: data?.page_size ?? 20,
    results: unwrapList<Todo>(data),
  }))
}

export function createTodo(payload: TodoPayload): Promise<Todo> {
  return request<Todo>(endpoints.todos, { method: 'POST', body: payload })
}

export function updateTodo(id: number, patch: TodoPatch): Promise<Todo> {
  return request<Todo>(endpoints.todo(id), { method: 'PATCH', body: patch })
}

export function deleteTodo(id: number): Promise<void> {
  return request<void>(endpoints.todo(id), { method: 'DELETE' })
}

export function toggleTodo(id: number): Promise<Todo> {
  return request<Todo>(endpoints.todoToggle(id), { method: 'POST' })
}

export function reorderTodos(items: ReorderItem[]): Promise<unknown> {
  return request<unknown>(endpoints.todoReorder, { method: 'POST', body: { items } })
}

export function fetchTags(signal?: AbortSignal): Promise<Tag[]> {
  return request<unknown>(endpoints.tags, { signal }).then(unwrapList<Tag>)
}

export function createTag(name: string, color: string): Promise<Tag> {
  return request<Tag>(endpoints.tags, { method: 'POST', body: { name, color } })
}

export function updateTag(id: number, patch: Partial<Pick<Tag, 'name' | 'color'>>): Promise<Tag> {
  return request<Tag>(endpoints.tag(id), { method: 'PATCH', body: patch })
}

export function deleteTag(id: number): Promise<void> {
  return request<void>(endpoints.tag(id), { method: 'DELETE' })
}

const EMPTY_STATS: Stats = {
  total: 0,
  todo: 0,
  in_progress: 0,
  done: 0,
  overdue: 0,
  completion_rate: 0,
  by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
  due_today: 0,
}

export function fetchStats(signal?: AbortSignal): Promise<Stats> {
  return request<Partial<Stats> | null>(endpoints.stats, { signal })
    .then((data) => ({ ...EMPTY_STATS, ...(data ?? {}) }))
    .catch(() => EMPTY_STATS)
}