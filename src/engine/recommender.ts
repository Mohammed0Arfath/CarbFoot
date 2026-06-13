/**
 * CarbFoot AI — AI Recommendation Engine
 *
 * Analyzes a user's carbon footprint breakdown and generates
 * personalized, ranked recommendations ordered by impact × feasibility.
 */

import type {
  AssessmentData,
  CategoryEmissions,
  Recommendation,
  ImpactLevel,
} from '@/types';

// ── Recommendation Templates ──────────────────────────────────

const RECOMMENDATION_TEMPLATES: Omit<Recommendation, 'estimatedSavingKgCO2e'>[] = [
  // Transportation
  {
    id: 'switch-ev',
    title: 'Switch to an Electric Vehicle',
    description: 'Transitioning from a petrol car to an EV can cut your transport emissions by up to 70%.',
    category: 'transportation',
    impact: 'high',
    effortLevel: 'hard',
    actionItems: [
      'Research EV models in your budget',
      'Check government incentives and tax credits',
      'Install a home charging point',
      'Calculate total cost of ownership vs petrol',
    ],
  },
  {
    id: 'public-transport',
    title: 'Replace Car Trips with Public Transport',
    description: 'Taking the bus or train even 2 days a week can significantly reduce your transportation footprint.',
    category: 'transportation',
    impact: 'high',
    effortLevel: 'moderate',
    actionItems: [
      'Plan your nearest bus/train routes',
      'Get a monthly transit pass for savings',
      'Use a journey planner app',
      'Combine with cycling for last-mile travel',
    ],
  },
  {
    id: 'reduce-flights',
    title: 'Reduce Long-Haul Flights',
    description: 'Aviation is one of the most carbon-intensive activities. Replacing one long-haul flight with a train dramatically cuts emissions.',
    category: 'transportation',
    impact: 'high',
    effortLevel: 'moderate',
    actionItems: [
      'Consider train travel for trips under 600km',
      'Bundle multiple destinations into one trip',
      'Choose direct flights when flying is necessary',
      'Explore staycation alternatives',
    ],
  },
  {
    id: 'cycle-commute',
    title: 'Cycle or Walk for Short Commutes',
    description: 'Zero-emission commuting improves health and eliminates transport emissions for short journeys.',
    category: 'transportation',
    impact: 'medium',
    effortLevel: 'easy',
    actionItems: [
      'Get a bike or e-bike for commuting',
      'Plan a safe cycling route',
      'Join a bike-sharing scheme',
      'Walk trips under 2km instead of driving',
    ],
  },
  {
    id: 'carpooling',
    title: 'Start Carpooling',
    description: 'Sharing rides with colleagues or neighbours halves your per-person transport emissions.',
    category: 'transportation',
    impact: 'medium',
    effortLevel: 'easy',
    actionItems: [
      'Use a carpooling app or workplace scheme',
      'Coordinate with nearby colleagues',
      'Share school run duties',
    ],
  },

  // Energy
  {
    id: 'switch-renewable',
    title: 'Switch to 100% Renewable Energy',
    description: 'Choosing a green energy tariff or installing solar panels can eliminate electricity emissions.',
    category: 'energy',
    impact: 'high',
    effortLevel: 'easy',
    actionItems: [
      'Compare green energy tariffs online',
      'Request renewable energy from your provider',
      'Explore solar panel installation',
      'Consider community energy schemes',
    ],
  },
  {
    id: 'home-insulation',
    title: 'Improve Home Insulation',
    description: 'Better insulation reduces heating needs, cutting energy bills and emissions by up to 25%.',
    category: 'energy',
    impact: 'high',
    effortLevel: 'hard',
    actionItems: [
      'Get a home energy assessment',
      'Insulate loft and cavity walls',
      'Install double or triple glazing',
      'Seal draughts around doors and windows',
    ],
  },
  {
    id: 'led-lighting',
    title: 'Switch All Lighting to LED',
    description: 'LED bulbs use 75% less energy than incandescent bulbs and last 25x longer.',
    category: 'energy',
    impact: 'low',
    effortLevel: 'easy',
    actionItems: [
      'Replace bulbs room by room as they fail',
      'Buy LED bulbs in multipacks for savings',
      'Install smart lighting controls',
      'Use natural light where possible',
    ],
  },
  {
    id: 'smart-thermostat',
    title: 'Install a Smart Thermostat',
    description: 'Smart thermostats can reduce heating and cooling energy use by 10–15%.',
    category: 'energy',
    impact: 'medium',
    effortLevel: 'easy',
    actionItems: [
      'Install a programmable or smart thermostat',
      'Set heating schedules aligned with occupancy',
      'Lower thermostat by 1°C to save ~10% on heating',
      'Use remote control to avoid heating empty rooms',
    ],
  },
  {
    id: 'standby-power',
    title: 'Eliminate Standby Power Waste',
    description: 'Devices on standby can account for 10% of home electricity. Unplugging saves energy effortlessly.',
    category: 'energy',
    impact: 'low',
    effortLevel: 'easy',
    actionItems: [
      'Use smart power strips to cut standby loads',
      'Unplug chargers when not in use',
      'Enable power-saving modes on all devices',
      'Turn off monitors and printers fully',
    ],
  },

  // Food
  {
    id: 'reduce-beef',
    title: 'Reduce Beef Consumption by 50%',
    description: 'Beef produces 20× more emissions than plant proteins. Cutting beef is the single biggest food change you can make.',
    category: 'food',
    impact: 'high',
    effortLevel: 'moderate',
    actionItems: [
      'Try "Meat-Free Monday" weekly',
      'Replace beef with chicken, fish, or legumes',
      'Explore plant-based burger alternatives',
      'Discover new vegetarian recipes you enjoy',
    ],
  },
  {
    id: 'plant-based-diet',
    title: 'Shift Toward a Plant-Rich Diet',
    description: 'A plant-based diet reduces food footprint by 50% compared to a heavy meat diet.',
    category: 'food',
    impact: 'high',
    effortLevel: 'moderate',
    actionItems: [
      'Aim for 5 plant-based meals per week',
      'Explore legumes, tofu, and tempeh as protein',
      'Join a plant-based cooking class',
      'Read The Omnivore\'s Dilemma for inspiration',
    ],
  },
  {
    id: 'reduce-food-waste',
    title: 'Cut Food Waste by 50%',
    description: 'A third of all food is wasted globally. Reducing food waste is one of the most impactful climate actions.',
    category: 'food',
    impact: 'medium',
    effortLevel: 'easy',
    actionItems: [
      'Plan weekly meals before shopping',
      'Store food properly to extend freshness',
      'Use the FIFO method (first in, first out)',
      'Learn to cook with leftovers creatively',
    ],
  },
  {
    id: 'buy-local-seasonal',
    title: 'Buy Local and Seasonal Produce',
    description: 'Locally grown, seasonal food requires less transport and refrigeration, reducing food miles.',
    category: 'food',
    impact: 'low',
    effortLevel: 'easy',
    actionItems: [
      'Shop at farmers\' markets weekly',
      'Join a Community Supported Agriculture (CSA) box',
      'Grow herbs and vegetables at home',
      'Check seasonal calendars for your region',
    ],
  },

  // Shopping
  {
    id: 'fast-fashion-boycott',
    title: 'Stop Fast Fashion Purchases',
    description: 'The fashion industry accounts for 10% of global emissions. Buying less and buying better is transformative.',
    category: 'shopping',
    impact: 'high',
    effortLevel: 'moderate',
    actionItems: [
      'Buy only what you truly need',
      'Choose quality over quantity',
      'Shop second-hand at thrift stores',
      'Repair clothes instead of replacing them',
    ],
  },
  {
    id: 'second-hand-first',
    title: 'Adopt a "Second-Hand First" Policy',
    description: 'Buying refurbished electronics and second-hand items eliminates the production emissions.',
    category: 'shopping',
    impact: 'medium',
    effortLevel: 'easy',
    actionItems: [
      'Check eBay, Vinted, or local Facebook groups first',
      'Buy refurbished electronics from certified sources',
      'Swap clothes with friends and family',
      'Rent instead of buying for occasional items',
    ],
  },
  {
    id: 'minimal-online-shopping',
    title: 'Consolidate Online Orders',
    description: 'Batching orders reduces delivery trips and packaging waste significantly.',
    category: 'shopping',
    impact: 'low',
    effortLevel: 'easy',
    actionItems: [
      'Wait to have a "full cart" before ordering',
      'Choose slower delivery to allow route optimization',
      'Shop locally when convenient',
      'Opt for minimal packaging options at checkout',
    ],
  },

  // Waste
  {
    id: 'full-recycling',
    title: 'Recycle Everything Possible',
    description: 'Comprehensive recycling reduces waste emissions by up to 50%.',
    category: 'waste',
    impact: 'medium',
    effortLevel: 'easy',
    actionItems: [
      'Learn what can be recycled in your area',
      'Set up clearly labelled recycling bins',
      'Rinse containers before recycling',
      'Find specialist recyclers for electronics and batteries',
    ],
  },
  {
    id: 'home-composting',
    title: 'Start Home Composting',
    description: 'Composting food scraps diverts organic waste from landfill, eliminating its methane emissions.',
    category: 'waste',
    impact: 'medium',
    effortLevel: 'moderate',
    actionItems: [
      'Get a compost bin or worm farm',
      'Learn what can be composted',
      'Use compost in your garden or share with neighbours',
      'Check if your council offers free composting equipment',
    ],
  },
  {
    id: 'eliminate-plastic',
    title: 'Eliminate Single-Use Plastics',
    description: 'Switching to reusables eliminates the ongoing production and disposal emissions of single-use items.',
    category: 'waste',
    impact: 'low',
    effortLevel: 'easy',
    actionItems: [
      'Carry a reusable water bottle and coffee cup',
      'Use reusable shopping bags every time',
      'Choose products with minimal or recyclable packaging',
      'Bring reusable containers for takeaway food',
    ],
  },
];

