import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { App } from 'antd'
import { createTodo, updateTodo } from '@/api'
import { ApiError } from '@/api/client'
import { useTags } from '@/hooks/useTags'
import type { Tag, Todo, TodoPayload } from '@/types'

interface AppStoreValue {
  tags: Tag[]
  tagsLoading: boolean
  refreshTags: () => Promise<void>
  createTag: (name: string, color: string) => Promise<Tag | undefined>
  deleteTag: (tag: Tag) => Promise<void>

  /** Bumped after any mutation so every page reloads its own data. */
  refreshKey: number
  bumpRefresh: () => void

  formOpen: boolean
  formTodo: Todo | null
  formSaving: boolean
  openCreate: () => void
  openEdit: (todo: Todo) => void
  closeForm: () => void
  submitForm: (values: TodoPayload) => Promise<boolean>
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function useAppStore(): AppStoreValue {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return store
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp()
  const tagController = useTags()
  const [refreshKey, setRefreshKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [formTodo, setFormTodo] = useState<Todo | null>(null)
  const [formSaving, setFormSaving] = useState(false)

  const bumpRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), [])

  const openCreate = useCallback(() => {
    setFormTodo(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((todo: Todo) => {
    setFormTodo(todo)
    setFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    if (formSaving) return
    setFormOpen(false)
    setFormTodo(null)
  }, [formSaving])

  const submitForm = useCallback(
    async (values: TodoPayload) => {
      setFormSaving(true)
      try {
        if (formTodo) {
          const saved = await updateTodo(formTodo.id, values)
          message.success('Task updated')
          setFormOpen(false)
          setFormTodo(null)
          bumpRefresh()
          return Boolean(saved)
        }
        const created = await createTodo(values)
        message.success('Task created')
        setFormOpen(false)
        bumpRefresh()
        return Boolean(created)
      } catch (error) {
        message.error(toMessage(error))
        return false
      } finally {
        setFormSaving(false)
      }
    },
    [formTodo, message, bumpRefresh],
  )

  const value = useMemo<AppStoreValue>(
    () => ({
      tags: tagController.tags,
      tagsLoading: tagController.loading,
      refreshTags: tagController.refresh,
      createTag: tagController.create,
      deleteTag: tagController.remove,
      refreshKey,
      bumpRefresh,
      formOpen,
      formTodo,
      formSaving,
      openCreate,
      openEdit,
      closeForm,
      submitForm,
    }),
    [
      tagController.tags,
      tagController.loading,
      tagController.refresh,
      tagController.create,
      tagController.remove,
      refreshKey,
      bumpRefresh,
      formOpen,
      formTodo,
      formSaving,
      openCreate,
      openEdit,
      closeForm,
      submitForm,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}