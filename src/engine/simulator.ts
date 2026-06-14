/**
 * CarbFoot AI — Simulator Engine
 *
 * Pure business logic for the carbon reduction "what-if" simulator.
 * Builds scenario sliders from a user's assessment data and applies
 * reduction functions to recalculate category emissions.
 *
 * Keeping this in engine/ means it is:
 *  - Decoupled from React and Chart.js
 *  - Unit-testable without a DOM
 *  - Reusable across future contexts (e.g., API, CLI, mobile)
 */

import type { AssessmentData, CategoryEmissions } from '@/types';

// ── Slider Definition ────────────────────────────────────────

export interface ScenarioSlider {
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
  /**
   * Returns the emission delta in kg CO₂e for the given slider value.
   * Negative values indicate savings (reductions).
   */
  applyFn: (value: number, baseEmissions: number) => number;
}

/**
 * Build the full set of scenario sliders for a user's assessment data.
 * Sliders with max === 0 are filtered out (no headroom to reduce).
 */
export function buildSliders(data: AssessmentData): ScenarioSlider[] {
  const sliders: ScenarioSlider[] = [
    // ── Transportation ──────────────────────────────────────
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
      applyFn: (kmReductionPerWeek: number) => {
        const annualReduction = kmReductionPerWeek * 52;
        const factor =
          data.transportation.fuelType === 'electric' ? 0.053
          : data.transportation.fuelType === 'hybrid'  ? 0.120
          : 0.192;
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
      applyFn: (extraDays: number) => {
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
      applyFn: (fewerFlights: number) => -Math.round(fewerFlights * 5500 * 0.195),
    },

    // ── Energy ───────────────────────────────────────────────
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
      applyFn: (extraRenewable: number) => {
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
      applyFn: (kwhReduction: number) => {
        const factor = 0.462 * (1 - data.energy.renewablePercentage / 100);
        return -Math.round(kwhReduction * 12 * factor);
      },
    },

    // ── Food ─────────────────────────────────────────────────
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
      applyFn: (fewerMeals: number) => -Math.round(fewerMeals * 52 * 6.0),
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
      applyFn: (pct: number, base: number) => -Math.round(base * (pct / 100) * 0.4),
    },

    // ── Shopping ─────────────────────────────────────────────
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
      applyFn: (fewerItems: number) => -Math.round(fewerItems * 12 * 10.0),
    },

    // ── Waste ────────────────────────────────────────────────
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
      applyFn: (extraPct: number, base: number) => -Math.round(base * (extraPct / 100) * 0.5),
    },
  ];

  // Only expose sliders that have actionable headroom
  return sliders.filter(s => s.max > 0);
}

/**
 * Apply a set of slider values to a base category emissions object.
 * Returns the adjusted emissions after all scenario changes.
 */
export function applyScenario(
  sliders: ScenarioSlider[],
  sliderValues: Record<string, number>,
  baseEmissions: CategoryEmissions
): CategoryEmissions {
  const result: CategoryEmissions = { ...baseEmissions };

  for (const slider of sliders) {
    const value = sliderValues[slider.id] ?? slider.defaultValue;
    if (value === 0) continue;
    const delta = slider.applyFn(value, baseEmissions[slider.category]);
    result[slider.category] = Math.max(0, result[slider.category] + delta);
  }

  return result;
}

/**
 * Sum all category emissions to get the total annual footprint.
 */
export function sumEmissions(byCategory: CategoryEmissions): number {
  return Object.values(byCategory).reduce((a, b) => a + b, 0);
}
