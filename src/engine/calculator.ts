/**
 * CarbFoot AI — Carbon Calculation Engine
 *
 * Emission factors sourced from:
 * - EPA Emission Factors for Greenhouse Gas Inventories (2023)
 * - IPCC AR6 Working Group III
 * - IEA Global CO2 Emissions (2023)
 * - UK DEFRA Greenhouse Gas Conversion Factors (2023)
 *
 * All values in kg CO₂e per unit unless stated otherwise.
 */

import type {
  AssessmentData,
  CategoryEmissions,
  CarbonResult,
  SustainabilityLevel,
} from '@/types';

// ── Emission Factors ──────────────────────────────────────────

/** kg CO₂e per km driven */
const VEHICLE_EMISSION_FACTORS: Record<string, number> = {
  'small-car-petrol':   0.142,
  'small-car-diesel':   0.149,
  'small-car-hybrid':   0.092,
  'small-car-electric': 0.047,
  'medium-car-petrol':  0.192,
  'medium-car-diesel':  0.199,
  'medium-car-hybrid':  0.120,
  'medium-car-electric':0.053,
  'large-car-petrol':   0.242,
  'large-car-diesel':   0.249,
  'large-car-hybrid':   0.155,
  'large-car-electric': 0.058,
  'suv-petrol':         0.275,
  'suv-diesel':         0.258,
  'suv-hybrid':         0.180,
  'suv-electric':       0.072,
  'motorcycle-petrol':  0.114,
  'motorcycle-diesel':  0.114,
  'motorcycle-hybrid':  0.090,
  'motorcycle-electric':0.030,
  'none-none':          0,
};

/** kg CO₂e per km for public transport (bus average) */
const PUBLIC_TRANSPORT_FACTOR = 0.089;

/** kg CO₂e per passenger km for flights */
const SHORT_FLIGHT_FACTOR = 0.255;  // economy, <3h (incl. radiative forcing)
const LONG_FLIGHT_FACTOR  = 0.195;  // economy, >3h (incl. radiative forcing)
const SHORT_FLIGHT_AVG_KM = 800;
const LONG_FLIGHT_AVG_KM  = 5500;

/** kg CO₂e per kWh of grid electricity (global average) */
const GRID_ELECTRICITY_FACTOR = 0.462;

/** kg CO₂e per m³ of natural gas */
const NATURAL_GAS_FACTOR = 2.04;

/** kg CO₂e per person per year by diet type */
const DIET_EMISSION_FACTORS: Record<string, number> = {
  'vegan':       1500,
  'vegetarian':  1700,
  'pescatarian': 1900,
  'flexitarian': 2200,
  'omnivore':    2800,
  'heavy-meat':  3900,
};

/** Additional kg CO₂e per beef meal */
const BEEF_MEAL_EXTRA_KG = 6.0;

/** Food waste multipliers */
const FOOD_WASTE_MULTIPLIERS: Record<string, number> = {
  'minimal':  1.00,
  'moderate': 1.10,
  'high':     1.20,
};

/** kg CO₂e per online order (packaging + delivery) */
const ONLINE_ORDER_FACTOR = 0.3;

/** kg CO₂e per fast fashion item */
const FAST_FASHION_FACTOR = 10.0;

/** kg CO₂e per new electronics unit (amortized) */
const ELECTRONICS_FACTOR = 80.0;

/** kg CO₂e per piece of new furniture */
const FURNITURE_FACTOR = 50.0;

/** Recycling reduction factors on waste emissions */
const RECYCLING_REDUCTION: Record<string, number> = {
  'none':  1.00,
  'some':  0.85,
  'most':  0.65,
  'all':   0.50,
};

/** Base waste emissions per person per year (kg CO₂e) */
const BASE_WASTE_EMISSIONS = 350;

/** Plastic bag emission factor kg CO₂e each */
const PLASTIC_BAG_FACTOR = 0.033;

/** Single use plastic level multipliers */
const SINGLE_USE_PLASTIC_MULTIPLIERS: Record<string, number> = {
  'high':    1.20,
  'moderate':1.08,
  'low':     1.00,
  'minimal': 0.90,
};

/** Global average footprint (kg CO₂e/year) for percentile calc */
const GLOBAL_AVERAGE_FOOTPRINT = 4600;
const GLOBAL_HIGH_FOOTPRINT    = 16000;
const GLOBAL_LOW_FOOTPRINT     = 1200;

// ── Category Calculators ──────────────────────────────────────

export function calculateTransportationEmissions(
  data: AssessmentData['transportation']
): number {
  const key = `${data.vehicleType}-${data.fuelType}`;
  const factor = VEHICLE_EMISSION_FACTORS[key] ?? VEHICLE_EMISSION_FACTORS['medium-car-petrol'];

  // Annual driving: commute only on non-public-transport days
  const drivingDaysPerWeek = Math.max(0, 5 - data.publicTransportDays);
  const annualDrivingKm = data.commuteDistance * drivingDaysPerWeek * 52 * 2; // round trip
  const drivingEmissions = annualDrivingKm * factor;

  // Public transport
  const publicTransportDailyKm = data.commuteDistance; // assume same route
  const annualPublicKm = publicTransportDailyKm * data.publicTransportDays * 52 * 2;
  const publicTransportEmissions = annualPublicKm * PUBLIC_TRANSPORT_FACTOR;

  // Flights
  const shortFlightEmissions = data.shortFlightsPerYear * SHORT_FLIGHT_AVG_KM * SHORT_FLIGHT_FACTOR;
  const longFlightEmissions  = data.longFlightsPerYear  * LONG_FLIGHT_AVG_KM  * LONG_FLIGHT_FACTOR;

  return Math.round(drivingEmissions + publicTransportEmissions + shortFlightEmissions + longFlightEmissions);
}

