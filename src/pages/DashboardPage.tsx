import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { useApp } from '@/context/AppContext';
import { generateRecommendations } from '@/engine/recommender';
import { generateInsights } from '@/engine/insights';
import {
  formatCO2, formatCO2Short, formatMonth,
  CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS,
} from '@/utils/formatting';
import EcoScoreRing from '@/components/EcoScoreRing';
import RecommendationCard from '@/components/RecommendationCard';
import PrintReport from '@/components/PrintReport';
import type { CategoryEmissions } from '@/types';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Filler,
);

const CHART_FONT = 'Inter, sans-serif';

const CHART_DEFAULTS = {
  plugins: {
    legend: {
      labels: {
        color: '#8b949e',
        font: { family: CHART_FONT, size: 12 },
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#1a2030',
      titleColor: '#f0f6fc',
      bodyColor: '#8b949e',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
};

// Benchmark reference values (kg CO₂e/year)
const GLOBAL_AVERAGES: CategoryEmissions = {
  transportation: 1800,
  energy:         1100,
  food:           2000,
  shopping:       600,
  waste:          350,
};

const GLOBAL_TOTAL = Object.values(GLOBAL_AVERAGES).reduce((a, b) => a + b, 0); // 5850
const EU_AVERAGE = 8400;      // kg CO₂e — EU average
const SUSTAINABLE_TARGET = 2000; // kg CO₂e — 1.5°C-compatible

const INSIGHT_TYPE_STYLES = {
  warning:     { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon_color: '#f87171' },
  opportunity: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon_color: '#fbbf24' },
  positive:    { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon_color: '#4ade80' },
  info:        { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  icon_color: '#60a5fa' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [showPrintReport, setShowPrintReport] = useState(false);

  const { carbonResult, assessmentData, monthlyHistory } = state;

  const recommendations = useMemo(() => {
    if (!assessmentData || !carbonResult) return [];
    return generateRecommendations(assessmentData, carbonResult.byCategory, 8);
  }, [assessmentData, carbonResult]);

  const insights = useMemo(() => {
    if (!assessmentData || !carbonResult) return [];
    return generateInsights(carbonResult, assessmentData);
  }, [assessmentData, carbonResult]);

  if (!state.hasCompletedAssessment || !carbonResult) {
    return (
      <main id="main-content" className="page">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }} aria-hidden="true">📊</div>
          <h1 className="page-title" style={{ marginBottom: '1rem' }}>No Data Yet</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
            Complete your carbon footprint assessment to unlock your personalized dashboard.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/assessment')}
            id="dashboard-start-assessment"
          >
            <span aria-hidden="true">🚀</span> Start Assessment
          </button>
        </div>
      </main>
    );
  }

  const { byCategory, totalAnnualKgCO2e, ecoScore, sustainabilityLevel, percentileRank } = carbonResult;

  // ── Chart data ────────────────────────────────────────────

  const categoryKeys = Object.keys(byCategory) as (keyof typeof byCategory)[];
  const donutData = {
    labels: categoryKeys.map(k => CATEGORY_LABELS[k]),
    datasets: [{
      data: categoryKeys.map(k => byCategory[k]),
      backgroundColor: categoryKeys.map(k => CATEGORY_COLORS[k]),
      borderColor: 'transparent',
      hoverOffset: 6,
    }],
  };

  const lineLabels = monthlyHistory.map(e => formatMonth(e.month));
  const lineData = {
    labels: lineLabels,
    datasets: [{
      label: 'Monthly CO₂e (kg)',
      data: monthlyHistory.map(e => e.totalKgCO2e),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const barData = {
    labels: categoryKeys.map(k => CATEGORY_LABELS[k]),
    datasets: [
      {
        label: 'Your footprint',
        data: categoryKeys.map(k => byCategory[k]),
        backgroundColor: categoryKeys.map(k => `${CATEGORY_COLORS[k]}cc`),
        borderRadius: 6,
      },
      {
        label: 'Global average',
        data: categoryKeys.map(k => GLOBAL_AVERAGES[k]),
        backgroundColor: 'rgba(139,148,158,0.2)',
        borderRadius: 6,
      },
    ],
  };

  const axisStyle = {
    ticks: { color: '#8b949e', font: { family: CHART_FONT, size: 11 } },
    grid: { color: 'rgba(255,255,255,0.05)' },
    border: { color: 'transparent' },
  };

  const highestCategory = categoryKeys.reduce((a, b) => byCategory[a] > byCategory[b] ? a : b);
  const totalSavingsPossible = recommendations.reduce((s, r) => s + r.estimatedSavingKgCO2e, 0);

  // ── Benchmarks ────────────────────────────────────────────
  const benchmarks = [
    {
      label: 'Your Footprint',
      value: totalAnnualKgCO2e,
      color: totalAnnualKgCO2e > GLOBAL_TOTAL ? '#f87171' : '#4ade80',
      bg: totalAnnualKgCO2e > GLOBAL_TOTAL ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
      icon: '📍',
    },
    {
      label: 'Global Average',
      value: GLOBAL_TOTAL,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.08)',
      icon: '🌍',
    },
    {
      label: 'EU Average',
      value: EU_AVERAGE,
      color: '#fb923c',
      bg: 'rgba(251,146,60,0.08)',
      icon: '🇪🇺',
    },
    {
      label: '1.5°C Target',
      value: SUSTAINABLE_TARGET,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.08)',
      icon: '🎯',
    },
  ];

  const maxBenchmark = Math.max(...benchmarks.map(b => b.value)) * 1.05;

  return (
    <main id="main-content" className="page">
      <div className="container">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="page-header flex justify-between items-start">
          <div>
            <h1 className="page-title font-display">Your Dashboard</h1>
            <p className="page-subtitle">
              Annual carbon footprint breakdown and AI insights
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => setShowPrintReport(true)}
              id="dashboard-download-report"
              aria-label="Download sustainability report as PDF"
            >
              <span aria-hidden="true">📄</span> Export Report
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/simulator')}
              id="dashboard-simulator"
              aria-label="Open carbon reduction simulator"
            >
              <span aria-hidden="true">🔬</span> Simulator
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/assessment')}
              id="dashboard-retake"
              aria-label="Retake carbon assessment"
              style={{ fontSize: '0.8125rem' }}
            >
              🔄 Retake
            </button>
          </div>
        </div>

        {/* ── Top KPI row ─────────────────────────────────── */}
        <div className="grid-4 stagger" style={{ marginBottom: '2rem' }} role="list" aria-label="Key statistics">
          <div className="stat-card" role="listitem">
            <div className="stat-label">Annual Footprint</div>
            <div className="stat-value" style={{ fontSize: '1.625rem' }} aria-label={`${formatCO2(totalAnnualKgCO2e)} total`}>
              {formatCO2Short(totalAnnualKgCO2e)}
            </div>
            <div className="stat-delta">per year</div>
          </div>
          <div className="stat-card" role="listitem">
            <div className="stat-label">Eco Score</div>
            <div className="stat-value" style={{ fontSize: '1.625rem' }} aria-label={`Eco score: ${ecoScore} out of 100`}>
              {ecoScore}/100
            </div>
            <div className="stat-delta">{sustainabilityLevel}</div>
          </div>
          <div className="stat-card" role="listitem">
            <div className="stat-label">Global Percentile</div>
            <div className="stat-value" style={{ fontSize: '1.625rem' }} aria-label={`${percentileRank}th percentile globally`}>
              {percentileRank}th
            </div>
            <div className={`stat-delta ${percentileRank < 50 ? 'positive' : 'negative'}`}>
              {percentileRank < 50 ? '↓ below average' : '↑ above average'}
            </div>
          </div>
          <div className="stat-card" role="listitem">
            <div className="stat-label">Potential Savings</div>
            <div className="stat-value" style={{ fontSize: '1.625rem' }} aria-label={`Potential savings: ${formatCO2Short(totalSavingsPossible)} per year`}>
              -{formatCO2Short(totalSavingsPossible)}
            </div>
            <div className="stat-delta positive">if all recs applied</div>
          </div>
        </div>

        {/* ── AI Insight Cards ─────────────────────────────── */}
        <section aria-labelledby="insights-title" style={{ marginBottom: '1.5rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h2
              id="insights-title"
              style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}
            >
              🤖 AI Insights
            </h2>
            <span className="badge badge-accent">{insights.length} insights</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '0.875rem',
            }}
            role="list"
            aria-label="AI-generated insights about your carbon footprint"
          >
            {insights.map((insight) => {
              const styles = INSIGHT_TYPE_STYLES[insight.type];
              return (
                <article
                  key={insight.id}
                  style={{
                    background: styles.bg,
                    border: `1px solid ${styles.border}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.125rem',
                    display: 'flex',
                    gap: '0.875rem',
                    alignItems: 'flex-start',
                  }}
                  role="listitem"
                  aria-label={`Insight: ${insight.headline}`}
                  className="animate-fade-in"
                >
                  <span
                    style={{
                      fontSize: '1.5rem',
                      lineHeight: 1,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                    aria-hidden="true"
                  >
                    {insight.icon}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.375rem', lineHeight: 1.3 }}>
                      {insight.headline}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {insight.detail}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Main charts row ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Eco Score + Donut */}
          <div className="card" aria-labelledby="breakdown-title">
            <h2 id="breakdown-title" style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>
              Emission Breakdown
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <EcoScoreRing score={ecoScore} level={sustainabilityLevel} size={160} />
              <div className="chart-container" style={{ maxWidth: 220, margin: '0 auto' }}>
                <Doughnut
                  data={donutData}
                  options={{
                    ...CHART_DEFAULTS,
                    cutout: '65%',
                    plugins: {
                      ...CHART_DEFAULTS.plugins,
                      legend: { display: false },
                      tooltip: {
                        ...CHART_DEFAULTS.plugins.tooltip,
                        callbacks: {
                          label: ctx => ` ${formatCO2(ctx.raw as number)} (${Math.round(((ctx.raw as number) / totalAnnualKgCO2e) * 100)}%)`,
                        },
                      },
                    },
                  }}
                  aria-label="Donut chart showing carbon emission breakdown by category"
                />
              </div>
              {/* Legend */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categoryKeys.map(k => (
                  <div key={k} className="flex items-center justify-between" style={{ fontSize: '0.8125rem' }}>
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: CATEGORY_COLORS[k], flexShrink: 0,
                      }} aria-hidden="true" />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {CATEGORY_ICONS[k]} {CATEGORY_LABELS[k]}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{Math.round((byCategory[k] / totalAnnualKgCO2e) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="card" aria-labelledby="trend-title">
            <h2 id="trend-title" style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>
              Monthly Trend (Last 12 Months)
            </h2>
            <div className="chart-container" style={{ height: 280 }}>
              <Line
                data={lineData}
                options={{
                  ...CHART_DEFAULTS,
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: axisStyle,
                    y: {
                      ...axisStyle,
                      ticks: {
                        ...axisStyle.ticks,
                        callback: (v) => formatCO2Short(v as number),
                      },
                    },
                  },
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    tooltip: {
                      ...CHART_DEFAULTS.plugins.tooltip,
                      callbacks: {
                        label: ctx => ` ${formatCO2(ctx.raw as number)}`,
                      },
                    },
                  },
                }}
                aria-label="Line chart showing monthly carbon footprint over the last 12 months"
              />
            </div>
          </div>
        </div>

        {/* ── Emission Benchmarking ─────────────────────────── */}
        <section
          className="card"
          style={{ marginBottom: '1.25rem' }}
          aria-labelledby="benchmark-title"
        >
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h2 id="benchmark-title" style={{ fontWeight: 700, fontSize: '1rem' }}>
                📊 Emission Benchmarking
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                How your footprint compares to key reference levels
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/simulator')}
              id="benchmark-try-simulator"
              aria-label="Try the carbon reduction simulator"
            >
              <span aria-hidden="true">🔬</span> Simulate Reductions
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
            {benchmarks.map(bm => (
              <div
                key={bm.label}
                style={{
                  background: bm.bg,
                  border: `1px solid ${bm.color}30`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  textAlign: 'center',
                }}
                role="group"
                aria-label={`${bm.label}: ${formatCO2(bm.value)}`}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} aria-hidden="true">{bm.icon}</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: bm.color, letterSpacing: '-0.03em' }}>
                  {formatCO2Short(bm.value)}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {bm.label}
                </div>
              </div>
            ))}
          </div>

          {/* Horizontal comparison bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {benchmarks.map(bm => {
              const pct = Math.min(100, Math.round((bm.value / maxBenchmark) * 100));
              return (
                <div key={bm.label}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span aria-hidden="true">{bm.icon}</span> {bm.label}
                    </span>
                    <strong style={{ fontSize: '0.875rem', color: bm.color }}>{formatCO2(bm.value)}</strong>
                  </div>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    aria-valuenow={bm.value}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(maxBenchmark)}
                    aria-label={`${bm.label}: ${formatCO2(bm.value)}`}
                    style={{ height: 10 }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: bm.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gap to target message */}
          {totalAnnualKgCO2e > SUSTAINABLE_TARGET && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.875rem 1rem',
                background: 'rgba(34,211,238,0.06)',
                border: '1px solid rgba(34,211,238,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
              }}
              role="note"
              aria-label="Gap to Paris Agreement target"
            >
              <span style={{ color: 'var(--accent-400)', fontWeight: 700 }}>🌡️ Gap to 1.5°C target: </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                You need to reduce by{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {formatCO2(totalAnnualKgCO2e - SUSTAINABLE_TARGET)}
                </strong>
                {' '}to reach the Paris Agreement sustainable level.{' '}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', padding: '0 0.5rem', height: '1.5rem', fontSize: '0.875rem' }}
                  onClick={() => navigate('/simulator')}
                  id="benchmark-gap-simulator"
                  aria-label="Use simulator to see how to close this gap"
                >
                  See how →
                </button>
              </span>
            </div>
          )}
        </section>

        {/* ── Comparison bar chart ─────────────────────────── */}
        <div className="card" style={{ marginBottom: '1.25rem' }} aria-labelledby="comparison-title">
          <h2 id="comparison-title" style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>
            Your Footprint vs. Global Average by Category
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Largest contributor:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {CATEGORY_ICONS[highestCategory]} {CATEGORY_LABELS[highestCategory]}
            </strong>
            {' '}({formatCO2(byCategory[highestCategory])})
          </p>
          <div className="chart-container" style={{ height: 240 }}>
            <Bar
              data={barData}
              options={{
                ...CHART_DEFAULTS,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: axisStyle,
                  y: {
                    ...axisStyle,
                    ticks: {
                      ...axisStyle.ticks,
                      callback: (v) => formatCO2Short(v as number),
                    },
                  },
                },
                plugins: {
                  ...CHART_DEFAULTS.plugins,
                  tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                      label: ctx => ` ${formatCO2(ctx.raw as number)}`,
                    },
                  },
                },
              }}
              aria-label="Bar chart comparing your emissions to the global average by category"
            />
          </div>
        </div>

        {/* ── AI Recommendations ─────────────────────────── */}
        <section aria-labelledby="recs-title" style={{ marginBottom: '2rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 id="recs-title" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                💡 Personalized Recommendations
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Ranked by impact × effort — highest leverage first
              </p>
            </div>
            <span className="badge badge-brand">{recommendations.length} actions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </div>
        </section>

        {/* ── Category Detail ──────────────────────────────── */}
        <section aria-labelledby="category-detail-title">
          <h2
            id="category-detail-title"
            style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}
          >
            Category Breakdown
          </h2>
          <div className="grid-2" role="list" aria-label="Emissions by category">
            {categoryKeys.map(k => {
              const pct = Math.round((byCategory[k] / totalAnnualKgCO2e) * 100);
              const vsAvg = byCategory[k] - GLOBAL_AVERAGES[k];
              return (
                <div key={k} className="card" role="listitem" aria-label={`${CATEGORY_LABELS[k]}: ${formatCO2(byCategory[k])}`}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '1.375rem' }} aria-hidden="true">{CATEGORY_ICONS[k]}</span>
                      <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{CATEGORY_LABELS[k]}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{formatCO2(byCategory[k])}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pct}% of total</div>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: CATEGORY_COLORS[k],
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div style={{ fontSize: '0.8125rem' }}>
                    <span style={{ color: vsAvg > 0 ? 'var(--error)' : 'var(--success)' }}>
                      {vsAvg > 0 ? '▲' : '▼'} {formatCO2(Math.abs(vsAvg))} {vsAvg > 0 ? 'above' : 'below'} global avg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Print Report Modal */}
      {showPrintReport && (
        <PrintReport onClose={() => setShowPrintReport(false)} />
      )}
    </main>
  );
}
