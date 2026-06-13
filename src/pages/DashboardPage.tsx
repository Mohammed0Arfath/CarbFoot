import { useMemo } from 'react';
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
import {
  formatCO2, formatCO2Short, formatMonth,
  CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS,
} from '@/utils/formatting';
import EcoScoreRing from '@/components/EcoScoreRing';
import RecommendationCard from '@/components/RecommendationCard';

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

// Global average for comparison chart
const GLOBAL_AVERAGES = {
  transportation: 1800,
  energy: 1100,
  food: 2000,
  shopping: 600,
  waste: 350,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { state } = useApp();

  const { carbonResult, assessmentData, monthlyHistory } = state;

  const recommendations = useMemo(() => {
    if (!assessmentData || !carbonResult) return [];
    return generateRecommendations(assessmentData, carbonResult.byCategory, 8);
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

  return (
    <main id="main-content" className="page">
      <div className="container">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="page-header flex justify-between items-start">
          <div>
            <h1 className="page-title font-display">Your Dashboard</h1>
            <p className="page-subtitle">
              Annual carbon footprint breakdown and insights
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/assessment')}
            id="dashboard-retake"
            aria-label="Retake carbon assessment"
          >
            <span aria-hidden="true">🔄</span> Retake Assessment
          </button>
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

        {/* ── Comparison bar chart ─────────────────────────── */}
        <div className="card" style={{ marginBottom: '1.25rem' }} aria-labelledby="comparison-title">
          <h2 id="comparison-title" style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>
            Your Footprint vs. Global Average
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
                🤖 AI Recommendations
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Personalized actions ranked by impact × effort
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
    </main>
  );
}
