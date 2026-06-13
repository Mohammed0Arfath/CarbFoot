/**
 * Unit Tests — Natural Language Insight Generator
 *
 * Tests cover:
 * - generateInsights: structure, count, and content
 * - Conditional insight triggers (flights, EV, renewable, beef, composting)
 * - toTreeEquivalent: CO₂ → trees
 * - toCarKmEquivalent: CO₂ → km
 */

import { describe, it, expect } from 'vitest';
import { generateInsights, toTreeEquivalent, toCarKmEquivalent } from '@/engine/insights';
import type { CarbonResult, AssessmentData } from '@/types';

// ── Fixtures ─────────────────────────────────────────────────

const makeCarbonResult = (overrides: Partial<CarbonResult> = {}): CarbonResult => ({
  totalAnnualKgCO2e: 9042,
  byCategory: {
    transportation: 3840,
    energy: 1663,
    food: 2175,
    shopping: 1014,
    waste:  350,
  },
  ecoScore: 38,
  sustainabilityLevel: 'Explorer',
  percentileRank: 75,
  ...overrides,
});

const baseAssessment: AssessmentData = {
  transportation: {
    commuteDistance: 20,
    vehicleType: 'medium-car',
    fuelType: 'petrol',
    publicTransportDays: 0,
    shortFlightsPerYear: 2,
    longFlightsPerYear: 1,
  },
  energy: {
    monthlyElectricityKwh: 300,
    renewablePercentage: 0,
    householdSize: 2,
    hasGasHeating: false,
    naturalGasMonthlyM3: 0,
  },
  food: {
    dietType: 'omnivore',
    beefMealsPerWeek: 3,
    foodWasteLevel: 'moderate',
    localFoodPercentage: 20,
  },
  shopping: {
    onlineOrdersPerMonth: 5,
    fastFashionItemsPerMonth: 2,
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
};

// ── generateInsights: structure ───────────────────────────────

describe('generateInsights — structure', () => {
  it('returns an array of insights', () => {
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns at most 6 insights', () => {
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it('always includes at least 2 insights (summary + top contributor)', () => {
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('every insight has required fields', () => {
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    result.forEach(insight => {
      expect(insight).toHaveProperty('id');
      expect(insight).toHaveProperty('headline');
      expect(insight).toHaveProperty('detail');
      expect(insight).toHaveProperty('category');
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('icon');
    });
  });

  it('all insight types are valid', () => {
    const validTypes = ['warning', 'opportunity', 'positive', 'info'];
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    result.forEach(insight => {
      expect(validTypes).toContain(insight.type);
    });
  });

  it('all insight IDs are unique', () => {
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    const ids = result.map(i => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('always generates an overall-summary insight', () => {
    const result = generateInsights(makeCarbonResult(), baseAssessment);
    const summary = result.find(i => i.id === 'overall-summary');
    expect(summary).toBeDefined();
    expect(summary?.category).toBe('overall');
  });
});

// ── generateInsights: above-average footprint ─────────────────

describe('generateInsights — above-average footprint', () => {
  const highResult = makeCarbonResult({ totalAnnualKgCO2e: 9042 });

  it('overall-summary is a warning when above global average', () => {
    const result = generateInsights(highResult, baseAssessment);
    const summary = result.find(i => i.id === 'overall-summary');
    expect(summary?.type).toBe('warning');
  });

  it('summary headline includes the tonnage figure', () => {
    const result = generateInsights(highResult, baseAssessment);
    const summary = result.find(i => i.id === 'overall-summary');
    expect(summary?.headline).toContain('t CO₂e/year');
  });

  it('includes a paris-gap insight when above 2t target', () => {
    const result = generateInsights(highResult, baseAssessment);
    const gap = result.find(i => i.id === 'paris-gap');
    expect(gap).toBeDefined();
    expect(gap?.type).toBe('info');
  });
});

// ── generateInsights: below-average footprint ─────────────────

describe('generateInsights — below-average footprint (eco hero)', () => {
  const heroResult = makeCarbonResult({
    totalAnnualKgCO2e: 1800,
    byCategory: {
      transportation: 200,
      energy: 300,
      food: 900,
      shopping: 200,
      waste: 200,
    },
  });

  const heroAssessment: AssessmentData = {
    ...baseAssessment,
    transportation: { ...baseAssessment.transportation, fuelType: 'electric', commuteDistance: 5 },
    energy: { ...baseAssessment.energy, renewablePercentage: 100 },
    food: { ...baseAssessment.food, dietType: 'vegan', beefMealsPerWeek: 0 },
    waste: { ...baseAssessment.waste, composting: true },
  };

  it('overall-summary is positive when below global average', () => {
    const result = generateInsights(heroResult, heroAssessment);
    const summary = result.find(i => i.id === 'overall-summary');
    expect(summary?.type).toBe('positive');
  });

  it('does NOT include paris-gap insight when below 2t target', () => {
    const result = generateInsights(heroResult, heroAssessment);
    const gap = result.find(i => i.id === 'paris-gap');
    expect(gap).toBeUndefined();
  });

  it('includes composting-positive insight for composters', () => {
    const result = generateInsights(heroResult, heroAssessment);
    const composting = result.find(i => i.id === 'composting-positive');
    expect(composting).toBeDefined();
    expect(composting?.type).toBe('positive');
  });

  it('includes renewable-positive insight for high renewable %', () => {
    const result = generateInsights(heroResult, heroAssessment);
    const renewable = result.find(i => i.id === 'renewable-positive');
    expect(renewable).toBeDefined();
    expect(renewable?.type).toBe('positive');
  });
});

// ── generateInsights: conditional triggers ────────────────────

describe('generateInsights — conditional insight triggers', () => {
  it('generates flights-high for >2 long-haul flights', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      transportation: { ...baseAssessment.transportation, longFlightsPerYear: 4 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const flightInsight = result.find(i => i.id === 'flights-high');
    expect(flightInsight).toBeDefined();
    expect(flightInsight?.type).toBe('warning');
  });

  it('does NOT generate flights-high for ≤2 long-haul flights', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      transportation: { ...baseAssessment.transportation, longFlightsPerYear: 2 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const flightInsight = result.find(i => i.id === 'flights-high');
    expect(flightInsight).toBeUndefined();
  });

  it('generates ev-opportunity for petrol commuters with long commute', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      transportation: { ...baseAssessment.transportation, fuelType: 'petrol', commuteDistance: 30 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const evInsight = result.find(i => i.id === 'ev-opportunity');
    expect(evInsight).toBeDefined();
    expect(evInsight?.type).toBe('opportunity');
  });

  it('does NOT generate ev-opportunity for EV drivers', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      transportation: { ...baseAssessment.transportation, fuelType: 'electric', commuteDistance: 30 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const evInsight = result.find(i => i.id === 'ev-opportunity');
    expect(evInsight).toBeUndefined();
  });

  it('generates renewable-opportunity for low renewable high kWh users', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      energy: { ...baseAssessment.energy, renewablePercentage: 10, monthlyElectricityKwh: 400 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const renewableInsight = result.find(i => i.id === 'renewable-opportunity');
    expect(renewableInsight).toBeDefined();
  });

  it('does NOT generate renewable-opportunity when already on green energy', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      energy: { ...baseAssessment.energy, renewablePercentage: 90, monthlyElectricityKwh: 400 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const renewableInsight = result.find(i => i.id === 'renewable-opportunity');
    expect(renewableInsight).toBeUndefined();
  });

  it('generates beef-high for ≥4 beef meals per week', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      food: { ...baseAssessment.food, beefMealsPerWeek: 7 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const beefInsight = result.find(i => i.id === 'beef-high');
    expect(beefInsight).toBeDefined();
    expect(beefInsight?.type).toBe('warning');
  });

  it('does NOT generate beef-high for low beef consumption', () => {
    const data: AssessmentData = {
      ...baseAssessment,
      food: { ...baseAssessment.food, beefMealsPerWeek: 2 },
    };
    const result = generateInsights(makeCarbonResult(), data);
    const beefInsight = result.find(i => i.id === 'beef-high');
    expect(beefInsight).toBeUndefined();
  });
});

// ── toTreeEquivalent ──────────────────────────────────────────

describe('toTreeEquivalent', () => {
  it('returns correct tree count (1 tree ≈ 22 kg CO₂/year)', () => {
    expect(toTreeEquivalent(220)).toBe(10);
  });

  it('returns 0 for 0 kg', () => {
    expect(toTreeEquivalent(0)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(toTreeEquivalent(33)).toBe(2); // 33/22 ≈ 1.5 → 2
  });

  it('returns a non-negative integer', () => {
    const result = toTreeEquivalent(1000);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// ── toCarKmEquivalent ─────────────────────────────────────────

describe('toCarKmEquivalent', () => {
  it('converts kg CO₂ to car km correctly (0.192 kg/km)', () => {
    expect(toCarKmEquivalent(192)).toBe(1000);
  });

  it('returns 0 for 0 kg', () => {
    expect(toCarKmEquivalent(0)).toBe(0);
  });

  it('returns a positive integer for positive input', () => {
    const result = toCarKmEquivalent(500);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });
});