export function calculateEnergyEmissions(
  data: AssessmentData['energy']
): number {
  // Renewable percentage reduces effective grid factor
  const effectiveFactor = GRID_ELECTRICITY_FACTOR * (1 - data.renewablePercentage / 100);
  const annualKwh = data.monthlyElectricityKwh * 12;
  const electricityEmissions = annualKwh * effectiveFactor;

  // Natural gas (if applicable)
  const gasEmissions = data.hasGasHeating
    ? data.naturalGasMonthlyM3 * 12 * NATURAL_GAS_FACTOR
    : 0;

  // Divide by household size to get per-person share
  const total = (electricityEmissions + gasEmissions) / Math.max(1, data.householdSize);
  return Math.round(total);
}

export function calculateFoodEmissions(
  data: AssessmentData['food']
): number {
  const baseDiet = DIET_EMISSION_FACTORS[data.dietType] ?? 2800;
  const beefExtra = data.beefMealsPerWeek * BEEF_MEAL_EXTRA_KG * 52;
  const wasteMultiplier = FOOD_WASTE_MULTIPLIERS[data.foodWasteLevel] ?? 1.0;
  const localReduction = 1 - (data.localFoodPercentage / 100) * 0.05; // max 5% reduction from local

  return Math.round((baseDiet + beefExtra) * wasteMultiplier * localReduction);
}

export function calculateShoppingEmissions(
  data: AssessmentData['shopping']
): number {
  const onlineOrders   = data.onlineOrdersPerMonth * 12 * ONLINE_ORDER_FACTOR;
  const fastFashion    = data.fastFashionItemsPerMonth * 12 * FAST_FASHION_FACTOR;
  const electronics    = data.electronicsPerYear * ELECTRONICS_FACTOR;
  const furniture      = data.newFurniturePerYear * FURNITURE_FACTOR;

  return Math.round(onlineOrders + fastFashion + electronics + furniture);
}

export function calculateWasteEmissions(
  data: AssessmentData['waste']
): number {
  const recyclingFactor = RECYCLING_REDUCTION[data.recyclingHabits] ?? 1.0;
  const compostingReduction = data.composting ? 0.85 : 1.0;
  const plasticBags = data.plasticBagsPerWeek * 52 * PLASTIC_BAG_FACTOR;
  const singleUseMult = SINGLE_USE_PLASTIC_MULTIPLIERS[data.singleUsePlasticLevel] ?? 1.0;

  const baseWaste = BASE_WASTE_EMISSIONS * recyclingFactor * compostingReduction * singleUseMult;
  return Math.round(baseWaste + plasticBags);
}

// ── Eco Score ─────────────────────────────────────────────────

export function computeEcoScore(totalKgCO2e: number): number {
  // Invert and normalize: lower footprint = higher score
  const clampedTotal = Math.max(GLOBAL_LOW_FOOTPRINT, Math.min(GLOBAL_HIGH_FOOTPRINT, totalKgCO2e));
  const normalized = (GLOBAL_HIGH_FOOTPRINT - clampedTotal) / (GLOBAL_HIGH_FOOTPRINT - GLOBAL_LOW_FOOTPRINT);
  return Math.round(normalized * 100);
}

export function getSustainabilityLevel(score: number): SustainabilityLevel {
  if (score >= 85) return 'Eco Hero';
  if (score >= 70) return 'Green Champion';
  if (score >= 55) return 'Eco Conscious';
  if (score >= 40) return 'Explorer';
  if (score >= 25) return 'Beginner';
  return 'Carbon Giant';
}

export function computePercentileRank(totalKgCO2e: number): number {
  // Approximate percentile based on log-normal distribution
  const logTotal = Math.log(Math.max(1, totalKgCO2e));
  const logMean  = Math.log(GLOBAL_AVERAGE_FOOTPRINT);
  const logStd   = 0.6; // approximate std dev of log footprint
  const z = (logTotal - logMean) / logStd;
  // Convert z to percentile (0 = lowest footprint = best)
  const percentile = Math.min(99, Math.max(1, Math.round(50 + z * 34)));
  return percentile;
}

// ── Main Calculator ───────────────────────────────────────────

export function calculateCarbonFootprint(data: AssessmentData): CarbonResult {
  const byCategory: CategoryEmissions = {
    transportation: calculateTransportationEmissions(data.transportation),
    energy:         calculateEnergyEmissions(data.energy),
    food:           calculateFoodEmissions(data.food),
    shopping:       calculateShoppingEmissions(data.shopping),
    waste:          calculateWasteEmissions(data.waste),
  };

  const totalAnnualKgCO2e = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const ecoScore = computeEcoScore(totalAnnualKgCO2e);
  const sustainabilityLevel = getSustainabilityLevel(ecoScore);
  const percentileRank = computePercentileRank(totalAnnualKgCO2e);

  return {
    totalAnnualKgCO2e,
    byCategory,
    ecoScore,
    sustainabilityLevel,
    percentileRank,
  };
}
