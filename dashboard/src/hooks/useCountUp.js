/**
 * useCountUp
 *
 * Animates a number from 0 → target using requestAnimationFrame.
 * Only runs when `enabled` flips to true (driven by IntersectionObserver
 * in the CountUp component so the animation triggers on scroll-into-view).
 *
 * Easing: ease-out cubic — fast start, graceful deceleration.
 * Respects prefers-reduced-motion at the component level.
 */
import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, { duration = 900, enabled = true } = {}) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    // Cancel any in-flight animation from a previous target
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    if (!enabled) return
    if (target == null || target === 0) { setValue(0); return }

    const startTime = performance.now()

    function tick(now) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, enabled])

  return value
}
