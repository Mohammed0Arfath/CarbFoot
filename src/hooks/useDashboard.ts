/**
 * CarbFoot AI — useDashboard Hook
 *
 * Extracts all computed data needed by DashboardPage from the app state.
 * Keeps the page component focused on layout and interaction only.
 *
 * Computes:
 * - Chart datasets (donut, line, bar)
 * - Benchmark comparisons
 * - Recommendations + insights
 * - Derived values (highestCategory, totalSavingsPossible)
 */

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { generateRecommendations } from '@/engine/recommender';
import { generateInsights } from '@/engine/insights';
import {
  formatMonth,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/utils/formatting';
import type { CategoryEmissions } from '@/types';

// ── Benchmark constants ──────────────────────────────────────
export const GLOBAL_AVERAGES: CategoryEmissions = {
  transportation: 1800,
  energy:         1100,
  food:           2000,
  shopping:       600,
  waste:          350,
};

export const GLOBAL_TOTAL    = Object.values(GLOBAL_AVERAGES).reduce((a, b) => a + b, 0); // 5850
export const EU_AVERAGE      = 8400;
export const SUSTAINABLE_TARGET = 2000;

// ── Chart styling constants ──────────────────────────────────
const CHART_FONT = 'Inter, sans-serif';

export const CHART_DEFAULTS = {
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

export const AXIS_STYLE = {
  ticks:  { color: '#8b949e', font: { family: CHART_FONT, size: 11 } },
  grid:   { color: 'rgba(255,255,255,0.05)' },
  border: { color: 'transparent' },
};

export const INSIGHT_TYPE_STYLES = {
  warning:     { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon_color: '#f87171' },
  opportunity: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon_color: '#fbbf24' },
  positive:    { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon_color: '#4ade80' },
  info:        { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  icon_color: '#60a5fa' },
};

// ── Hook ─────────────────────────────────────────────────────

export interface DashboardData {
  // Raw state
  isReady: boolean;
  byCategory: CategoryEmissions;
  totalAnnualKgCO2e: number;
  ecoScore: number;
  sustainabilityLevel: string;
  percentileRank: number;
  monthlyHistory: ReturnType<typeof useApp>['state']['monthlyHistory'];
  categoryKeys: (keyof CategoryEmissions)[];

  // Derived
  highestCategory: keyof CategoryEmissions;
  totalSavingsPossible: number;
  gapToTarget: number;

  // Recommendations & insights
  recommendations: ReturnType<typeof generateRecommendations>;
  insights: ReturnType<typeof generateInsights>;

  // Chart datasets
  donutData: object;
  lineData: object;
  barData: object;

  // Benchmarks
  benchmarks: Array<{ label: string; value: number; color: string; bg: string; icon: string }>;
  maxBenchmark: number;
}

export function useDashboard(): DashboardData {
  const { state } = useApp();
  const { carbonResult, assessmentData, monthlyHistory } = state;

  const isReady = state.hasCompletedAssessment && !!carbonResult;

  // Safe defaults so hooks are always called unconditionally
  const byCategory: CategoryEmissions = carbonResult?.byCategory ?? {
    transportation: 0, energy: 0, food: 0, shopping: 0, waste: 0,
  };
  const totalAnnualKgCO2e = carbonResult?.totalAnnualKgCO2e ?? 0;
  const ecoScore           = carbonResult?.ecoScore ?? 0;
  const sustainabilityLevel = carbonResult?.sustainabilityLevel ?? 'Beginner';
  const percentileRank      = carbonResult?.percentileRank ?? 0;

  const categoryKeys = useMemo(
    () => Object.keys(byCategory) as (keyof CategoryEmissions)[],
    [byCategory],
  );

  const recommendations = useMemo(() => {
    if (!assessmentData || !carbonResult) return [];
    return generateRecommendations(assessmentData, carbonResult.byCategory, 8);
  }, [assessmentData, carbonResult]);

  const insights = useMemo(() => {
    if (!assessmentData || !carbonResult) return [];
    return generateInsights(carbonResult, assessmentData);
  }, [assessmentData, carbonResult]);

  const highestCategory = useMemo(
    () => categoryKeys.reduce((a, b) => (byCategory[a] > byCategory[b] ? a : b)),
    [categoryKeys, byCategory],
  );

  const totalSavingsPossible = useMemo(
    () => recommendations.reduce((s, r) => s + r.estimatedSavingKgCO2e, 0),
    [recommendations],
  );

  const gapToTarget = Math.max(0, totalAnnualKgCO2e - SUSTAINABLE_TARGET);

  // ── Chart datasets ─────────────────────────────────────────
  const donutData = useMemo(() => ({
    labels: categoryKeys.map(k => CATEGORY_LABELS[k]),
    datasets: [{
      data: categoryKeys.map(k => byCategory[k]),
      backgroundColor: categoryKeys.map(k => CATEGORY_COLORS[k]),
      borderColor: 'transparent',
      hoverOffset: 6,
    }],
  }), [categoryKeys, byCategory]);

  const lineData = useMemo(() => ({
    labels: monthlyHistory.map(e => formatMonth(e.month)),
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
  }), [monthlyHistory]);

  const barData = useMemo(() => ({
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
  }), [categoryKeys, byCategory]);

  // ── Benchmarks ─────────────────────────────────────────────
  const benchmarks = useMemo(() => [
    {
      label: 'Your Footprint',
      value: totalAnnualKgCO2e,
      color: totalAnnualKgCO2e > GLOBAL_TOTAL ? '#f87171' : '#4ade80',
      bg:    totalAnnualKgCO2e > GLOBAL_TOTAL ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
      icon:  '📍',
    },
    { label: 'Global Average', value: GLOBAL_TOTAL, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   icon: '🌍' },
    { label: 'EU Average',     value: EU_AVERAGE,   color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   icon: '🇪🇺' },
    { label: '1.5°C Target',   value: SUSTAINABLE_TARGET, color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', icon: '🎯' },
  ], [totalAnnualKgCO2e]);

  const maxBenchmark = Math.max(...benchmarks.map(b => b.value)) * 1.05;

  return {
    isReady,
    byCategory,
    totalAnnualKgCO2e,
    ecoScore,
    sustainabilityLevel,
    percentileRank,
    monthlyHistory,
    categoryKeys,
    highestCategory,
    totalSavingsPossible,
    gapToTarget,
    recommendations,
    insights,
    donutData,
    lineData,
    barData,
    benchmarks,
    maxBenchmark,
  };
}
