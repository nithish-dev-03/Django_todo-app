import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { App } from 'antd'
import { debounce } from 'lodash'
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  reorderTodos,
  toggleTodo,
  updateTodo,
} from '@/api'
import { ApiError } from '@/api/client'
import { useDebouncedValue } from './useDebouncedValue'
import type { ReorderItem, Todo, TodoPatch, TodoPayload, TodoQuery } from '@/types'

export const DEFAULT_QUERY: TodoQuery = {
  search: '',
  status: 'all',
  priority: 'all',
  tag_ids: [],
  overdue_only: false,
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function useTodos(refreshKey = 0) {
  const { message } = App.useApp()
  const [todos, setTodos] = useState<Todo[]>([])
  const [query, setQuery] = useState<TodoQuery>(DEFAULT_QUERY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const search = useDebouncedValue(query.search ?? '', 350)

  const effectiveQuery = useMemo<TodoQuery>(() => ({ ...query, search }), [query, search])

  const effectiveQueryRef = useRef(effectiveQuery)
  effectiveQueryRef.current = effectiveQuery

  const load = useMemo(
    () =>
      debounce(async () => {
        setLoading(true)
        setError(null)
        try {
          setTodos(await fetchTodos(effectiveQueryRef.current))
        } catch (err) {
          setError(toMessage(err))
          setTodos([])
        } finally {
          setLoading(false)
        }
      }, 1000),
    [],
  )

  useEffect(() => {
    void load()
    return () => {
      load.cancel()
    }
  }, [effectiveQuery, load, refreshKey])

  const setBusy = useCallback((ids: number[], busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (busy ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  /** Runs a mutation, flags the affected rows as busy and surfaces failures as toasts. */
  const withBusy = useCallback(
    async <T,>(ids: number[], run: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(ids, true)
      try {
        const result = await run()
        if (success) message.success(success)
        return result
      } catch (err) {
        message.error(toMessage(err))
        return undefined
      } finally {
        setBusy(ids, false)
      }
    },
    [message, setBusy],
  )

  const create = useCallback(
    async (payload: TodoPayload) => {
      const created = await withBusy([], () => createTodo(payload))
      if (created) setTodos((prev) => [created, ...prev])
      return created
    },
    [withBusy],
  )

  const update = useCallback(
    async (id: number, patch: TodoPatch) => {
      const previous = todos
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, ...patch, tags: patch.tag_ids ? previous.find((t) => t.id === id)?.tags ?? [] : todo.tags } : todo,
        ),
      )
      const saved = await withBusy([id], () => updateTodo(id, patch))
      setTodos((prev) => prev.map((todo) => (todo.id === id ? (saved ?? todo) : todo)))
      return saved
    },
    [todos, withBusy],
  )

  const toggle = useCallback(
    async (id: number) => {
      const snapshot = todos
      const target = snapshot.find((todo) => todo.id === id)
      if (!target) return
      const nextStatus = target.status === 'done' ? 'todo' : 'done'
      setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, status: nextStatus } : todo)))
      const saved = await withBusy([id], () => toggleTodo(id))
      setTodos((prev) => prev.map((todo) => (todo.id === id ? (saved ?? target) : todo)))
      if (!saved) setTodos(snapshot.filter((todo) => todo.id === id))
    },
    [todos, withBusy],
  )

  const remove = useCallback(
    async (id: number) => {
      const snapshot = todos
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
      const ok = await withBusy([id], () => deleteTodo(id), 'Task deleted')
      if (!ok) setTodos(snapshot)
      else void load()
    },
    [todos, withBusy, load],
  )

  const reorder = useCallback(
    async (ordered: Todo[]) => {
      const items: ReorderItem[] = ordered.map((todo, index) => ({ id: todo.id, position: index }))
      const snapshot = todos
      setTodos(ordered)
      try {
        await reorderTodos(items)
      } catch (err) {
        setTodos(snapshot)
        message.error(toMessage(err))
      }
    },
    [todos, message],
  )

  const setFilter = useCallback(<K extends keyof TodoQuery>(key: K, value: TodoQuery[K]) => {
    setQuery((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleTagFilter = useCallback((tagId: number) => {
    setQuery((prev) => {
      const current = prev.tag_ids ?? []
      return {
        ...prev,
        tag_ids: current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
      }
    })
  }, [])

  const resetFilters = useCallback(() => setQuery(DEFAULT_QUERY), [])

  return {
    todos,
    loading,
    error,
    query,
    busyIds,
    refresh: load,
    create,
    update,
    toggle,
    remove,
    reorder,
    setFilter,
    toggleTagFilter,
    resetFilters,
  }
}

export type TodosController = ReturnType<typeof useTodos>