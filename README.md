# 🌿 CarbFoot AI — Personal Carbon Intelligence

A production-ready web application that helps individuals understand, track, and reduce their carbon footprint through personalized AI-driven insights, interactive dashboards, and actionable sustainability goals.

---

## 🌍 Chosen Vertical

**Climate Technology / Sustainability**

---

## 🎯 Problem Statement

Most people have no idea what their carbon footprint actually is, let alone which of their daily habits contribute most to it. Generic sustainability advice doesn't help because everyone's lifestyle is different. CarbFoot AI bridges this gap by giving individuals a data-driven, personalized understanding of their environmental impact — and the specific, ranked actions most likely to reduce it.

---

## 🚀 Live App Structure

| Route | Description |
|---|---|
| `/` | Landing page with hero, stats, and features |
| `/assessment` | Multi-step carbon footprint wizard |
| `/dashboard` | Interactive analytics + AI recommendations |
| `/goals` | Goal setting and progress tracking |
| `/challenges` | Eco challenges, badges, leaderboard |

---

## 🏗️ Architecture Overview

```
src/
├── components/         # Reusable UI primitives
│   ├── Navigation.tsx  # Sticky nav + mobile bottom nav
│   ├── EcoScoreRing.tsx# SVG circular progress
│   ├── RecommendationCard.tsx
│   └── Toast.tsx       # Notification system
├── pages/              # Route-level views
│   ├── HomePage.tsx
│   ├── AssessmentPage.tsx
│   ├── DashboardPage.tsx
│   ├── GoalsPage.tsx
│   └── ChallengesPage.tsx
├── engine/             # Pure business logic (no React deps)
│   ├── calculator.ts   # CO₂ emission calculations
│   └── recommender.ts  # AI recommendation generation
├── context/
│   └── AppContext.tsx  # Global state (useReducer + localStorage)
├── data/
│   └── index.ts        # Badges, challenges, leaderboard simulation
├── types/
│   └── index.ts        # All TypeScript interfaces
├── utils/
│   ├── validation.ts   # Input sanitization
│   └── formatting.ts   # Display helpers
└── tests/             # Vitest unit + validation tests
```

### State Management
- **React Context + useReducer** — predictable state transitions
- **localStorage persistence** — all data stored securely client-side
- **No external state library** — zero additional dependencies

---

## 🧮 Carbon Calculation Methodology

Emission factors are sourced from authoritative public datasets:
- **EPA** Emission Factors for Greenhouse Gas Inventories (2023)
- **IPCC AR6** Working Group III
- **IEA** Global CO₂ Emissions (2023)
- **UK DEFRA** Greenhouse Gas Conversion Factors (2023)

### Categories & Approach

| Category | Method | Key Factors |
|---|---|---|
| **Transportation** | Distance × emission factor + flight radiative forcing | kg CO₂e/km by vehicle/fuel type |
| **Energy** | kWh × grid intensity × (1 - renewable %) ÷ household size | 0.462 kg CO₂e/kWh global average |
| **Food** | Diet base emissions + beef multiplier × waste × local factor | Vegan: 1,500 kg/yr; Heavy meat: 3,900 kg/yr |
| **Shopping** | Per-item emission factors by category | Fast fashion: 10 kg/item; Electronics: 80 kg/unit |
| **Waste** | Base × recycling factor × composting × single-use multiplier | Base: 350 kg/yr per person |

All results in **kg CO₂e per year** (CO₂ equivalent including methane and other GHGs).

---

## 🤖 Recommendation Engine Logic

1. **Filter**: Remove recommendations irrelevant to the user's lifestyle (e.g., no EV suggestion for EV drivers)
2. **Estimate**: Calculate potential savings per recommendation as a % of relevant category emissions
3. **Score**: `priority = impact_weight × 2 + effort_score + (savings / 500)`
4. **Rank**: Sort by priority score (descending)
5. **Return**: Top N recommendations

Impact weights: High=3, Medium=2, Low=1  
Effort scores: Easy=3, Moderate=2, Hard=1

This ensures high-impact, easy-wins appear first.

---

## 🎯 Goal Tracking Mechanism

1. User creates a goal with: title, category, reduction target (%), and deadline
2. System calculates `targetKgCO2e = categoryEmissions × (target% / 100)`
3. User manually logs weekly progress (10%, 25%, or complete)
4. Completion triggers badge check and celebration toast
5. All progress persisted in localStorage

---

## 📊 Eco-Score Computation

```
score = round(((HIGH_FOOTPRINT - userFootprint) / (HIGH_FOOTPRINT - LOW_FOOTPRINT)) × 100)
```

- `HIGH_FOOTPRINT` = 16,000 kg CO₂e/year
- `LOW_FOOTPRINT` = 1,200 kg CO₂e/year
- Score clamped to 0–100

Sustainability levels:
| Score | Level |
|---|---|
| 85–100 | 🌍 Eco Hero |
| 70–84 | 🌲 Green Champion |
| 55–69 | 🍀 Eco Conscious |
| 40–54 | 🌿 Explorer |
| 25–39 | 🌱 Beginner |
| 0–24 | 💨 Carbon Giant |

