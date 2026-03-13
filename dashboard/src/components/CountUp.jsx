/**
 * CountUp
 *
 * Drop-in animated number display. Counts from 0 → value when the element
 * scrolls into view (IntersectionObserver at 10% threshold).
 *
 * - Skips animation entirely when prefers-reduced-motion is set
 * - Disconnects observer after first trigger (counts up once)
 * - Forwards className/style for flexible styling
 *
 * Usage:
 *   <CountUp value={912} />
 *   <CountUp value={73} duration={700} className="my-class" />
 */
import { useState, useEffect, useRef } from 'react'
import { useCountUp } from '../hooks/useCountUp.js'

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function CountUp({ value, duration = 900, className, style }) {
  const ref     = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show final value immediately for reduced-motion users
    if (prefersReduced) { setVisible(true); return }

    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect() // fire once only
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const animated = useCountUp(value, { duration, enabled: visible && !prefersReduced })
  const display  = prefersReduced ? value : animated

  return (
    <span ref={ref} className={className} style={style}>
      {display?.toLocaleString() ?? '0'}
    </span>
  )
}
