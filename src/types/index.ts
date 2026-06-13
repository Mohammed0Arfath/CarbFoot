// ============================================================
// CarbFoot AI — Core Type Definitions
// ============================================================

export type Theme = 'dark' | 'light';

export type SustainabilityLevel =
  | 'Carbon Giant'
  | 'Beginner'
  | 'Explorer'
  | 'Eco Conscious'
  | 'Green Champion'
  | 'Eco Hero';

// ── Assessment ────────────────────────────────────────────────

export interface TransportationData {
  commuteDistance: number;       // km/day
  vehicleType: 'none' | 'small-car' | 'medium-car' | 'large-car' | 'suv' | 'motorcycle';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'none';
  publicTransportDays: number;   // days/week using public transport
  shortFlightsPerYear: number;   // <3 hours
  longFlightsPerYear: number;    // >3 hours
}

export interface EnergyData {
  monthlyElectricityKwh: number;
  renewablePercentage: number;   // 0–100
  householdSize: number;
  hasGasHeating: boolean;
  naturalGasMonthlyM3: number;
}

export interface FoodData {
  dietType: 'vegan' | 'vegetarian' | 'pescatarian' | 'flexitarian' | 'omnivore' | 'heavy-meat';
  beefMealsPerWeek: number;
  foodWasteLevel: 'minimal' | 'moderate' | 'high';
  localFoodPercentage: number;   // 0–100 percent local/seasonal food
}

export interface ShoppingData {
  onlineOrdersPerMonth: number;
  fastFashionItemsPerMonth: number;
  electronicsPerYear: number;
  newFurniturePerYear: number;
}

export interface WasteData {
  recyclingHabits: 'none' | 'some' | 'most' | 'all';
  composting: boolean;
  plasticBagsPerWeek: number;
  singleUsePlasticLevel: 'high' | 'moderate' | 'low' | 'minimal';
}

export interface AssessmentData {
  transportation: TransportationData;
  energy: EnergyData;
  food: FoodData;
  shopping: ShoppingData;
  waste: WasteData;
  completedAt: string; // ISO date string
}

// ── Carbon Results ────────────────────────────────────────────

export interface CategoryEmissions {
  transportation: number;
  energy: number;
  food: number;
  shopping: number;
  waste: number;
}

export interface CarbonResult {
  totalAnnualKgCO2e: number;
  byCategory: CategoryEmissions;
  ecoScore: number;           // 0–100
  sustainabilityLevel: SustainabilityLevel;
  percentileRank: number;     // lower is better (0 = best)
}

// ── Recommendations ───────────────────────────────────────────

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: keyof CategoryEmissions;
  impact: ImpactLevel;
  estimatedSavingKgCO2e: number;
  effortLevel: 'easy' | 'moderate' | 'hard';
  actionItems: string[];
}

// ── Goals ─────────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: keyof CategoryEmissions | 'overall';
  targetReductionPercent: number;
  targetKgCO2e: number;
  currentProgress: number;   // 0–100
  createdAt: string;
  deadline: string;
  completed: boolean;
  weeklyCheckIns: WeeklyCheckIn[];
}

export interface WeeklyCheckIn {
  week: string;           // ISO week string
  progressDelta: number;  // kg CO2e saved this week
  note?: string;
}

// ── Gamification ──────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: keyof CategoryEmissions;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  durationDays: number;
  completed: boolean;
  accepted: boolean;
  icon: string;
  estimatedSavingKgCO2e: number;
}

export interface UserProfile {
  name: string;
  streak: number;
  totalPoints: number;
  level: SustainabilityLevel;
  badges: Badge[];
  completedChallenges: string[];
  acceptedChallenges: string[];
  joinedAt: string;
}

// ── App State ─────────────────────────────────────────────────

export interface AppState {
  theme: Theme;
  assessmentData: AssessmentData | null;
  carbonResult: CarbonResult | null;
  goals: Goal[];
  userProfile: UserProfile;
  monthlyHistory: MonthlyEntry[];
  hasCompletedAssessment: boolean;
}

export interface MonthlyEntry {
  month: string;   // "YYYY-MM"
  totalKgCO2e: number;
  byCategory: CategoryEmissions;
}