---

## 🔄 How the Solution Works (User Flow)

```
1. User lands on Home page
      ↓
2. Clicks "Start Assessment"
      ↓
3. Completes 5-step wizard:
   Transportation → Energy → Food → Shopping → Waste
      ↓
4. System calculates total annual CO₂e footprint
      ↓
5. AI analyzes category breakdown + user answers
      ↓
6. Dashboard renders:
   - Eco Score ring
   - Donut breakdown chart
   - Monthly trend line chart
   - Category vs. global average bar chart
   - Ranked AI recommendations
      ↓
7. User sets reduction Goals
      ↓
8. User accepts Eco Challenges and earns Badges
      ↓
9. Progress tracked weekly; achievements unlocked
```

---

## 📐 Assumptions Made

- Emission factors represent **global averages** as reported by EPA/IPCC/IEA/DEFRA 2023
- Commute is assumed to be a daily **round trip** on working days
- Public transport replaces car commuting on selected days
- Flight emissions include the **radiative forcing multiplier** (×1.9 for high-altitude warming)
- Electricity grid intensity: **0.462 kg CO₂e/kWh** (global average; varies significantly by country)
- Estimates provide **directional guidance**, not legally precise measurements
- User-reported data is assumed accurate
- All data remains **local to the user's browser** — no server, no tracking

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
```bash
npm run test
npm run test:coverage
```

| Test File | Coverage |
|---|---|
| `calculator.test.ts` | All 5 category calculators, eco score, sustainability levels, percentile, integration |
| `recommender.test.ts` | Relevance filtering, ranking, field validation, edge cases |
| `validation.test.ts` | safeNumber, safeString, all validators, full sanitization, edge cases |

### Key Test Cases
- **Zero inputs**: All calculators gracefully return 0 for empty lifestyle
- **Maximum inputs**: High-consumption scenarios compute without overflow
- **Invalid types**: Strings, null, undefined, NaN all handled via safeNumber/safeString
- **Eco champion** lifestyle scores >70 eco score
- **High consumption** lifestyle scores <30 eco score
- **Relevance filtering**: EV users don't see EV recommendation; vegans don't see beef advice
- **Recommendation ranking**: High-impact recommendations always precede low-impact ones

---

## ♿ Accessibility Considerations

- **WCAG 2.1 AA compliant** color contrast ratios throughout
- **ARIA labels** on all interactive elements, charts, and progress bars
- **role attributes**: `navigation`, `main`, `alert`, `progressbar`, `tablist`, `tab`, `tabpanel`, `dialog`, `log`
- **aria-live** on toast notifications for screen reader announcements
- **aria-current="page"** on active navigation link
- **Focus management**: All interactive elements keyboard-reachable
- **:focus-visible** styles for keyboard navigation (no outline suppression)
- **Skip to main content** link for keyboard users
- **Screen-reader-only** `.sr-only` class for visually-hidden labels
- **Semantic HTML**: `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`, `<h1>`–`<h3>` hierarchy
- **Mobile-first** responsive design with bottom navigation on small screens

---

## 🔒 Security Considerations

- **Input sanitization**: Every user value passes through `safeNumber()` / `safeString()` before use
- **Range clamping**: All numeric inputs are bounded to realistic ranges (e.g., commute 0–500 km)
- **No `dangerouslySetInnerHTML`**: All user data rendered as text, never injected as HTML
- **No eval/Function constructor**: Only static calculations
- **localStorage only**: No data ever transmitted to any server
- **JSON.parse error handling**: Corrupted storage is caught silently and falls back to defaults
- **Form `noValidate` with manual validation**: Prevents browser inconsistencies while retaining full JS control
- **Error boundaries**: Graceful fallback for rendering failures

---

## ⚡ Performance Optimizations

- **Lazy loading**: All 5 pages loaded on-demand via `React.lazy` + `Suspense`
- **Code splitting**: Vite automatically splits chart libraries from core bundle
- **`useMemo`**: Recommendations recalculated only when assessment data changes
- **`useCallback`**: Action creators memoized to prevent unnecessary re-renders
- **CSS custom properties**: Theme switching without JS recalculation
- **No unnecessary state**: Charts receive pre-computed data, not raw assessment
- **localStorage batching**: State serialized once per state change, not on every render

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router v6 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Styling | Vanilla CSS (custom properties design system) |
| State | React Context + useReducer |
| Storage | localStorage |
| Testing | Vitest + @testing-library/react |
| Fonts | Google Fonts (Inter + Syne) |

---

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📊 Data Attribution

Emission factors used in this application are sourced from:
- [EPA Emission Factors for GHG Inventories (2023)](https://www.epa.gov/climateleadership/ghg-emission-factors-hub)
- [IPCC AR6 Working Group III (2022)](https://www.ipcc.ch/report/ar6/wg3/)
- [IEA CO₂ Emissions in 2023](https://www.iea.org/)
- [UK DEFRA Conversion Factors (2023)](https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting)

Estimates are directional guidance for individual awareness, not legally precise measurements.

---

*Built with 🌿 for a more sustainable future.*
