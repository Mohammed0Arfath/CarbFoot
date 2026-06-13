/**
 * CarbFoot AI — Carbon Reduction Simulator
 *
 * Allows users to interactively model "what-if" scenarios by adjusting
 * lifestyle sliders and seeing real-time footprint recalculation.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  calculateTransportationEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateShoppingEmissions,
  calculateWasteEmissions,
  computeEcoScore,
  getSustainabilityLevel,
} from '@/engine/calculator';
import { toTreeEquivalent, toCarKmEquivalent } from '@/engine/insights';
import {
  formatCO2, formatCO2Short, CATEGORY_COLORS,
  CATEGORY_ICONS, CATEGORY_LABELS,
} from '@/utils/formatting';
import EcoScoreRing from '@/components/EcoScoreRing';
import type { CategoryEmissions } from '@/types';

// ── Scenario Slider Definition ────────────────────────────────

interface ScenarioSlider {
  id: string;
  label: string;
  description: string;
  category: keyof CategoryEmissions;
  icon: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  /** How this slider modifies the category. Returns the emission delta (negative = savings) */
  applyFn: (value: number, baseEmissions: number) => number;
}

function buildSliders(data: NonNullable<ReturnType<typeof useApp>['state']['assessmentData']>): ScenarioSlider[] {
  return [
    {
      id: 'reduce-car-km',
      label: 'Reduce weekly car distance',
      description: 'How many km less per week would you drive?',
      category: 'transportation',
      icon: '🚗',
      min: 0,
      max: Math.min(data.transportation.commuteDistance * 10, 400),
      step: 5,
      unit: 'km/week less',
      defaultValue: 0,
      applyFn: (kmReductionPerWeek, base) => {
        const annualReduction = kmReductionPerWeek * 52;
        const factor = data.transportation.fuelType === 'electric' ? 0.053
          : data.transportation.fuelType === 'hybrid' ? 0.120 : 0.192;
        return -Math.round(annualReduction * factor);
      },
    },
    {
      id: 'more-pt-days',
      label: 'Additional public transport days',
      description: 'Extra days per week using bus/train instead of car',
      category: 'transportation',
      icon: '🚌',
      min: 0,
      max: Math.max(0, 5 - data.transportation.publicTransportDays),
      step: 1,
      unit: 'extra days/week',
      defaultValue: 0,
      applyFn: (extraDays, base) => {
        const kmPerDay = data.transportation.commuteDistance * 2;
        const annualKm = extraDays * 52 * kmPerDay;
        const carFactor = data.transportation.fuelType === 'electric' ? 0.053 : 0.192;
        const ptFactor = 0.089;
        return -Math.round(annualKm * (carFactor - ptFactor));
      },
    },
    {
      id: 'fewer-flights',
      label: 'Reduce long-haul flights',
      description: 'Fewer international flights per year',
      category: 'transportation',
      icon: '✈️',
      min: 0,
      max: data.transportation.longFlightsPerYear,
      step: 1,
      unit: 'fewer flights/year',
      defaultValue: 0,
      applyFn: (fewerFlights) => -Math.round(fewerFlights * 5500 * 0.195),
    },
    {
      id: 'renewable-energy',
      label: 'Increase renewable energy %',
      description: 'Switch to a greener energy tariff or add solar',
      category: 'energy',
      icon: '☀️',
      min: 0,
      max: 100 - data.energy.renewablePercentage,
      step: 10,
      unit: '% more renewable',
      defaultValue: 0,
      applyFn: (extraRenewable, base) => {
        const annualKwh = data.energy.monthlyElectricityKwh * 12;
        return -Math.round(annualKwh * 0.462 * (extraRenewable / 100));
      },
    },
    {
      id: 'reduce-electricity',
      label: 'Reduce monthly electricity use',
      description: 'Through efficiency improvements and behaviour changes',
      category: 'energy',
      icon: '💡',
      min: 0,
      max: Math.round(data.energy.monthlyElectricityKwh * 0.5),
      step: 10,
      unit: 'kWh/month less',
      defaultValue: 0,
      applyFn: (kwhReduction, base) => {
        const factor = 0.462 * (1 - data.energy.renewablePercentage / 100);
        return -Math.round(kwhReduction * 12 * factor);
      },
    },
    {
      id: 'reduce-beef',
      label: 'Reduce beef meals per week',
      description: 'Replace with chicken, fish, or plant protein',
      category: 'food',
      icon: '🥩',
      min: 0,
      max: data.food.beefMealsPerWeek,
      step: 1,
      unit: 'fewer meals/week',
      defaultValue: 0,
      applyFn: (fewerMeals) => -Math.round(fewerMeals * 52 * 6.0),
    },
    {
      id: 'diet-shift',
      label: 'Diet improvement level',
      description: 'Shift toward more plant-based eating overall',
      category: 'food',
      icon: '🥗',
      min: 0,
      max: 50,
      step: 10,
      unit: '% more plant-based',
      defaultValue: 0,
      applyFn: (pct, base) => -Math.round(base * (pct / 100) * 0.4),
    },
    {
      id: 'reduce-fashion',
      label: 'Cut fast fashion purchases',
      description: 'Fewer new clothing items per month',
      category: 'shopping',
      icon: '👗',
      min: 0,
      max: data.shopping.fastFashionItemsPerMonth,
      step: 1,
      unit: 'fewer items/month',
      defaultValue: 0,
      applyFn: (fewerItems) => -Math.round(fewerItems * 12 * 10.0),
    },
    {
      id: 'improve-recycling',
      label: 'Improve recycling rate',
      description: 'Recycle more materials consistently',
      category: 'waste',
      icon: '♻️',
      min: 0,
      max: 40,
      step: 10,
      unit: '% more recycled',
      defaultValue: 0,
      applyFn: (extraPct, base) => -Math.round(base * (extraPct / 100) * 0.5),
    },
  ].filter(s => s.max > 0); // Only show relevant sliders
}

