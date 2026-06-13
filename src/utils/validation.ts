/**
 * CarbFoot AI — Input Validation & Sanitization
 * All user inputs are validated and clamped to safe ranges.
 */

import type {
  AssessmentData,
  TransportationData,
  EnergyData,
  FoodData,
  ShoppingData,
  WasteData,
} from '@/types';

// ── Safe number parsing ───────────────────────────────────────

export function safeNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  if (!isFinite(n) || isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}


export function safeString<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  if (allowed.includes(value as T)) return value as T;
  return fallback;
}

// ── Transportation Validation ─────────────────────────────────

export function validateTransportation(data: Partial<TransportationData>): TransportationData {
  return {
    commuteDistance: safeNumber(data.commuteDistance, 0, 500, 20),
    vehicleType: safeString(
      data.vehicleType,
      ['none', 'small-car', 'medium-car', 'large-car', 'suv', 'motorcycle'],
      'medium-car'
    ),
    fuelType: safeString(
      data.fuelType,
      ['petrol', 'diesel', 'electric', 'hybrid', 'none'],
      'petrol'
    ),
    publicTransportDays: safeNumber(data.publicTransportDays, 0, 7, 0),
    shortFlightsPerYear: safeNumber(data.shortFlightsPerYear, 0, 100, 2),
    longFlightsPerYear: safeNumber(data.longFlightsPerYear, 0, 50, 0),
  };
}

// ── Energy Validation ─────────────────────────────────────────

export function validateEnergy(data: Partial<EnergyData>): EnergyData {
  return {
    monthlyElectricityKwh: safeNumber(data.monthlyElectricityKwh, 0, 5000, 300),
    renewablePercentage: safeNumber(data.renewablePercentage, 0, 100, 0),
    householdSize: safeNumber(data.householdSize, 1, 20, 2),
    hasGasHeating: Boolean(data.hasGasHeating),
    naturalGasMonthlyM3: safeNumber(data.naturalGasMonthlyM3, 0, 1000, 50),
  };
}

// ── Food Validation ───────────────────────────────────────────

export function validateFood(data: Partial<FoodData>): FoodData {
  return {
    dietType: safeString(
      data.dietType,
      ['vegan', 'vegetarian', 'pescatarian', 'flexitarian', 'omnivore', 'heavy-meat'],
      'omnivore'
    ),
    beefMealsPerWeek: safeNumber(data.beefMealsPerWeek, 0, 21, 3),
    foodWasteLevel: safeString(data.foodWasteLevel, ['minimal', 'moderate', 'high'], 'moderate'),
    localFoodPercentage: safeNumber(data.localFoodPercentage, 0, 100, 20),
  };
}

// ── Shopping Validation ───────────────────────────────────────

export function validateShopping(data: Partial<ShoppingData>): ShoppingData {
  return {
    onlineOrdersPerMonth: safeNumber(data.onlineOrdersPerMonth, 0, 200, 5),
    fastFashionItemsPerMonth: safeNumber(data.fastFashionItemsPerMonth, 0, 50, 2),
    electronicsPerYear: safeNumber(data.electronicsPerYear, 0, 30, 1),
    newFurniturePerYear: safeNumber(data.newFurniturePerYear, 0, 20, 0),
  };
}

// ── Waste Validation ──────────────────────────────────────────

export function validateWaste(data: Partial<WasteData>): WasteData {
  return {
    recyclingHabits: safeString(data.recyclingHabits, ['none', 'some', 'most', 'all'], 'some'),
    composting: Boolean(data.composting),
    plasticBagsPerWeek: safeNumber(data.plasticBagsPerWeek, 0, 100, 3),
    singleUsePlasticLevel: safeString(
      data.singleUsePlasticLevel,
      ['high', 'moderate', 'low', 'minimal'],
      'moderate'
    ),
  };
}

// ── Full Assessment Sanitization ──────────────────────────────

export function sanitizeAssessmentData(data: AssessmentData): AssessmentData {
  return {
    transportation: validateTransportation(data.transportation),
    energy: validateEnergy(data.energy),
    food: validateFood(data.food),
    shopping: validateShopping(data.shopping),
    waste: validateWaste(data.waste),
    completedAt: data.completedAt || new Date().toISOString(),
  };
}

// ── Form validation helpers ───────────────────────────────────

export type ValidationError = { field: string; message: string };

export function validateNumberField(
  value: string,
  min: number,
  max: number,
  label: string
): ValidationError | null {
  const n = parseFloat(value);
  if (value === '' || isNaN(n)) return { field: label, message: `${label} is required` };
  if (n < min) return { field: label, message: `${label} must be at least ${min}` };
  if (n > max) return { field: label, message: `${label} must be at most ${max}` };
  return null;
}
