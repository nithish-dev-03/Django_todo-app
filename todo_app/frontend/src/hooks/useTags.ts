import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { createTag, deleteTag, fetchTags } from '@/api'
import { ApiError } from '@/api/client'
import type { Tag } from '@/types'

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function useTags() {
  const { message } = App.useApp()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTags(await fetchTags())
    } catch (err) {
      message.warning(toMessage(err))
      setTags([])
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string, color: string) => {
      try {
        const tag = await createTag(name, color)
        setTags((prev) => [...prev, tag])
        message.success(`Tag "${tag.name}" created`)
        return tag
      } catch (err) {
        message.error(toMessage(err))
        return undefined
      }
    },
    [message],
  )

  const remove = useCallback(
    async (tag: Tag) => {
      const snapshot = tags
      setTags((prev) => prev.filter((item) => item.id !== tag.id))
      try {
        await deleteTag(tag.id)
        message.success(`Tag "${tag.name}" deleted`)
      } catch (err) {
        setTags(snapshot)
        message.error(toMessage(err))
      }
    },
    [tags, message],
  )

  return { tags, loading, refresh: load, create, remove }
}

export type TagsController = ReturnType<typeof useTags>