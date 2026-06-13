/**
 * CarbFoot AI — Natural Language Insight Generator
 *
 * Produces human-readable, data-driven insight sentences from
 * a user's carbon footprint breakdown. These look AI-generated
 * while being fully rule-based and deterministic.
 */

import type { CategoryEmissions, CarbonResult, AssessmentData } from '@/types';
import { CATEGORY_LABELS } from '@/utils/formatting';

export interface Insight {
  id: string;
  headline: string;
  detail: string;
  category: keyof CategoryEmissions | 'overall';
  type: 'warning' | 'opportunity' | 'positive' | 'info';
  icon: string;
}

const GLOBAL_AVERAGES: CategoryEmissions = {
  transportation: 1800,
  energy:         1100,
  food:           2000,
  shopping:       600,
  waste:          350,
};

const GLOBAL_TOTAL = Object.values(GLOBAL_AVERAGES).reduce((a, b) => a + b, 0);

export function generateInsights(
  result: CarbonResult,
  data: AssessmentData
): Insight[] {
  const insights: Insight[] = [];
  const { byCategory, totalAnnualKgCO2e } = result;
  const categoryKeys = Object.keys(byCategory) as (keyof CategoryEmissions)[];

  // ── Find top contributors ─────────────────────────────────
  const sorted = [...categoryKeys].sort((a, b) => byCategory[b] - byCategory[a]);
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top1Pct = Math.round((byCategory[top1] / totalAnnualKgCO2e) * 100);

  // Overall headline
  const tonneTotal = (totalAnnualKgCO2e / 1000).toFixed(1);
  const vsGlobal = totalAnnualKgCO2e - GLOBAL_TOTAL;
  const vsGlobalPct = Math.abs(Math.round((vsGlobal / GLOBAL_TOTAL) * 100));

  insights.push({
    id: 'overall-summary',
    headline: `Your footprint is ${tonneTotal}t CO₂e/year`,
    detail: vsGlobal > 0
      ? `That's ${vsGlobalPct}% above the global average of 4.8t. Targeted action in ${CATEGORY_LABELS[top1].toLowerCase()} and ${CATEGORY_LABELS[top2].toLowerCase()} could bring you in line with the global mean.`
      : `That's ${vsGlobalPct}% below the global average — you're already making a real difference. Keep going to reach the 2.0t sustainable target.`,
    category: 'overall',
    type: vsGlobal > 0 ? 'warning' : 'positive',
    icon: vsGlobal > 0 ? '⚠️' : '🌟',
  });

  // ── Top contributor insight ────────────────────────────────
  const top1VsAvg = byCategory[top1] - GLOBAL_AVERAGES[top1];
  insights.push({
    id: `top-contributor-${top1}`,
    headline: `${CATEGORY_LABELS[top1]} drives ${top1Pct}% of your footprint`,
    detail: top1VsAvg > 0
      ? `At ${Math.round(byCategory[top1] / 1000 * 10) / 10}t/year, your ${CATEGORY_LABELS[top1].toLowerCase()} emissions are ${Math.round((top1VsAvg / GLOBAL_AVERAGES[top1]) * 100)}% above average. This is your highest-leverage reduction area.`
      : `Your ${CATEGORY_LABELS[top1].toLowerCase()} footprint is actually ${Math.abs(Math.round((top1VsAvg / GLOBAL_AVERAGES[top1]) * 100))}% below the global average — a real strength.`,
    category: top1,
    type: top1VsAvg > 500 ? 'warning' : top1VsAvg > 0 ? 'opportunity' : 'positive',
    icon: top1VsAvg > 0 ? '🔴' : '✅',
  });

  // ── Transportation specific ─────────────────────────────────
  if (data.transportation.longFlightsPerYear > 2) {
    const flightKg = data.transportation.longFlightsPerYear * 5500 * 0.195;
    insights.push({
      id: 'flights-high',
      headline: `${data.transportation.longFlightsPerYear} long-haul flights = ${Math.round(flightKg)} kg CO₂e`,
      detail: `Flying is among the most carbon-intensive activities. Replacing even one long-haul return trip with rail or a video call could save over 2 tonnes annually.`,
      category: 'transportation',
      type: 'warning',
      icon: '✈️',
    });
  }

  if (data.transportation.fuelType === 'petrol' && data.transportation.commuteDistance > 15) {
    const annualKm = data.transportation.commuteDistance * 5 * 52 * 2;
    const evSaving = Math.round(annualKm * (0.192 - 0.053));
    insights.push({
      id: 'ev-opportunity',
      headline: `Switching to an EV could save ${Math.round(evSaving / 1000 * 10) / 10}t CO₂e/year`,
      detail: `Your ${Math.round(annualKm).toLocaleString()} km annual commute in a petrol car is your single largest controllable emission. An EV reduces per-km emissions by 72%.`,
      category: 'transportation',
      type: 'opportunity',
      icon: '⚡',
    });
  }

  // ── Energy specific ─────────────────────────────────────────
  if (data.energy.renewablePercentage < 20 && data.energy.monthlyElectricityKwh > 200) {
    const savingKg = Math.round(data.energy.monthlyElectricityKwh * 12 * 0.462 * 0.9);
    insights.push({
      id: 'renewable-opportunity',
      headline: `Going 100% renewable saves ~${Math.round(savingKg / 100) * 100} kg CO₂e/year`,
      detail: `Switching to a green energy tariff is one of the easiest high-impact changes you can make — often with no installation required and minimal cost difference.`,
      category: 'energy',
      type: 'opportunity',
      icon: '☀️',
    });
  }

  // ── Food specific ─────────────────────────────────────────
  if (data.food.beefMealsPerWeek >= 4) {
    const beefKg = data.food.beefMealsPerWeek * 52 * 6;
    insights.push({
      id: 'beef-high',
      headline: `Your beef habit adds ${Math.round(beefKg)} kg CO₂e/year`,
      detail: `Beef produces 20× more emissions than plant proteins. Cutting beef meals in half would save ${Math.round(beefKg / 2)} kg CO₂e — equivalent to planting ${Math.round(beefKg / 2 / 22)} trees.`,
      category: 'food',
      type: 'warning',
      icon: '🥩',
    });
  }

  // ── Positive reinforcements ──────────────────────────────
  if (data.waste.composting) {
    insights.push({
      id: 'composting-positive',
      headline: 'Your composting habit is making a real difference',
      detail: 'Composting diverts organic waste from landfill, preventing methane emissions. Combined with recycling, you\'re setting an excellent waste reduction example.',
      category: 'waste',
      type: 'positive',
      icon: '🌱',
    });
  }

  if (data.energy.renewablePercentage >= 80) {
    insights.push({
      id: 'renewable-positive',
      headline: `${data.energy.renewablePercentage}% renewable energy — excellent!`,
      detail: 'Your clean energy commitment significantly reduces your electricity footprint. This is one of the most impactful household-level changes anyone can make.',
      category: 'energy',
      type: 'positive',
      icon: '♻️',
    });
  }

  // ── Paris Agreement context ──────────────────────────────
  const sustainableTarget = 2000; // 2t CO₂e
  const gapToTarget = totalAnnualKgCO2e - sustainableTarget;
  if (gapToTarget > 0) {
    const yearsAtRate = Math.round(gapToTarget / 300); // assumes 300kg/yr reduction
    insights.push({
      id: 'paris-gap',
      headline: `${(gapToTarget / 1000).toFixed(1)}t above the 2°C-compatible target`,
      detail: `The Paris Agreement implies a personal budget of ~2.0t CO₂e/year by 2050. You need to reduce by ${(gapToTarget / 1000).toFixed(1)}t. Focused action on ${CATEGORY_LABELS[top1].toLowerCase()} gets you there fastest.`,
      category: 'overall',
      type: 'info',
      icon: '🌡️',
    });
  }

  return insights.slice(0, 6); // Return top 6 insights
}

/** Tree equivalent for a given CO₂ reduction */
export function toTreeEquivalent(kgCO2e: number): number {
  return Math.round(kgCO2e / 22); // Average tree absorbs ~22 kg CO₂/year
}

/** Car km equivalent */
export function toCarKmEquivalent(kgCO2e: number): number {
  return Math.round(kgCO2e / 0.192); // medium petrol car
}
