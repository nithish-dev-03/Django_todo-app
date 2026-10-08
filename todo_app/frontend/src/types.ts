export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type TodoStatus = 'todo' | 'in_progress' | 'done'

export interface Tag {
  id: number
  name: string
  color: string
  todo_count?: number
}

export interface Todo {
  id: number
  title: string
  description: string
  priority: Priority
  status: TodoStatus
  due_date: string | null
  position: number
  completed_at: string | null
  created_at: string
  updated_at: string
  tags: Tag[]
}

export type TodoPayload = Pick<
  Todo,
  'title' | 'description' | 'priority' | 'status' | 'due_date'
> & { tag_ids: number[] }

export type TodoPatch = Partial<TodoPayload>

export interface TodoQuery {
  search?: string
  status?: TodoStatus | 'all'
  priority?: Priority | 'all'
  tag_ids?: number[]
  overdue_only?: boolean
  /** ISO date — only return tasks due on or before this day. */
  due_before?: string
  ordering?: string
}

export interface Paginated<T> {
  count: number
  page: number
  page_size: number
  results: T[]
}

export interface Stats {
  total: number
  todo: number
  in_progress: number
  done: number
  overdue: number
  completion_rate: number
  by_priority: Record<Priority, number>
  due_today: number
}

export interface ReorderItem {
  id: number
  position: number
}