// ── Comparison Bar ────────────────────────────────────────────

function ComparisonBar({
  label, value, maxValue, color, icon,
}: {
  label: string; value: number; maxValue: number; color: string; icon: string;
}) {
  const pct = Math.min(100, Math.round((value / maxValue) * 100));
  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span aria-hidden="true">{icon}</span> {label}
        </span>
        <strong style={{ fontSize: '0.875rem' }}>{formatCO2(value)}</strong>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-label={`${label}: ${formatCO2(value)}`}
      >
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { assessmentData, carbonResult } = state;

  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  const sliders = useMemo(() => {
    if (!assessmentData) return [];
    return buildSliders(assessmentData);
  }, [assessmentData]);

  // ── Compute scenario emissions ──────────────────────────────
  const scenarioResult = useMemo(() => {
    if (!assessmentData || !carbonResult) return null;

    const baseByCategory = { ...carbonResult.byCategory };

    // Group deltas by category
    const deltas: Record<string, number> = {
      transportation: 0,
      energy:         0,
      food:           0,
      shopping:       0,
      waste:          0,
    };

    for (const slider of sliders) {
      const val = sliderValues[slider.id] ?? 0;
      if (val > 0) {
        deltas[slider.category] += slider.applyFn(val, baseByCategory[slider.category]);
      }
    }

    const scenarioByCategory: CategoryEmissions = {
      transportation: Math.max(0, baseByCategory.transportation + deltas.transportation),
      energy:         Math.max(0, baseByCategory.energy         + deltas.energy),
      food:           Math.max(0, baseByCategory.food           + deltas.food),
      shopping:       Math.max(0, baseByCategory.shopping       + deltas.shopping),
      waste:          Math.max(0, baseByCategory.waste          + deltas.waste),
    };

    const scenarioTotal = Object.values(scenarioByCategory).reduce((a, b) => a + b, 0);
    const totalSavings = carbonResult.totalAnnualKgCO2e - scenarioTotal;
    const pctImprovement = Math.round((totalSavings / carbonResult.totalAnnualKgCO2e) * 100);
    const scenarioEcoScore = computeEcoScore(scenarioTotal);
    const scenarioLevel = getSustainabilityLevel(scenarioEcoScore);

    return {
      byCategory: scenarioByCategory,
      totalKgCO2e: scenarioTotal,
      totalSavings,
      pctImprovement,
      ecoScore: scenarioEcoScore,
      level: scenarioLevel,
      treesEquivalent: toTreeEquivalent(totalSavings),
      carKmEquivalent: toCarKmEquivalent(totalSavings),
    };
  }, [sliders, sliderValues, assessmentData, carbonResult]);

  const setSlider = (id: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [id]: value }));
  };

  const resetAll = () => setSliderValues({});

  const hasChanges = Object.values(sliderValues).some(v => v > 0);

  if (!state.hasCompletedAssessment || !carbonResult || !assessmentData) {
    return (
      <main id="main-content" className="page">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }} aria-hidden="true">🔬</div>
          <h1 className="page-title" style={{ marginBottom: '1rem' }}>Complete Assessment First</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            The simulator needs your carbon footprint data to model scenarios.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/assessment')} id="simulator-go-assessment">
            Start Assessment
          </button>
        </div>
      </main>
    );
  }

  const maxTotal = carbonResult.totalAnnualKgCO2e * 1.1;

  return (
    <main id="main-content" className="page">
      <div className="container">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
            <h1 className="page-title font-display">Carbon Reduction Simulator</h1>
            <span className="badge badge-accent">Interactive</span>
          </div>
          <p className="page-subtitle">
            Adjust the sliders to model lifestyle changes and see your footprint update in real-time.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left: Sliders ────────────────────────────── */}
          <div>
            <div
              className="flex justify-between items-center"
              style={{ marginBottom: '1.25rem' }}
            >
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>
                Adjust Your Lifestyle Scenarios
              </h2>
              {hasChanges && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={resetAll}
                  id="simulator-reset"
                  aria-label="Reset all sliders to zero"
                >
                  ↺ Reset All
                </button>
              )}
            </div>

            {/* Group sliders by category */}
            {(['transportation', 'energy', 'food', 'shopping', 'waste'] as (keyof CategoryEmissions)[]).map(cat => {
              const catSliders = sliders.filter(s => s.category === cat);
              if (catSliders.length === 0) return null;

              return (
                <section
                  key={cat}
                  className="card"
                  style={{ marginBottom: '1rem' }}
                  aria-labelledby={`sim-cat-${cat}`}
                >
                  <h3
                    id={`sim-cat-${cat}`}
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 6,
                        background: `${CATEGORY_COLORS[cat]}20`,
                        fontSize: '0.875rem',
                      }}
                      aria-hidden="true"
                    >
                      {CATEGORY_ICONS[cat]}
                    </span>
                    {CATEGORY_LABELS[cat]}
                    {(() => {
                      const delta = catSliders.reduce((sum, s) => {
                        const v = sliderValues[s.id] ?? 0;
                        return sum + (v > 0 ? s.applyFn(v, carbonResult.byCategory[cat]) : 0);
                      }, 0);
                      return delta < 0 ? (
                        <span
                          className="badge badge-success"
                          style={{ fontSize: '0.75rem' }}
                          aria-label={`Saving ${formatCO2Short(Math.abs(delta))} in this category`}
                        >
                          saving {formatCO2Short(Math.abs(delta))}
                        </span>
                      ) : null;
                    })()}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {catSliders.map(slider => {
                      const value = sliderValues[slider.id] ?? 0;
                      const saving = value > 0
                        ? slider.applyFn(value, carbonResult.byCategory[slider.category])
                        : 0;

                      return (
                        <div key={slider.id} className="form-group">
                          <div className="flex justify-between items-center">
                            <label
                              className="form-label"
                              htmlFor={`slider-${slider.id}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <span aria-hidden="true">{slider.icon}</span>
                              {slider.label}
                            </label>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: 'var(--brand-400)', fontSize: '0.9375rem' }}>
                                {value} {slider.unit.split(' ').slice(1).join(' ')}
                              </strong>
                              {saving < 0 && (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--success)' }}>
                                  saving {formatCO2Short(Math.abs(saving))}/yr
                                </div>
                              )}
                            </div>
                          </div>
                          <input
                            id={`slider-${slider.id}`}
                            type="range"
                            className="form-range"
                            min={slider.min}
                            max={slider.max}
                            step={slider.step}
                            value={value}
                            onChange={e => setSlider(slider.id, parseInt(e.target.value))}
                            aria-describedby={`slider-desc-${slider.id}`}
                            aria-valuetext={`${value} ${slider.unit}${saving < 0 ? `, saving ${formatCO2Short(Math.abs(saving))} per year` : ''}`}
                          />
                          <div
                            id={`slider-desc-${slider.id}`}
                            className="form-hint"
                          >
                            {slider.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* ── Right: Results Panel ─────────────────────── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card card-glow" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>
                📊 Scenario Results
              </h2>

              {/* Before / After Eco Score */}
              <div
                className="flex justify-between items-center"
                style={{ marginBottom: '1.5rem' }}
                aria-label="Eco score comparison"
              >
                <div style={{ textAlign: 'center' }}>
                  <EcoScoreRing
                    score={carbonResult.ecoScore}
                    level={carbonResult.sustainabilityLevel}
                    size={110}
                    strokeWidth={9}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                    Current
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }} aria-hidden="true">→</div>
                <div style={{ textAlign: 'center' }}>
                  <EcoScoreRing
                    score={scenarioResult?.ecoScore ?? carbonResult.ecoScore}
                    level={scenarioResult?.level ?? carbonResult.sustainabilityLevel}
                    size={110}
                    strokeWidth={9}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                    Scenario
                  </div>
                </div>
              </div>

              {/* Total comparison */}
              <div style={{ marginBottom: '1.25rem' }}>
                <ComparisonBar
                  label="Current footprint"
                  value={carbonResult.totalAnnualKgCO2e}
                  maxValue={maxTotal}
                  color="#f87171"
                  icon="📍"
                />
                <div style={{ margin: '0.625rem 0' }} />
                <ComparisonBar
                  label="Scenario footprint"
                  value={scenarioResult?.totalKgCO2e ?? carbonResult.totalAnnualKgCO2e}
                  maxValue={maxTotal}
                  color="#4ade80"
                  icon="🎯"
                />
                <div style={{ margin: '0.625rem 0' }} />
                <ComparisonBar
                  label="Sustainable target"
                  value={2000}
                  maxValue={maxTotal}
                  color="#22d3ee"
                  icon="🌍"
                />
              </div>

              {/* Savings callout */}
              {scenarioResult && scenarioResult.totalSavings > 0 && (
                <div
                  style={{
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                  role="status"
                  aria-live="polite"
                  aria-label={`Scenario saves ${formatCO2(scenarioResult.totalSavings)} per year`}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--success)', letterSpacing: '-0.03em' }}>
                    -{formatCO2(scenarioResult.totalSavings)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 600 }}>
                    saved per year ({scenarioResult.pctImprovement}% reduction)
                  </div>
                  <hr className="divider" style={{ margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <span>🌳 = {scenarioResult.treesEquivalent} trees planted</span>
                    <span>🚗 = {scenarioResult.carKmEquivalent.toLocaleString()} km not driven</span>
                  </div>
                </div>
              )}

              {!hasChanges && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Adjust the sliders on the left to model your impact.
                </p>
              )}

              {/* Category breakdown in scenario */}
              {hasChanges && scenarioResult && (
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                    Scenario Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(Object.keys(scenarioResult.byCategory) as (keyof CategoryEmissions)[]).map(cat => {
                      const base = carbonResult.byCategory[cat];
                      const scenario = scenarioResult.byCategory[cat];
                      const delta = scenario - base;
                      return (
                        <div key={cat} className="flex justify-between items-center" style={{ fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span> {CATEGORY_LABELS[cat]}
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 600 }}>{formatCO2Short(scenario)}</span>
                            {delta < 0 && (
                              <span style={{ color: 'var(--success)', marginLeft: '0.375rem' }}>
                                ({formatCO2Short(Math.abs(delta))} ↓)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => navigate('/dashboard')}
              id="simulator-go-dashboard"
              aria-label="View full analytics dashboard"
            >
              View Full Dashboard →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
