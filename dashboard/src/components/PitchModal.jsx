/**
 * PitchModal — "About This System" pitch deck slide for non-technical audiences.
 *
 * Props: { onClose, snapshot }
 */

import { useEffect } from 'react'
import { CountUp }   from './CountUp.jsx'

const PIPELINE_STAGES = [
  { icon: '📡', name: 'INGEST',    desc: 'RSS feeds and news sources scanned continuously for AI and industrial signals' },
  { icon: '🔬', name: 'SCORE',     desc: 'Each signal is scored 0–100 on Houston relevance, industry impact, and novelty' },
  { icon: '📊', name: 'ANALYZE',   desc: 'Claude AI extracts business implications, Houston angles, and content strategy' },
  { icon: '✍️', name: 'DRAFT',     desc: 'AI generates LinkedIn posts optimized for Houston industrial decision-makers' },
  { icon: '🧬', name: 'HUMANIZE',  desc: 'Content is refined to remove AI patterns and match authentic voice' },
  { icon: '👁',  name: 'REVIEW',   desc: 'Editorial review queue surfaces top content for human approval' },
  { icon: '🚀', name: 'PUBLISH',   desc: 'Approved content queued for distribution across LinkedIn and channels' },
]

const BUILT_WITH = [
  { icon: '⚙',  label: 'GitHub Actions',  desc: 'Automated pipeline runs every 6 hours' },
  { icon: '◈',  label: 'Claude AI',        desc: 'Signal analysis and content generation' },
  { icon: '📰', label: 'RSS Feeds',        desc: 'NVIDIA, VentureBeat, OpenAI, and more' },
  { icon: '⚛',  label: 'React + Vite',    desc: 'This real-time pipeline dashboard' },
]

export function PitchModal({ onClose, snapshot }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const signalsCount  = snapshot?.scored_signals?.length ?? 0
  const insightsCount = snapshot?.insight_summaries?.length ?? 0
  const contentCount  = snapshot?.final_content?.length ?? 0

  return (
    <div className="readme-overlay" onClick={onClose}>
      <div className="pitch-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pitch-modal__header">
          <div>
            <div className="pitch-modal__title">◈ HOUSTON AI AUTHORITY ENGINE</div>
            <div className="pitch-modal__tagline">
              An autonomous AI content intelligence system for the Houston industrial market
            </div>
          </div>
          <button className="readme-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="pitch-modal__body">

          {/* Pipeline visualization */}
          <div className="pitch-section">
            <div className="pitch-section__title">HOW IT WORKS</div>
            <div className="pitch-pipeline">
              {PIPELINE_STAGES.map((stage, i) => (
                <div key={stage.name} className="pitch-pipeline__wrap">
                  {i > 0 && <div className="pitch-pipeline__arrow">→</div>}
                  <div className="pitch-stage">
                    <div className="pitch-stage__icon">{stage.icon}</div>
                    <div className="pitch-stage__name">{stage.name}</div>
                    <div className="pitch-stage__desc">{stage.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="pitch-section">
            <div className="pitch-section__title">CURRENT PIPELINE STATE</div>
            <div className="pitch-stats">
              <div className="pitch-stat">
                <div className="pitch-stat__val"><CountUp value={signalsCount} duration={800} /></div>
                <div className="pitch-stat__label">Signals Processed</div>
              </div>
              <div className="pitch-stat">
                <div className="pitch-stat__val"><CountUp value={insightsCount} duration={900} /></div>
                <div className="pitch-stat__label">Insights Extracted</div>
              </div>
              <div className="pitch-stat">
                <div className="pitch-stat__val"><CountUp value={contentCount} duration={1000} /></div>
                <div className="pitch-stat__label">Content Generated</div>
              </div>
            </div>
          </div>

          {/* Why It Matters */}
          <div className="pitch-section">
            <div className="pitch-section__title">WHY IT MATTERS</div>
            <div className="pitch-why">
              Houston is the world's energy capital and a rapidly growing hub for industrial AI adoption.
              Oil &amp; gas majors, petrochemical operators, and manufacturing firms are investing billions
              in AI-driven automation — but most lack a systematic way to track what matters, understand
              the strategic implications, and translate it into authoritative thought leadership.
              <br /><br />
              This engine monitors the industrial AI landscape 24/7, scores signals by Houston relevance,
              extracts business intelligence, and generates publication-ready content — automatically.
              It transforms raw market noise into a consistent stream of authority-building content
              positioned for Houston's industrial decision-makers.
            </div>
          </div>

          {/* Built With */}
          <div className="pitch-section">
            <div className="pitch-section__title">BUILT WITH</div>
            <div className="pitch-built-with">
              {BUILT_WITH.map(item => (
                <div key={item.label} className="pitch-built-item">
                  <span className="pitch-built-item__icon">{item.icon}</span>
                  <div>
                    <div className="pitch-built-item__label">{item.label}</div>
                    <div className="pitch-built-item__desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="readme-modal__footer">
          Houston AI Authority Engine · <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
