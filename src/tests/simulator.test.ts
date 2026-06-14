/**
 * Unit Tests — Simulator Engine
 *
 * Tests cover:
 * - buildSliders: correct slider set for different assessment profiles
 * - buildSliders: slider filtering (max === 0 sliders removed)
 * - applyScenario: emission deltas are applied correctly per category
 * - applyScenario: emissions are never driven below zero
 * - sumEmissions: correctly sums category values
 * - Individual applyFn: petrol vs EV emission factors
 */

import { describe, it, expect } from 'vitest';
import { buildSliders, applyScenario, sumEmissions } from '@/engine/simulator';
import type { AssessmentData } from '@/types';

// ── Fixtures ─────────────────────────────────────────────────

const makeAssessment = (overrides: Partial<AssessmentData> = {}): AssessmentData => ({
  transportation: {
    commuteDistance: 20,
    vehicleType: 'medium-car',
    fuelType: 'petrol',
    publicTransportDays: 1,
    shortFlightsPerYear: 2,
    longFlightsPerYear: 3,
  },
  energy: {
    monthlyElectricityKwh: 300,
    renewablePercentage: 20,
    householdSize: 2,
    hasGasHeating: false,
    naturalGasMonthlyM3: 0,
  },
  food: {
    dietType: 'omnivore',
    beefMealsPerWeek: 4,
    foodWasteLevel: 'moderate',
    localFoodPercentage: 20,
  },
  shopping: {
    onlineOrdersPerMonth: 5,
    fastFashionItemsPerMonth: 3,
    electronicsPerYear: 1,
    newFurniturePerYear: 0,
  },
  waste: {
    recyclingHabits: 'some',
    composting: false,
    plasticBagsPerWeek: 3,
    singleUsePlasticLevel: 'moderate',
  },
  completedAt: '2024-06-01T00:00:00.000Z',
  ...overrides,
});

const baseEmissions = {
  transportation: 3800,
  energy: 1600,
  food: 2200,
  shopping: 1000,
  waste: 350,
};

// ── buildSliders ─────────────────────────────────────────────

