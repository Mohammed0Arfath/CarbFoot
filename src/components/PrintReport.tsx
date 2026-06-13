/**
 * CarbFoot AI — Sustainability Report (Print / PDF)
 *
 * A dedicated print view triggered via window.print().
 * Browsers' "Save as PDF" option converts it to a real PDF.
 * No dependencies needed.
 */

import { useApp } from '@/context/AppContext';
import { generateInsights } from '@/engine/insights';
import { generateRecommendations } from '@/engine/recommender';
import { formatCO2, formatCO2Short, formatDate, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS, getEcoScoreColor } from '@/utils/formatting';
import type { CategoryEmissions } from '@/types';

const GLOBAL_AVERAGES: CategoryEmissions = {
  transportation: 1800,
  energy:         1100,
  food:           2000,
  shopping:       600,
  waste:          350,
};

interface PrintReportProps {
  onClose: () => void;
}

export default function PrintReport({ onClose }: PrintReportProps) {
  const { state } = useApp();
  const { carbonResult, assessmentData, userProfile } = state;

  if (!carbonResult || !assessmentData) return null;

  const insights = generateInsights(carbonResult, assessmentData);
  const recommendations = generateRecommendations(assessmentData, carbonResult.byCategory, 5);
  const scoreColor = getEcoScoreColor(carbonResult.ecoScore);
  const totalSavingsPossible = recommendations.reduce((s, r) => s + r.estimatedSavingKgCO2e, 0);
  const globalTotal = Object.values(GLOBAL_AVERAGES).reduce((a, b) => a + b, 0);
  const categoryKeys = Object.keys(carbonResult.byCategory) as (keyof CategoryEmissions)[];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ── Print trigger UI ─────────────────────────────── */}
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ zIndex: 300 }}
      >
        <div
          className="modal"
          style={{ maxWidth: 640 }}
        >
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <h2 id="report-modal-title" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              📄 Download Sustainability Report
            </h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Preview card */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: 'var(--bg-elevated)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
              }}
            >
              Report Preview
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: '📊', text: `Eco Score: ${carbonResult.ecoScore}/100 — ${carbonResult.sustainabilityLevel}` },
                { icon: '🌍', text: `Total footprint: ${formatCO2(carbonResult.totalAnnualKgCO2e)}/year` },
                { icon: '📉', text: `5 top emission categories with breakdown` },
                { icon: '🤖', text: `${recommendations.length} personalised AI recommendations` },
                { icon: '📈', text: `Benchmark vs. global and sustainable targets` },
                { icon: '🌱', text: `Potential savings: ${formatCO2(totalSavingsPossible)}/year` },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2" style={{ fontSize: '0.9375rem' }}>
                  <span aria-hidden="true">{item.icon}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-between">
            <button className="btn btn-ghost" onClick={onClose} id="report-cancel">
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              id="report-download"
              aria-label="Open browser print dialog to save PDF"
            >
              <span aria-hidden="true">🖨️</span> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Actual print content (hidden on screen, visible when printing) ── */}
      <div
        id="print-report"
        aria-hidden="true"
        style={{ display: 'none' }}
      >
        <style>{`
          @media print {
            body > *:not(#print-report) { display: none !important; }
            #print-report { display: block !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 2cm; size: A4; }

            body { font-family: 'Inter', sans-serif; color: #0f172a; background: white; }
            .pr-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 3px solid #059669; margin-bottom: 32px; }
            .pr-logo { font-size: 24px; font-weight: 900; color: #059669; }
            .pr-date { font-size: 14px; color: #64748b; }
            .pr-section { margin-bottom: 32px; }
            .pr-section-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
            .pr-score-row { display: flex; align-items: center; gap: 24px; padding: 20px; background: #f0fdf4; border-radius: 12px; margin-bottom: 16px; }
            .pr-score-num { font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1; }
            .pr-score-label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .pr-score-level { font-size: 22px; font-weight: 700; color: #0f172a; }
            .pr-category { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .pr-category-name { font-size: 14px; color: #475569; }
            .pr-category-value { font-size: 14px; font-weight: 700; color: #0f172a; }
            .pr-bar-wrap { background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 4px; }
            .pr-insight { padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #059669; }
            .pr-insight-head { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
            .pr-insight-body { font-size: 12px; color: #64748b; line-height: 1.5; }
            .pr-rec { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .pr-rec-title { font-size: 13px; font-weight: 700; color: #0f172a; }
            .pr-rec-desc { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5; }
            .pr-rec-saving { font-size: 12px; font-weight: 700; color: #059669; margin-top: 4px; }
            .pr-benchmark { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
            .pr-bm-card { padding: 16px; border-radius: 8px; text-align: center; }
            .pr-bm-value { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
            .pr-bm-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
            .pr-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          }
        `}</style>

        <div className="pr-header">
          <div>
            <div className="pr-logo">🌿 CarbFoot AI</div>
            <div className="pr-date">Personal Sustainability Report · Generated {formatDate(new Date().toISOString())}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 14, color: '#64748b' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{userProfile.name}</div>
            <div>Assessment: {formatDate(assessmentData.completedAt)}</div>
          </div>
        </div>

        {/* Eco Score */}
        <div className="pr-section">
          <div className="pr-section-title">📊 Eco Score & Overall Footprint</div>
          <div className="pr-score-row">
            <div>
              <div className="pr-score-num">{carbonResult.ecoScore}</div>
              <div className="pr-score-label">Eco Score / 100</div>
            </div>
            <div>
              <div className="pr-score-level">{carbonResult.sustainabilityLevel}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
                {formatCO2(carbonResult.totalAnnualKgCO2e)}
              </div>
              <div className="pr-score-label">Annual carbon footprint</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Global Percentile</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{carbonResult.percentileRank}th</div>
            </div>
          </div>
        </div>

        {/* Benchmarks */}
        <div className="pr-section">
          <div className="pr-section-title">📈 Emission Benchmarks</div>
          <div className="pr-benchmark">
            <div className="pr-bm-card" style={{ background: '#fef2f2' }}>
              <div className="pr-bm-value" style={{ color: '#ef4444' }}>
                {formatCO2Short(carbonResult.totalAnnualKgCO2e)}
              </div>
              <div className="pr-bm-label">Your Footprint</div>
            </div>
            <div className="pr-bm-card" style={{ background: '#fefce8' }}>
              <div className="pr-bm-value" style={{ color: '#d97706' }}>
                {formatCO2Short(globalTotal)}
              </div>
              <div className="pr-bm-label">Global Average</div>
            </div>
            <div className="pr-bm-card" style={{ background: '#f0fdf4' }}>
              <div className="pr-bm-value" style={{ color: '#059669' }}>2.0t</div>
              <div className="pr-bm-label">Sustainable Target</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="pr-section">
          <div className="pr-section-title">🗂️ Emissions by Category</div>
          {categoryKeys.map(k => {
            const pct = Math.round((carbonResult.byCategory[k] / carbonResult.totalAnnualKgCO2e) * 100);
            return (
              <div key={k} className="pr-category">
                <div>
                  <div className="pr-category-name">
                    {CATEGORY_ICONS[k]} {CATEGORY_LABELS[k]}
                  </div>
                  <div className="pr-bar-wrap">
                    <div style={{ background: CATEGORY_COLORS[k], height: '100%', width: `${pct}%` }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pr-category-value">{formatCO2(carbonResult.byCategory[k])}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{pct}%</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <div className="pr-section">
          <div className="pr-section-title">🤖 AI Insights</div>
          {insights.slice(0, 4).map(insight => (
            <div key={insight.id} className="pr-insight">
              <div className="pr-insight-head">{insight.icon} {insight.headline}</div>
              <div className="pr-insight-body">{insight.detail}</div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="pr-section">
          <div className="pr-section-title">💡 Top Recommended Actions</div>
          {recommendations.map((rec, i) => (
            <div key={rec.id} className="pr-rec">
              <div className="pr-rec-title">{i + 1}. {rec.title}</div>
              <div className="pr-rec-desc">{rec.description}</div>
              <div className="pr-rec-saving">Potential saving: {formatCO2(rec.estimatedSavingKgCO2e)}/year</div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13 }}>
            <strong style={{ color: '#059669' }}>Total potential savings:</strong>{' '}
            {formatCO2(totalSavingsPossible)}/year — equivalent to planting ~{Math.round(totalSavingsPossible / 22)} trees
          </div>
        </div>

        <div className="pr-footer">
          <p>CarbFoot AI — Personal Carbon Intelligence · carbfootai.app</p>
          <p>Emission factors: EPA (2023), IPCC AR6, IEA, UK DEFRA. Estimates are directional guidance, not legally precise measurements.</p>
        </div>
      </div>
    </>
  );
}
