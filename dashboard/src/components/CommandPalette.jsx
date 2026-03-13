/**
 * CommandPalette — Ctrl+K / ⌘K overlay search
 *
 * Props: { onClose, snapshot, onSelectSignal, onSwitchTab }
 */

import { useState, useMemo, useRef, useEffect } from 'react'

const TAB_LIST = [
  { id: 'overview',     label: 'Overview',      icon: '◈', sub: 'Pipeline funnel, scores, industry' },
  { id: 'intelligence', label: 'Intelligence',  icon: '◉', sub: 'Insights, angles, sources' },
  { id: 'content',      label: 'Content',       icon: '✍', sub: 'Review queue, authority impact' },
  { id: 'pipeline',     label: 'Pipeline',      icon: '⬡', sub: 'Run history, metrics' },
]

function highlight(text, query) {
  if (!query || !text) return text ?? ''
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function CommandPalette({ onClose, snapshot, onSelectSignal, onSwitchTab }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const groups = []

    // ── TABS ────────────────────────────────────────────────────────────────
    const tabs = q
      ? TAB_LIST.filter(t => t.label.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q))
      : TAB_LIST
    if (tabs.length) {
      groups.push({
        label: q ? 'TABS' : 'JUMP TO',
        items: tabs.slice(0, 4).map(t => ({
          type: 'tab', id: t.id,
          icon: t.icon, title: t.label, sub: t.sub,
        })),
      })
    }

    if (!q) return groups

    // ── SIGNALS ─────────────────────────────────────────────────────────────
    const signals = (snapshot?.scored_signals ?? []).filter(s =>
      s.source_name?.toLowerCase().includes(q) ||
      s.signal_category?.toLowerCase().includes(q) ||
      s.industry?.toLowerCase().includes(q) ||
      s.signal_id?.toLowerCase().includes(q)
    )
    if (signals.length) {
      groups.push({
        label: 'SIGNALS',
        items: signals.slice(0, 4).map(s => ({
          type: 'signal', id: s.signal_id,
          icon: '◈', title: s.source_name,
          sub: `Score ${s.final_score} · ${s.signal_category}`,
          data: s,
        })),
      })
    }

    // ── INSIGHTS ─────────────────────────────────────────────────────────────
    const insights = (snapshot?.insight_summaries ?? []).filter(s =>
      s.publisher?.toLowerCase().includes(q) ||
      s.summary?.toLowerCase().includes(q) ||
      s.why_it_matters?.toLowerCase().includes(q)
    )
    if (insights.length) {
      groups.push({
        label: 'INSIGHTS',
        items: insights.slice(0, 4).map(s => {
          const raw = s.summary ?? ''
          const sub = raw.length > 70 ? raw.slice(0, 70) + '…' : raw
          return { type: 'insight', id: s.id, icon: '◉', title: s.publisher ?? s.id, sub, data: s }
        }),
      })
    }

    // ── CONTENT ─────────────────────────────────────────────────────────────
    const content = (snapshot?.final_content ?? []).filter(c =>
      c.hook?.toLowerCase().includes(q) ||
      c.source_name?.toLowerCase().includes(q) ||
      c.signal_category?.toLowerCase().includes(q)
    )
    if (content.length) {
      groups.push({
        label: 'CONTENT',
        items: content.slice(0, 4).map(c => {
          const h = c.hook ?? ''
          const title = h.length > 60 ? h.slice(0, 60) + '…' : (h || c.id)
          return { type: 'content', id: c.id, icon: '✍', title, sub: c.source_name ?? '', data: c }
        }),
      })
    }

    return groups
  }, [query, snapshot])

  // Flatten for keyboard nav
  const flatItems = useMemo(() => results.flatMap(g => g.items), [results])

  useEffect(() => { setActiveIdx(0) }, [query])

  function activateItem(item) {
    if (!item) return
    if (item.type === 'tab') {
      onSwitchTab?.(item.id)
    } else if (item.type === 'signal') {
      onSelectSignal?.(item.data)
    } else if (item.type === 'insight') {
      onSwitchTab?.('intelligence')
    } else if (item.type === 'content') {
      onSwitchTab?.('content')
    }
    onClose()
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        activateItem(flatItems[activeIdx])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flatItems, activeIdx])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('.palette-item--active')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  let globalIdx = 0

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Search signals, insights, content, or jump to tab…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <div className="palette-results" ref={listRef}>
          {results.length === 0 && (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
              No results for "{query}"
            </div>
          )}
          {results.map(group => (
            <div key={group.label}>
              <div className="palette-group__label">{group.label}</div>
              {group.items.map(item => {
                const isActive = globalIdx === activeIdx
                const myIdx = globalIdx++
                return (
                  <div
                    key={item.id}
                    className={`palette-item${isActive ? ' palette-item--active' : ''}`}
                    onClick={() => activateItem(item)}
                    onMouseEnter={() => setActiveIdx(myIdx)}
                  >
                    <span className="palette-item__icon">{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="palette-item__title">
                        {highlight(item.title, query)}
                      </div>
                      {item.sub && (
                        <div className="palette-item__sub">
                          {highlight(item.sub, query)}
                        </div>
                      )}
                    </div>
                    {item.type === 'tab' && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>TAB</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
