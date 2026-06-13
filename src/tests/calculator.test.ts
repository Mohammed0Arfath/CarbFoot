/**
 * Unit Tests — Carbon Calculation Engine
 *
 * Tests cover:
 * - All 5 emission categories
 * - Edge cases: zero values, maximum values, invalid inputs
 * - Eco score computation
 * - Sustainability level assignment
 * - Percentile ranking
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTransportationEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateShoppingEmissions,
  calculateWasteEmissions,
  computeEcoScore,
  getSustainabilityLevel,
  computePercentileRank,
  calculateCarbonFootprint,
} from '@/engine/calculator';
import type { AssessmentData } from '@/types';

// ── Shared Fixtures ───────────────────────────────────────────

const baseTransport = {
  commuteDistance: 20,
  vehicleType: 'medium-car' as const,
  fuelType: 'petrol' as const,
  publicTransportDays: 0,
  shortFlightsPerYear: 0,
  longFlightsPerYear: 0,
};

const baseEnergy = {
  monthlyElectricityKwh: 300,
  renewablePercentage: 0,
  householdSize: 2,
  hasGasHeating: false,
  naturalGasMonthlyM3: 0,
};

const baseFood = {
  dietType: 'omnivore' as const,
  beefMealsPerWeek: 3,
  foodWasteLevel: 'moderate' as const,
  localFoodPercentage: 20,
};

const baseShopping = {
  onlineOrdersPerMonth: 5,
  fastFashionItemsPerMonth: 2,
  electronicsPerYear: 1,
  newFurniturePerYear: 0,
};

const baseWaste = {
  recyclingHabits: 'some' as const,
  composting: false,
  plasticBagsPerWeek: 3,
  singleUsePlasticLevel: 'moderate' as const,
};

const fullAssessment: AssessmentData = {
  transportation: baseTransport,
  energy: baseEnergy,
  food: baseFood,
  shopping: baseShopping,
  waste: baseWaste,
  completedAt: '2024-01-01T00:00:00.000Z',
};

// ── Transportation Tests ──────────────────────────────────────

describe('calculateTransportationEmissions', () => {
  it('calculates positive emissions for a typical commuter', () => {
    const result = calculateTransportationEmissions(baseTransport);
    expect(result).toBeGreaterThan(0);
  });

  it('returns zero emissions for no vehicle and no flights', () => {
    const result = calculateTransportationEmissions({
      commuteDistance: 0,
      vehicleType: 'none',
      fuelType: 'none',
      publicTransportDays: 0,
      shortFlightsPerYear: 0,
      longFlightsPerYear: 0,
    });
    expect(result).toBe(0);
  });

  it('EV emits less than petrol for same commute', () => {
    const petrol = calculateTransportationEmissions({ ...baseTransport, fuelType: 'petrol' });
    const electric = calculateTransportationEmissions({ ...baseTransport, fuelType: 'electric' });
    expect(electric).toBeLessThan(petrol);
  });

  it('public transport reduces car emissions', () => {
    const noPT = calculateTransportationEmissions({ ...baseTransport, publicTransportDays: 0 });
    const withPT = calculateTransportationEmissions({ ...baseTransport, publicTransportDays: 3 });
    expect(withPT).toBeLessThan(noPT);
  });

  it('long-haul flights add more than short flights', () => {
    const shortOnly = calculateTransportationEmissions({ ...baseTransport, shortFlightsPerYear: 4, longFlightsPerYear: 0 });
    const longOnly  = calculateTransportationEmissions({ ...baseTransport, shortFlightsPerYear: 0, longFlightsPerYear: 4 });
    expect(longOnly).toBeGreaterThan(shortOnly);
  });

  it('SUV emits more than small car', () => {
    const small = calculateTransportationEmissions({ ...baseTransport, vehicleType: 'small-car' });
    const suv   = calculateTransportationEmissions({ ...baseTransport, vehicleType: 'suv' });
    expect(suv).toBeGreaterThan(small);
  });

  it('returns integer result', () => {
    const result = calculateTransportationEmissions(baseTransport);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('handles maximum commute distance', () => {
    const result = calculateTransportationEmissions({ ...baseTransport, commuteDistance: 500 });
    expect(result).toBeGreaterThan(0);
    expect(isFinite(result)).toBe(true);
  });
});

// ── Energy Tests ──────────────────────────────────────────────

describe('calculateEnergyEmissions', () => {
  it('calculates positive energy emissions for standard household', () => {
    const result = calculateEnergyEmissions(baseEnergy);
    expect(result).toBeGreaterThan(0);
  });

  it('100% renewable electricity drastically reduces emissions', () => {
    const noRenewable  = calculateEnergyEmissions({ ...baseEnergy, renewablePercentage: 0 });
    const allRenewable = calculateEnergyEmissions({ ...baseEnergy, renewablePercentage: 100 });
    expect(allRenewable).toBeLessThan(noRenewable * 0.5);
  });

  it('gas heating adds to energy emissions', () => {
    const noGas  = calculateEnergyEmissions({ ...baseEnergy, hasGasHeating: false });
    const withGas = calculateEnergyEmissions({ ...baseEnergy, hasGasHeating: true, naturalGasMonthlyM3: 50 });
    expect(withGas).toBeGreaterThan(noGas);
  });

  it('larger household shares emissions per person (lower per capita)', () => {
    const solo  = calculateEnergyEmissions({ ...baseEnergy, householdSize: 1 });
    const large = calculateEnergyEmissions({ ...baseEnergy, householdSize: 6 });
    expect(large).toBeLessThan(solo);
  });

  it('zero electricity usage returns near-zero emissions', () => {
    const result = calculateEnergyEmissions({
      ...baseEnergy,
      monthlyElectricityKwh: 0,
      hasGasHeating: false,
    });
    expect(result).toBe(0);
  });
});

// ── Food Tests ────────────────────────────────────────────────

describe('calculateFoodEmissions', () => {
  it('vegan diet emits less than heavy-meat diet', () => {
    const vegan     = calculateFoodEmissions({ ...baseFood, dietType: 'vegan',      beefMealsPerWeek: 0 });
    const heavyMeat = calculateFoodEmissions({ ...baseFood, dietType: 'heavy-meat', beefMealsPerWeek: 14 });
    expect(heavyMeat).toBeGreaterThan(vegan * 1.5);
  });

  it('more beef meals increase emissions', () => {
    const noBeef  = calculateFoodEmissions({ ...baseFood, beefMealsPerWeek: 0 });
    const lots    = calculateFoodEmissions({ ...baseFood, beefMealsPerWeek: 10 });
    expect(lots).toBeGreaterThan(noBeef);
  });

  it('high food waste increases emissions', () => {
    const minimal = calculateFoodEmissions({ ...baseFood, foodWasteLevel: 'minimal' });
    const high    = calculateFoodEmissions({ ...baseFood, foodWasteLevel: 'high' });
    expect(high).toBeGreaterThan(minimal);
  });

  it('local food percentage reduces emissions slightly', () => {
    const imported = calculateFoodEmissions({ ...baseFood, localFoodPercentage: 0 });
    const local    = calculateFoodEmissions({ ...baseFood, localFoodPercentage: 100 });
    expect(local).toBeLessThan(imported);
  });
});

// ── Shopping Tests ────────────────────────────────────────────

describe('calculateShoppingEmissions', () => {
  it('returns positive emissions for typical shopper', () => {
    const result = calculateShoppingEmissions(baseShopping);
    expect(result).toBeGreaterThan(0);
  });

  it('zero shopping returns zero emissions', () => {
    const result = calculateShoppingEmissions({
      onlineOrdersPerMonth: 0,
      fastFashionItemsPerMonth: 0,
      electronicsPerYear: 0,
      newFurniturePerYear: 0,
    });
    expect(result).toBe(0);
  });

  it('more fast fashion items increase emissions', () => {
    const low  = calculateShoppingEmissions({ ...baseShopping, fastFashionItemsPerMonth: 0 });
    const high = calculateShoppingEmissions({ ...baseShopping, fastFashionItemsPerMonth: 20 });
    expect(high).toBeGreaterThan(low);
  });

  it('new electronics add significant emissions', () => {
    const noElec = calculateShoppingEmissions({ ...baseShopping, electronicsPerYear: 0 });
    const many   = calculateShoppingEmissions({ ...baseShopping, electronicsPerYear: 5 });
    expect(many).toBeGreaterThan(noElec);
  });
});

// ── Waste Tests ───────────────────────────────────────────────

describe('calculateWasteEmissions', () => {
  it('full recycling reduces emissions vs no recycling', () => {
    const none = calculateWasteEmissions({ ...baseWaste, recyclingHabits: 'none' });
    const all  = calculateWasteEmissions({ ...baseWaste, recyclingHabits: 'all' });
    expect(all).toBeLessThan(none);
  });

  it('composting reduces emissions', () => {
    const noCompost   = calculateWasteEmissions({ ...baseWaste, composting: false });
    const withCompost = calculateWasteEmissions({ ...baseWaste, composting: true });
    expect(withCompost).toBeLessThan(noCompost);
  });

  it('more plastic bags increases emissions', () => {
    const few  = calculateWasteEmissions({ ...baseWaste, plasticBagsPerWeek: 0 });
    const many = calculateWasteEmissions({ ...baseWaste, plasticBagsPerWeek: 50 });
    expect(many).toBeGreaterThan(few);
  });

  it('minimal single-use plastic reduces emissions', () => {
    const high    = calculateWasteEmissions({ ...baseWaste, singleUsePlasticLevel: 'high' });
    const minimal = calculateWasteEmissions({ ...baseWaste, singleUsePlasticLevel: 'minimal' });
    expect(minimal).toBeLessThan(high);
  });
});

// ── Eco Score Tests ───────────────────────────────────────────

describe('computeEcoScore', () => {
  it('returns 0–100 range', () => {
    const low  = computeEcoScore(50000);
    const high = computeEcoScore(500);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(100);
  });

  it('higher footprint = lower score', () => {
    const highFootprint = computeEcoScore(15000);
    const lowFootprint  = computeEcoScore(2000);
    expect(lowFootprint).toBeGreaterThan(highFootprint);
  });

  it('returns integer', () => {
    expect(Number.isInteger(computeEcoScore(5000))).toBe(true);
  });

  it('very low footprint scores near 100', () => {
    expect(computeEcoScore(1200)).toBeGreaterThanOrEqual(95);
  });

  it('very high footprint scores near 0', () => {
    expect(computeEcoScore(16000)).toBeLessThanOrEqual(5);
  });
});

// ── Sustainability Level Tests ────────────────────────────────

describe('getSustainabilityLevel', () => {
  it('score 90+ returns Eco Hero', () => {
    expect(getSustainabilityLevel(90)).toBe('Eco Hero');
  });
  it('score 72 returns Green Champion', () => {
    expect(getSustainabilityLevel(72)).toBe('Green Champion');
  });
  it('score 57 returns Eco Conscious', () => {
    expect(getSustainabilityLevel(57)).toBe('Eco Conscious');
  });
  it('score 42 returns Explorer', () => {
    expect(getSustainabilityLevel(42)).toBe('Explorer');
  });
  it('score 26 returns Beginner', () => {
    expect(getSustainabilityLevel(26)).toBe('Beginner');
  });
  it('score 10 returns Carbon Giant', () => {
    expect(getSustainabilityLevel(10)).toBe('Carbon Giant');
  });
});

// ── Percentile Tests ──────────────────────────────────────────

describe('computePercentileRank', () => {
  it('returns a value between 1 and 99', () => {
    const result = computePercentileRank(5000);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(99);
  });

  it('very low footprint = low percentile (better than most)', () => {
    const lowRank  = computePercentileRank(1500);
    const highRank = computePercentileRank(12000);
    expect(lowRank).toBeLessThan(highRank);
  });
});

// ── Full Calculator Integration ───────────────────────────────

describe('calculateCarbonFootprint (integration)', () => {
  it('returns all required fields', () => {
    const result = calculateCarbonFootprint(fullAssessment);
    expect(result).toHaveProperty('totalAnnualKgCO2e');
    expect(result).toHaveProperty('byCategory');
    expect(result).toHaveProperty('ecoScore');
    expect(result).toHaveProperty('sustainabilityLevel');
    expect(result).toHaveProperty('percentileRank');
  });

  it('total equals sum of categories', () => {
    const result = calculateCarbonFootprint(fullAssessment);
    const sum = Object.values(result.byCategory).reduce((a, b) => a + b, 0);
    expect(result.totalAnnualKgCO2e).toBe(sum);
  });

  it('eco score is between 0 and 100', () => {
    const result = calculateCarbonFootprint(fullAssessment);
    expect(result.ecoScore).toBeGreaterThanOrEqual(0);
    expect(result.ecoScore).toBeLessThanOrEqual(100);
  });

  it('eco champion lifestyle scores very high', () => {
    const heroAssessment: AssessmentData = {
      transportation: { commuteDistance: 5, vehicleType: 'none', fuelType: 'none', publicTransportDays: 5, shortFlightsPerYear: 0, longFlightsPerYear: 0 },
      energy:         { monthlyElectricityKwh: 100, renewablePercentage: 100, householdSize: 2, hasGasHeating: false, naturalGasMonthlyM3: 0 },
      food:           { dietType: 'vegan', beefMealsPerWeek: 0, foodWasteLevel: 'minimal', localFoodPercentage: 80 },
      shopping:       { onlineOrdersPerMonth: 1, fastFashionItemsPerMonth: 0, electronicsPerYear: 0, newFurniturePerYear: 0 },
      waste:          { recyclingHabits: 'all', composting: true, plasticBagsPerWeek: 0, singleUsePlasticLevel: 'minimal' },
      completedAt:    '2024-01-01T00:00:00.000Z',
    };
    const result = calculateCarbonFootprint(heroAssessment);
    expect(result.ecoScore).toBeGreaterThan(70);
  });

  it('high consumption lifestyle scores low', () => {
    const heavyAssessment: AssessmentData = {
      transportation: { commuteDistance: 100, vehicleType: 'suv', fuelType: 'petrol', publicTransportDays: 0, shortFlightsPerYear: 10, longFlightsPerYear: 5 },
      energy:         { monthlyElectricityKwh: 2000, renewablePercentage: 0, householdSize: 1, hasGasHeating: true, naturalGasMonthlyM3: 200 },
      food:           { dietType: 'heavy-meat', beefMealsPerWeek: 14, foodWasteLevel: 'high', localFoodPercentage: 0 },
      shopping:       { onlineOrdersPerMonth: 50, fastFashionItemsPerMonth: 20, electronicsPerYear: 10, newFurniturePerYear: 5 },
      waste:          { recyclingHabits: 'none', composting: false, plasticBagsPerWeek: 30, singleUsePlasticLevel: 'high' },
      completedAt:    '2024-01-01T00:00:00.000Z',
    };
    const result = calculateCarbonFootprint(heavyAssessment);
    expect(result.ecoScore).toBeLessThan(30);
  });
});
