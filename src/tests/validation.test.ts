/**
 * Unit Tests — Input Validation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  safeNumber, safeString,
  validateTransportation, validateEnergy, validateFood,
  validateShopping, validateWaste, sanitizeAssessmentData,
  validateNumberField,
} from '@/utils/validation';
import type { AssessmentData } from '@/types';

describe('safeNumber', () => {
  it('returns valid numbers as-is when in range', () => {
    expect(safeNumber(50, 0, 100, 0)).toBe(50);
  });

  it('clamps values below minimum', () => {
    expect(safeNumber(-5, 0, 100, 50)).toBe(0);
  });

  it('clamps values above maximum', () => {
    expect(safeNumber(150, 0, 100, 50)).toBe(100);
  });

  it('returns fallback for NaN', () => {
    expect(safeNumber(NaN, 0, 100, 42)).toBe(42);
  });

  it('returns fallback for string input', () => {
    expect(safeNumber('abc', 0, 100, 42)).toBe(42);
  });

  it('returns fallback for Infinity', () => {
    expect(safeNumber(Infinity, 0, 100, 42)).toBe(42);
  });

  it('returns fallback for null', () => {
    expect(safeNumber(null, 0, 100, 42)).toBe(42);
  });

  it('returns fallback for undefined', () => {
    expect(safeNumber(undefined, 0, 100, 42)).toBe(42);
  });
});

describe('safeString', () => {
  it('returns value if in allowed list', () => {
    expect(safeString('petrol', ['petrol', 'diesel', 'electric'], 'petrol')).toBe('petrol');
  });

  it('returns fallback for invalid value', () => {
    expect(safeString('nuclear', ['petrol', 'diesel', 'electric'], 'petrol')).toBe('petrol');
  });

  it('returns fallback for empty string if not in list', () => {
    expect(safeString('', ['petrol', 'diesel'], 'petrol')).toBe('petrol');
  });
});

describe('validateTransportation', () => {
  it('clamps commuteDistance to 0–500', () => {
    const result = validateTransportation({ commuteDistance: -10 });
    expect(result.commuteDistance).toBe(0);

    const result2 = validateTransportation({ commuteDistance: 9999 });
    expect(result2.commuteDistance).toBe(500);
  });

  it('defaults vehicleType to medium-car for unknown value', () => {
    const result = validateTransportation({ vehicleType: 'spaceship' as never });
    expect(result.vehicleType).toBe('medium-car');
  });

  it('clamps publicTransportDays to 0–7', () => {
    const result = validateTransportation({ publicTransportDays: 10 });
    expect(result.publicTransportDays).toBe(7);
  });

  it('applies all defaults for empty object', () => {
    const result = validateTransportation({});
    expect(result.commuteDistance).toBe(20);
    expect(result.vehicleType).toBe('medium-car');
    expect(result.fuelType).toBe('petrol');
  });
});

describe('validateEnergy', () => {
  it('defaults to 2 household members', () => {
    const result = validateEnergy({});
    expect(result.householdSize).toBe(2);
  });

  it('clamps renewablePercentage to 0–100', () => {
    const result = validateEnergy({ renewablePercentage: 150 });
    expect(result.renewablePercentage).toBe(100);
  });

  it('hasGasHeating defaults to false', () => {
    const result = validateEnergy({});
    expect(result.hasGasHeating).toBe(false);
  });
});

describe('validateFood', () => {
  it('defaults to omnivore diet', () => {
    const result = validateFood({});
    expect(result.dietType).toBe('omnivore');
  });

  it('clamps beef meals to 0–21', () => {
    const result = validateFood({ beefMealsPerWeek: 99 });
    expect(result.beefMealsPerWeek).toBe(21);
  });
});

describe('validateShopping', () => {
  it('clamps online orders to 0–200', () => {
    const result = validateShopping({ onlineOrdersPerMonth: -1 });
    expect(result.onlineOrdersPerMonth).toBe(0);
  });
});

describe('validateWaste', () => {
  it('defaults recycling habits to some', () => {
    const result = validateWaste({});
    expect(result.recyclingHabits).toBe('some');
  });

  it('composting defaults to false', () => {
    const result = validateWaste({});
    expect(result.composting).toBe(false);
  });
});

describe('sanitizeAssessmentData', () => {
  it('sanitizes all categories', () => {
    const bad: AssessmentData = {
      transportation: { commuteDistance: -999, vehicleType: 'none', fuelType: 'none', publicTransportDays: 99, shortFlightsPerYear: -5, longFlightsPerYear: 999 },
      energy: { monthlyElectricityKwh: -100, renewablePercentage: 999, householdSize: 0, hasGasHeating: false, naturalGasMonthlyM3: -1 },
      food: { dietType: 'omnivor' as never, beefMealsPerWeek: 999, foodWasteLevel: 'extreme' as never, localFoodPercentage: 999 },
      shopping: { onlineOrdersPerMonth: -1, fastFashionItemsPerMonth: -1, electronicsPerYear: -1, newFurniturePerYear: -1 },
      waste: { recyclingHabits: 'everything' as never, composting: false, plasticBagsPerWeek: -5, singleUsePlasticLevel: 'extreme' as never },
      completedAt: 'invalid-date',
    };
    const result = sanitizeAssessmentData(bad);
    // All values should be in safe ranges
    expect(result.transportation.commuteDistance).toBeGreaterThanOrEqual(0);
    expect(result.transportation.publicTransportDays).toBeLessThanOrEqual(7);
    expect(result.energy.renewablePercentage).toBeLessThanOrEqual(100);
    expect(result.energy.householdSize).toBeGreaterThanOrEqual(1);
    expect(result.food.beefMealsPerWeek).toBeLessThanOrEqual(21);
    expect(result.shopping.onlineOrdersPerMonth).toBeGreaterThanOrEqual(0);
    expect(result.waste.plasticBagsPerWeek).toBeGreaterThanOrEqual(0);
  });

  it('preserves completedAt timestamp', () => {
    const iso = '2024-06-15T12:00:00.000Z';
    const input: AssessmentData = {
      transportation: { commuteDistance: 20, vehicleType: 'medium-car', fuelType: 'petrol', publicTransportDays: 0, shortFlightsPerYear: 0, longFlightsPerYear: 0 },
      energy: { monthlyElectricityKwh: 300, renewablePercentage: 0, householdSize: 2, hasGasHeating: false, naturalGasMonthlyM3: 0 },
      food: { dietType: 'omnivore', beefMealsPerWeek: 3, foodWasteLevel: 'moderate', localFoodPercentage: 20 },
      shopping: { onlineOrdersPerMonth: 5, fastFashionItemsPerMonth: 2, electronicsPerYear: 1, newFurniturePerYear: 0 },
      waste: { recyclingHabits: 'some', composting: false, plasticBagsPerWeek: 3, singleUsePlasticLevel: 'moderate' },
      completedAt: iso,
    };
    const result = sanitizeAssessmentData(input);
    expect(result.completedAt).toBe(iso);
  });
});

describe('validateNumberField', () => {
  it('returns null for valid number', () => {
    expect(validateNumberField('50', 0, 100, 'Test')).toBeNull();
  });

  it('returns error for empty string', () => {
    const error = validateNumberField('', 0, 100, 'Distance');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('required');
  });

  it('returns error for value below minimum', () => {
    const error = validateNumberField('-5', 0, 100, 'Distance');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('at least');
  });

  it('returns error for value above maximum', () => {
    const error = validateNumberField('200', 0, 100, 'Percentage');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('at most');
  });

  it('returns error for non-numeric string', () => {
    const error = validateNumberField('abc', 0, 100, 'Distance');
    expect(error).not.toBeNull();
  });
});
