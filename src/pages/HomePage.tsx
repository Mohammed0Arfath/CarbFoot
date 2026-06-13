import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { formatCO2, CATEGORY_ICONS, CATEGORY_LABELS } from '@/utils/formatting';
import EcoScoreRing from '@/components/EcoScoreRing';

const FEATURES = [
  {
    icon: '🧮',
    title: 'Smart Assessment',
    description: 'A guided 5-step wizard captures your transportation, energy, food, shopping, and waste habits.',
  },
  {
    icon: '🤖',
    title: 'AI Recommendations',
    description: 'Our engine analyzes your footprint and generates personalized, ranked reduction strategies.',
  },
  {
    icon: '📈',
    title: 'Interactive Dashboard',
    description: 'Visualize your emissions breakdown, monthly trends, and carbon savings with live charts.',
  },
  {
    icon: '🎯',
    title: 'Goal Tracking',
    description: 'Set reduction targets, track weekly progress, and celebrate sustainability milestones.',
  },
  {
    icon: '⚡',
    title: 'Eco Challenges',
    description: 'Complete weekly challenges, earn badges, and climb the community leaderboard.',
  },
  {
    icon: '🌍',
    title: 'Real Impact',
    description: 'Based on EPA, IPCC, and IEA emission factors to give you directionally accurate insights.',
  },
];

const STATS = [
  { value: '4.6t', label: 'Global avg. annual footprint', icon: '🌍' },
  { value: '50%', label: 'Achievable reduction with action', icon: '📉' },
  { value: '1.5°C', label: 'Paris Agreement target', icon: '🌡️' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { state } = useApp();

  return (
    <main id="main-content">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container">
          <div className="hero-eyebrow" role="text">
            <span aria-hidden="true">🌿</span> AI-Powered Carbon Intelligence
          </div>

          <h1 id="hero-title" className="hero-title font-display">
            Know Your Impact.<br />
            <span className="gradient-text">Change the World.</span>
          </h1>

          <p className="hero-subtitle">
            CarbFoot AI helps you understand, track, and reduce your carbon
            footprint with personalized AI insights, interactive dashboards, and
            actionable sustainability goals.
          </p>

          <div className="hero-cta">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/assessment')}
              id="hero-start-assessment"
              aria-label="Start your free carbon footprint assessment"
            >
              <span aria-hidden="true">🚀</span>
              {state.hasCompletedAssessment ? 'Retake Assessment' : 'Start Free Assessment'}
            </button>
            {state.hasCompletedAssessment && (
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/dashboard')}
                id="hero-view-dashboard"
                aria-label="View your carbon footprint dashboard"
              >
                <span aria-hidden="true">📊</span>
                View Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Live Result (if assessed) ─────────────────────── */}
      {state.hasCompletedAssessment && state.carbonResult && (
        <section
          className="section"
          style={{ paddingTop: 0 }}
          aria-labelledby="your-footprint-title"
        >
          <div className="container">
            <div
              className="card card-glow"
              style={{
                background: 'var(--grad-hero)',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '2rem',
                alignItems: 'center',
              }}
            >
              <EcoScoreRing
                score={state.carbonResult.ecoScore}
                level={state.carbonResult.sustainabilityLevel}
                size={160}
              />

              <div>
                <h2
                  id="your-footprint-title"
                  style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}
                >
                  Your Carbon Footprint
                </h2>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  aria-label={`Total annual footprint: ${formatCO2(state.carbonResult.totalAnnualKgCO2e)}`}
                >
                  {formatCO2(state.carbonResult.totalAnnualKgCO2e)}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  You're in the{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {state.carbonResult.percentileRank}th percentile
                  </strong>{' '}
                  globally.{' '}
                  {state.carbonResult.percentileRank > 50
                    ? 'There\'s meaningful room to reduce your impact.'
                    : 'You\'re already below average — keep going!'}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  minWidth: 160,
                }}
              >
                {Object.entries(state.carbonResult.byCategory).map(([cat, val]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-3"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>{' '}
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <strong>{formatCO2(val)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Global Stats ──────────────────────────────────── */}
      <section className="section" style={{ paddingTop: state.hasCompletedAssessment ? 0 : undefined }}>
        <div className="container">
          <div className="grid-3 stagger" role="list" aria-label="Global sustainability statistics">
            {STATS.map(stat => (
              <div
                key={stat.label}
                className="stat-card"
                role="listitem"
                aria-label={`${stat.value} — ${stat.label}`}
              >
                <div style={{ fontSize: '2rem' }} aria-hidden="true">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              id="features-title"
              style={{ fontSize: 'clamp(1.75rem,3vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              Everything you need to <span className="gradient-text">go green</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1.0625rem' }}>
              A comprehensive platform built for real impact — not just awareness.
            </p>
          </div>

          <div className="grid-3 stagger" role="list" aria-label="Platform features">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="card card-hover"
                role="listitem"
              >
                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      <section className="section" aria-labelledby="cta-title">
        <div className="container">
          <div
            className="card"
            style={{
              background: 'var(--grad-hero)',
              textAlign: 'center',
              padding: '4rem 2rem',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">🌱</div>
            <h2
              id="cta-title"
              style={{
                fontSize: 'clamp(1.5rem,3vw,2.25rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '1rem',
              }}
            >
              Ready to measure your impact?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
              Takes 3 minutes. No signup required. Start understanding your footprint today.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/assessment')}
              id="cta-start-assessment"
              aria-label="Begin carbon footprint assessment"
            >
              <span aria-hidden="true">🌿</span>
              Begin Assessment — Free
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
