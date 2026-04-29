import { useState, useEffect } from 'react'

/**
 * Separates DOM mounting from CSS visibility so components can
 * animate in on open and animate out before unmounting.
 *
 * - `mounted`  controls whether the element is in the DOM
 * - `visible`  controls the CSS class that triggers the transition
 */
export function useModalTransition(isOpen: boolean, exitDuration = 220) {
  const [mounted, setMounted] = useState(isOpen)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Double RAF: first paint renders the "closed" state, second triggers transition
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      )
      return () => cancelAnimationFrame(id)
    } else {
      setVisible(false)
      const id = setTimeout(() => setMounted(false), exitDuration)
      return () => clearTimeout(id)
    }
  }, [isOpen, exitDuration])

  return { mounted, visible }
}
