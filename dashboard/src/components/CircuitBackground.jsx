/**
 * CircuitBackground — Fixed full-screen decorative SVG with animated pulses.
 * Very low opacity so it sits beneath all content without distraction.
 * pointer-events: none so it never intercepts clicks.
 */

export function CircuitBackground() {
  // Horizontal lines at y positions
  const hLines = [120, 280, 420, 580, 720, 850]
  // Vertical lines at x positions
  const vLines = [200, 480, 760, 1040, 1320]

  // Intersection nodes
  const nodes = []
  hLines.forEach(y => {
    vLines.forEach(x => {
      nodes.push({ x, y })
    })
  })

  // Horizontal animated pulses: travel along h-lines
  const hPulses = [
    { y: 120, fromX: 0,    toX: 1600, dur: '8s',  delay: '0s',   r: 2 },
    { y: 280, fromX: 0,    toX: 1600, dur: '11s', delay: '2.5s', r: 2.5 },
    { y: 420, fromX: 1600, toX: 0,    dur: '9s',  delay: '1s',   r: 2 },
    { y: 580, fromX: 0,    toX: 1600, dur: '13s', delay: '4s',   r: 2 },
    { y: 720, fromX: 1600, toX: 0,    dur: '7s',  delay: '0.5s', r: 2.5 },
    { y: 850, fromX: 0,    toX: 1600, dur: '15s', delay: '6s',   r: 2 },
  ]

  // Vertical animated pulses: travel along v-lines
  const vPulses = [
    { x: 200,  fromY: 0,   toY: 900, dur: '10s', delay: '1.5s', r: 2 },
    { x: 480,  fromY: 900, toY: 0,   dur: '12s', delay: '3s',   r: 2.5 },
    { x: 760,  fromY: 0,   toY: 900, dur: '8s',  delay: '0s',   r: 2 },
    { x: 1040, fromY: 900, toY: 0,   dur: '14s', delay: '5s',   r: 2 },
    { x: 1320, fromY: 0,   toY: 900, dur: '9s',  delay: '2s',   r: 2.5 },
  ]

  return (
    <>
      {/* SVG circuit grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden',
          contain: 'strict', // Contain all layout/paint to this fixed layer
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          style={{ opacity: 0.07, pointerEvents: 'none' }}
        >
          {/* Horizontal lines */}
          {hLines.map(y => (
            <line
              key={`h-${y}`}
              x1="0" y1={y} x2="1600" y2={y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}

          {/* Vertical lines */}
          {vLines.map(x => (
            <line
              key={`v-${x}`}
              x1={x} y1="0" x2={x} y2="900"
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}

          {/* Intersection nodes */}
          {nodes.map(({ x, y }) => (
            <rect
              key={`node-${x}-${y}`}
              x={x - 2.5} y={y - 2.5}
              width="5" height="5"
              fill="var(--border)"
              rx="1"
            />
          ))}

          {/* Horizontal pulses */}
          {hPulses.map((p, i) => (
            <circle key={`hp-${i}`} r={p.r} fill="var(--cyan)" opacity="0">
              <animate
                attributeName="cx"
                from={p.fromX} to={p.toX}
                dur={p.dur}
                begin={p.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                from={p.y} to={p.y}
                dur={p.dur}
                begin={p.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                keyTimes="0;0.05;0.95;1"
                dur={p.dur}
                begin={p.delay}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* Vertical pulses */}
          {vPulses.map((p, i) => (
            <circle key={`vp-${i}`} r={p.r} fill="var(--cyan)" opacity="0">
              <animate
                attributeName="cx"
                from={p.x} to={p.x}
                dur={p.dur}
                begin={p.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                from={p.fromY} to={p.toY}
                dur={p.dur}
                begin={p.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                keyTimes="0;0.05;0.95;1"
                dur={p.dur}
                begin={p.delay}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </div>

      {/* Data stream streaks */}
      <div
        className="data-streams"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}
      >
        <div className="data-stream" />
        <div className="data-stream" />
        <div className="data-stream" />
        <div className="data-stream" />
      </div>
    </>
  )
}