describe('buildSliders', () => {
  it('returns an array of sliders', () => {
    const sliders = buildSliders(makeAssessment());
    expect(Array.isArray(sliders)).toBe(true);
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('every slider has required fields', () => {
    const sliders = buildSliders(makeAssessment());
    sliders.forEach(s => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('category');
      expect(s).toHaveProperty('min');
      expect(s).toHaveProperty('max');
      expect(s).toHaveProperty('step');
      expect(s).toHaveProperty('applyFn');
      expect(typeof s.applyFn).toBe('function');
    });
  });

  it('all slider IDs are unique', () => {
    const sliders = buildSliders(makeAssessment());
    const ids = sliders.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all sliders have max > 0 (zero-headroom sliders are filtered)', () => {
    const sliders = buildSliders(makeAssessment());
    sliders.forEach(s => expect(s.max).toBeGreaterThan(0));
  });

  it('fewer-flights slider is absent when user has 0 long-haul flights', () => {
    const data = makeAssessment({
      transportation: { ...makeAssessment().transportation, longFlightsPerYear: 0 },
    });
    const sliders = buildSliders(data);
    const flightSlider = sliders.find(s => s.id === 'fewer-flights');
    expect(flightSlider).toBeUndefined();
  });

  it('fewer-flights slider is present when user has >0 long-haul flights', () => {
    const sliders = buildSliders(makeAssessment());
    const flightSlider = sliders.find(s => s.id === 'fewer-flights');
    expect(flightSlider).toBeDefined();
    expect(flightSlider!.max).toBe(3);
  });

  it('reduce-beef slider is absent when user eats 0 beef meals', () => {
    const data = makeAssessment({
      food: { ...makeAssessment().food, beefMealsPerWeek: 0 },
    });
    const sliders = buildSliders(data);
    const beefSlider = sliders.find(s => s.id === 'reduce-beef');
    expect(beefSlider).toBeUndefined();
  });

  it('reduce-fashion slider is absent when user buys 0 fast fashion items', () => {
    const data = makeAssessment({
      shopping: { ...makeAssessment().shopping, fastFashionItemsPerMonth: 0 },
    });
    const sliders = buildSliders(data);
    const fashionSlider = sliders.find(s => s.id === 'reduce-fashion');
    expect(fashionSlider).toBeUndefined();
  });

  it('renewable-energy slider max = 80 when user is at 20% renewable', () => {
    const sliders = buildSliders(makeAssessment());
    const renewableSlider = sliders.find(s => s.id === 'renewable-energy');
    expect(renewableSlider?.max).toBe(80); // 100 - 20
  });

  it('renewable-energy slider is absent when user is already at 100%', () => {
    const data = makeAssessment({
      energy: { ...makeAssessment().energy, renewablePercentage: 100 },
    });
    const sliders = buildSliders(data);
    const renewableSlider = sliders.find(s => s.id === 'renewable-energy');
    expect(renewableSlider).toBeUndefined();
  });

  it('more-pt-days slider max respects current public transport usage', () => {
    const data = makeAssessment({
      transportation: { ...makeAssessment().transportation, publicTransportDays: 3 },
    });
    const sliders = buildSliders(data);
    const ptSlider = sliders.find(s => s.id === 'more-pt-days');
    expect(ptSlider?.max).toBe(2); // 5 - 3
  });
});

// ── Individual applyFn ────────────────────────────────────────

describe('buildSliders — applyFn emission factors', () => {
  it('fewer-flights applyFn returns correct kg saving (1 flight = 1072 kg)', () => {
    const sliders = buildSliders(makeAssessment());
    const flightSlider = sliders.find(s => s.id === 'fewer-flights')!;
    const saving = flightSlider.applyFn(1, 0);
    expect(saving).toBe(-Math.round(5500 * 0.195)); // -1072
  });

  it('reduce-car-km petrol applyFn uses 0.192 kg/km factor', () => {
    const data = makeAssessment({
      transportation: { ...makeAssessment().transportation, fuelType: 'petrol' },
    });
    const sliders = buildSliders(data);
    const carSlider = sliders.find(s => s.id === 'reduce-car-km')!;
    // 10 km/week less × 52 weeks × 0.192 = 99.84 → rounds to 100
    expect(carSlider.applyFn(10, 0)).toBe(-100);
  });

  it('reduce-car-km EV applyFn uses 0.053 kg/km factor', () => {
    const data = makeAssessment({
      transportation: { ...makeAssessment().transportation, fuelType: 'electric' },
    });
    const sliders = buildSliders(data);
    const carSlider = sliders.find(s => s.id === 'reduce-car-km')!;
    // 10 km/week × 52 × 0.053 = 27.56 → rounds to 28
    expect(carSlider.applyFn(10, 0)).toBe(-28);
  });

  it('reduce-beef applyFn returns correct saving (1 meal/week = 312 kg/yr)', () => {
    const sliders = buildSliders(makeAssessment());
    const beefSlider = sliders.find(s => s.id === 'reduce-beef')!;
    expect(beefSlider.applyFn(1, 0)).toBe(-Math.round(1 * 52 * 6.0)); // -312
  });
});

// ── applyScenario ─────────────────────────────────────────────

describe('applyScenario', () => {
  it('returns base emissions when all slider values are 0', () => {
    const sliders = buildSliders(makeAssessment());
    const values: Record<string, number> = {};
    sliders.forEach(s => { values[s.id] = 0; });
    const result = applyScenario(sliders, values, baseEmissions);
    expect(result).toEqual(baseEmissions);
  });

  it('reduces transportation when car slider is moved', () => {
    const sliders = buildSliders(makeAssessment());
    const result = applyScenario(sliders, { 'reduce-car-km': 50 }, baseEmissions);
    expect(result.transportation).toBeLessThan(baseEmissions.transportation);
  });

  it('reduces energy when renewable slider is moved', () => {
    const sliders = buildSliders(makeAssessment());
    const result = applyScenario(sliders, { 'renewable-energy': 40 }, baseEmissions);
    expect(result.energy).toBeLessThan(baseEmissions.energy);
  });

  it('reduces food when beef slider is moved', () => {
    const sliders = buildSliders(makeAssessment());
    const result = applyScenario(sliders, { 'reduce-beef': 2 }, baseEmissions);
    expect(result.food).toBeLessThan(baseEmissions.food);
  });

  it('never drives any category below 0', () => {
    const sliders = buildSliders(makeAssessment());
    const extremeValues: Record<string, number> = {};
    sliders.forEach(s => { extremeValues[s.id] = s.max; });
    const result = applyScenario(sliders, extremeValues, baseEmissions);
    Object.values(result).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
  });

  it('stacks multiple slider changes correctly', () => {
    const sliders = buildSliders(makeAssessment());
    const single = applyScenario(sliders, { 'reduce-car-km': 50 }, baseEmissions);
    const stacked = applyScenario(sliders, { 'reduce-car-km': 50, 'fewer-flights': 1 }, baseEmissions);
    expect(stacked.transportation).toBeLessThan(single.transportation);
  });

  it('does not mutate the original base emissions object', () => {
    const original = { ...baseEmissions };
    const sliders = buildSliders(makeAssessment());
    applyScenario(sliders, { 'reduce-car-km': 50 }, baseEmissions);
    expect(baseEmissions).toEqual(original);
  });
});

// ── sumEmissions ──────────────────────────────────────────────

describe('sumEmissions', () => {
  it('sums all 5 category values', () => {
    const result = sumEmissions(baseEmissions);
    const expected = 3800 + 1600 + 2200 + 1000 + 350;
    expect(result).toBe(expected);
  });

  it('returns 0 for all-zero emissions', () => {
    expect(sumEmissions({ transportation: 0, energy: 0, food: 0, shopping: 0, waste: 0 })).toBe(0);
  });

  it('matches the total after applying scenario reductions', () => {
    const sliders = buildSliders(makeAssessment());
    const adjusted = applyScenario(sliders, { 'reduce-car-km': 50, 'reduce-beef': 2 }, baseEmissions);
    const total = sumEmissions(adjusted);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(sumEmissions(baseEmissions));
  });
});
