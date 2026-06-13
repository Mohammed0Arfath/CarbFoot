/** RecommendationCard — Displays a single AI recommendation */
import type { Recommendation } from '@/types';
import { CATEGORY_ICONS, CATEGORY_LABELS, formatCO2Short } from '@/utils/formatting';
import { useState } from 'react';

interface Props {
  rec: Recommendation;
  index: number;
}

export default function RecommendationCard({ rec, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rec-card animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`Recommendation: ${rec.title}`}
    >
      <div className="rec-header">
        <div className="flex items-start gap-3" style={{ flex: 1 }}>
          <span
            style={{
              fontSize: '1.5rem',
              lineHeight: 1,
              flexShrink: 0,
              marginTop: '2px',
            }}
            aria-hidden="true"
          >
            {CATEGORY_ICONS[rec.category]}
          </span>
          <div>
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
                letterSpacing: '-0.01em',
              }}
            >
              {rec.title}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <span
                className={`badge impact-${rec.impact}`}
                aria-label={`${rec.impact} impact`}
              >
                {rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🔵'} {rec.impact} impact
              </span>
              <span className="badge badge-brand" aria-label={`Category: ${CATEGORY_LABELS[rec.category]}`}>
                {CATEGORY_LABELS[rec.category]}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--success)' }}
            aria-label={`Saves ${formatCO2Short(rec.estimatedSavingKgCO2e)} CO2 per year`}
          >
            -{formatCO2Short(rec.estimatedSavingKgCO2e)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>saved/yr</div>
        </div>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {rec.description}
      </p>

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls={`rec-actions-${rec.id}`}
        style={{ alignSelf: 'flex-start', padding: '0.375rem 0.75rem' }}
        id={`rec-toggle-${rec.id}`}
      >
        {expanded ? '▲ Hide steps' : '▼ See action steps'}
      </button>

      {expanded && (
        <div id={`rec-actions-${rec.id}`} className="animate-slide-up">
          <ul
            style={{
              paddingLeft: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
            aria-label="Action steps"
          >
            {rec.actionItems.map((item, i) => (
              <li
                key={i}
                style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