// ── Emission Saving Estimators ────────────────────────────────

function estimateSavingForRecommendation(
  id: string,
  emissions: CategoryEmissions
): number {
  const savings: Record<string, number> = {
    'switch-ev':              Math.round(emissions.transportation * 0.65),
    'public-transport':       Math.round(emissions.transportation * 0.35),
    'reduce-flights':         Math.round(emissions.transportation * 0.40),
    'cycle-commute':          Math.round(emissions.transportation * 0.20),
    'carpooling':             Math.round(emissions.transportation * 0.25),
    'switch-renewable':       Math.round(emissions.energy * 0.80),
    'home-insulation':        Math.round(emissions.energy * 0.25),
    'led-lighting':           Math.round(emissions.energy * 0.08),
    'smart-thermostat':       Math.round(emissions.energy * 0.12),
    'standby-power':          Math.round(emissions.energy * 0.06),
    'reduce-beef':            Math.round(emissions.food * 0.30),
    'plant-based-diet':       Math.round(emissions.food * 0.45),
    'reduce-food-waste':      Math.round(emissions.food * 0.10),
    'buy-local-seasonal':     Math.round(emissions.food * 0.05),
    'fast-fashion-boycott':   Math.round(emissions.shopping * 0.50),
    'second-hand-first':      Math.round(emissions.shopping * 0.30),
    'minimal-online-shopping':Math.round(emissions.shopping * 0.10),
    'full-recycling':         Math.round(emissions.waste * 0.40),
    'home-composting':        Math.round(emissions.waste * 0.25),
    'eliminate-plastic':      Math.round(emissions.waste * 0.15),
  };
  return savings[id] ?? 50;
}

