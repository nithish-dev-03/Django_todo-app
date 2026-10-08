import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Tracks the height of an element and returns it, so a child scroll container
 * (antd `Table` with `scroll.y`) can fill the space that is actually left over
 * instead of guessing a magic pixel number.
 *
 * `minHeight` is the smallest height worth scrolling at; below it the table is
 * left unconstrained so short lists never get a nested scrollbar.
 */
export function useElementHeight<T extends HTMLElement>(minHeight = 160, reserve = 0) {
  const ref = useRef<T | null>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      const available = element.clientHeight - reserve
      setHeight(available > minHeight ? available : undefined)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [minHeight, reserve])

  return { ref, height }
}