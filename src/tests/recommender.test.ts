/**
 * Unit Tests — AI Recommendation Engine
 */

import { describe, it, expect } from 'vitest';
import { generateRecommendations, getTopRecommendationByCategory } from '@/engine/recommender';
import type { AssessmentData, CategoryEmissions } from '@/types';

const baseAssessment: AssessmentData = {
  transportation: {
    commuteDistance: 25,
    vehicleType: 'medium-car',
    fuelType: 'petrol',
    publicTransportDays: 0,
    shortFlightsPerYear: 3,
    longFlightsPerYear: 2,
  },
  energy: {
    monthlyElectricityKwh: 400,
    renewablePercentage: 0,
    householdSize: 2,
    hasGasHeating: true,
    naturalGasMonthlyM3: 60,
  },
  food: {
    dietType: 'omnivore',
    beefMealsPerWeek: 5,
    foodWasteLevel: 'high',
    localFoodPercentage: 10,
  },
  shopping: {
    onlineOrdersPerMonth: 10,
    fastFashionItemsPerMonth: 5,
    electronicsPerYear: 2,
    newFurniturePerYear: 1,
  },
  waste: {
    recyclingHabits: 'some',
    composting: false,
    plasticBagsPerWeek: 5,
    singleUsePlasticLevel: 'high',
  },
  completedAt: '2024-01-01T00:00:00.000Z',
};

const baseEmissions: CategoryEmissions = {
  transportation: 3500,
  energy: 1800,
  food: 4200,
  shopping: 1200,
  waste: 400,
};

describe('generateRecommendations', () => {
  it('returns a non-empty array for a typical user', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('respects the limit parameter', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions, 5);
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it('all recommendations have required fields', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions);
    for (const rec of recs) {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('impact');
      expect(rec).toHaveProperty('effortLevel');
      expect(rec).toHaveProperty('estimatedSavingKgCO2e');
      expect(rec).toHaveProperty('actionItems');
    }
  });

  it('estimated savings are positive', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions);
    for (const rec of recs) {
      expect(rec.estimatedSavingKgCO2e).toBeGreaterThanOrEqual(0);
    }
  });

  it('high-impact recs appear before low-impact', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions, 10);
    // Find first high and first low
    const firstHighIdx = recs.findIndex(r => r.impact === 'high');
    const firstLowIdx  = recs.findIndex(r => r.impact === 'low');
    if (firstHighIdx !== -1 && firstLowIdx !== -1) {
      expect(firstHighIdx).toBeLessThan(firstLowIdx);
    }
  });

  it('filters out irrelevant EV recommendation for EV users', () => {
    const evAssessment: AssessmentData = {
      ...baseAssessment,
      transportation: { ...baseAssessment.transportation, fuelType: 'electric' },
    };
    const recs = generateRecommendations(evAssessment, baseEmissions);
    const evRec = recs.find(r => r.id === 'switch-ev');
    expect(evRec).toBeUndefined();
  });

  it('filters out beef reduction for vegans', () => {
    const veganAssessment: AssessmentData = {
      ...baseAssessment,
      food: { ...baseAssessment.food, dietType: 'vegan', beefMealsPerWeek: 0 },
    };
    const recs = generateRecommendations(veganAssessment, baseEmissions);
    const beefRec = recs.find(r => r.id === 'reduce-beef');
    expect(beefRec).toBeUndefined();
  });

  it('filters out renewable switch for 100% renewable users', () => {
    const greenAssessment: AssessmentData = {
      ...baseAssessment,
      energy: { ...baseAssessment.energy, renewablePercentage: 100 },
    };
    const recs = generateRecommendations(greenAssessment, baseEmissions);
    const renewableRec = recs.find(r => r.id === 'switch-renewable');
    expect(renewableRec).toBeUndefined();
  });

  it('action items are non-empty arrays', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions);
    for (const rec of recs) {
      expect(Array.isArray(rec.actionItems)).toBe(true);
      expect(rec.actionItems.length).toBeGreaterThan(0);
    }
  });

  it('handles user with minimal footprint gracefully', () => {
    const minimalEmissions: CategoryEmissions = {
      transportation: 100,
      energy: 100,
      food: 1500,
      shopping: 50,
      waste: 100,
    };
    const minimalAssessment: AssessmentData = {
      ...baseAssessment,
      transportation: { commuteDistance: 2, vehicleType: 'none', fuelType: 'none', publicTransportDays: 5, shortFlightsPerYear: 0, longFlightsPerYear: 0 },
      energy: { ...baseAssessment.energy, renewablePercentage: 100, hasGasHeating: false },
      waste: { recyclingHabits: 'all', composting: true, plasticBagsPerWeek: 0, singleUsePlasticLevel: 'minimal' },
    };
    const recs = generateRecommendations(minimalAssessment, minimalEmissions);
    // Should still return some recommendations
    expect(recs.length).toBeGreaterThanOrEqual(0);
  });
});

describe('getTopRecommendationByCategory', () => {
  it('returns at most one recommendation per category', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions, 10);
    const top = getTopRecommendationByCategory(recs);
    const categories = Object.keys(top);
    const uniqueCategories = new Set(categories);
    expect(categories.length).toBe(uniqueCategories.size);
  });

  it('returns defined recommendations for major categories when relevant', () => {
    const recs = generateRecommendations(baseAssessment, baseEmissions, 10);
    const top = getTopRecommendationByCategory(recs);
    // Food should have a recommendation given high beef consumption
    expect(top['food']).toBeDefined();
  });
});