// ── Relevance Filter ──────────────────────────────────────────

function isRelevant(
  id: string,
  data: AssessmentData
): boolean {
  const filters: Partial<Record<string, () => boolean>> = {
    'switch-ev':          () => data.transportation.vehicleType !== 'none' && data.transportation.fuelType !== 'electric',
    'reduce-flights':     () => data.transportation.longFlightsPerYear > 0,
    'cycle-commute':      () => data.transportation.commuteDistance <= 15,
    'switch-renewable':   () => data.energy.renewablePercentage < 80,
    'home-insulation':    () => data.energy.hasGasHeating || data.energy.monthlyElectricityKwh > 300,
    'reduce-beef':        () => data.food.beefMealsPerWeek > 1,
    'plant-based-diet':   () => ['omnivore', 'heavy-meat', 'flexitarian'].includes(data.food.dietType),
    'reduce-food-waste':  () => data.food.foodWasteLevel !== 'minimal',
    'fast-fashion-boycott': () => data.shopping.fastFashionItemsPerMonth > 1,
    'full-recycling':     () => data.waste.recyclingHabits !== 'all',
    'home-composting':    () => !data.waste.composting,
    'eliminate-plastic':  () => data.waste.singleUsePlasticLevel !== 'minimal',
  };
  return filters[id]?.() ?? true;
}

// ── Impact Score (for ranking) ────────────────────────────────

const IMPACT_SCORE: Record<ImpactLevel, number> = { high: 3, medium: 2, low: 1 };
const EFFORT_SCORE: Record<string, number> = { easy: 3, moderate: 2, hard: 1 };

function priorityScore(rec: Recommendation): number {
  return IMPACT_SCORE[rec.impact] * 2 + EFFORT_SCORE[rec.effortLevel] + rec.estimatedSavingKgCO2e / 500;
}

// ── Main Recommender ──────────────────────────────────────────

export function generateRecommendations(
  data: AssessmentData,
  emissions: CategoryEmissions,
  limit = 10
): Recommendation[] {
  return RECOMMENDATION_TEMPLATES
    .filter(template => isRelevant(template.id, data))
    .map(template => ({
      ...template,
      estimatedSavingKgCO2e: estimateSavingForRecommendation(template.id, emissions),
    }))
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, limit);
}

export function getTopRecommendationByCategory(
  recommendations: Recommendation[]
): Record<string, Recommendation | undefined> {
  const byCategory: Record<string, Recommendation | undefined> = {};
  for (const rec of recommendations) {
    if (!byCategory[rec.category]) {
      byCategory[rec.category] = rec;
    }
  }
  return byCategory;
}

export { RECOMMENDATION_TEMPLATES };
