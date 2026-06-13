import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import type {
  AssessmentData, TransportationData, EnergyData,
  FoodData, ShoppingData, WasteData,
} from '@/types';
import { validateNumberField } from '@/utils/validation';

// ── Default Values ────────────────────────────────────────────

const DEFAULT_TRANSPORT: TransportationData = {
  commuteDistance: 20,
  vehicleType: 'medium-car',
  fuelType: 'petrol',
  publicTransportDays: 1,
  shortFlightsPerYear: 2,
  longFlightsPerYear: 1,
};

const DEFAULT_ENERGY: EnergyData = {
  monthlyElectricityKwh: 300,
  renewablePercentage: 0,
  householdSize: 2,
  hasGasHeating: true,
  naturalGasMonthlyM3: 50,
};

const DEFAULT_FOOD: FoodData = {
  dietType: 'omnivore',
  beefMealsPerWeek: 3,
  foodWasteLevel: 'moderate',
  localFoodPercentage: 20,
};

const DEFAULT_SHOPPING: ShoppingData = {
  onlineOrdersPerMonth: 5,
  fastFashionItemsPerMonth: 2,
  electronicsPerYear: 1,
  newFurniturePerYear: 0,
};

const DEFAULT_WASTE: WasteData = {
  recyclingHabits: 'some',
  composting: false,
  plasticBagsPerWeek: 3,
  singleUsePlasticLevel: 'moderate',
};

// ── Step Config ───────────────────────────────────────────────

const STEPS = [
  { id: 'transport', label: 'Transportation', icon: '🚗', description: 'How you get around' },
  { id: 'energy',    label: 'Energy',         icon: '⚡', description: 'Home energy usage' },
  { id: 'food',      label: 'Food',           icon: '🍽️', description: 'Diet and consumption' },
  { id: 'shopping',  label: 'Shopping',       icon: '🛍️', description: 'Purchases and habits' },
  { id: 'waste',     label: 'Waste',          icon: '♻️', description: 'Recycling and waste' },
];

// ── Sub-components ────────────────────────────────────────────

function FieldGroup({
  label, hint, error, required, children, id,
}: {
  label: string; hint?: string; error?: string | null;
  required?: boolean; children: React.ReactNode; id: string;
}) {
  return (
    <div className="form-group" id={`field-${id}`}>
      <label className="form-label" htmlFor={id}>
        {label}{required && <span aria-label="required"> *</span>}
      </label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
      {error && (
        <span className="form-error" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  );
}

function NumInput({
  id, value, onChange, min, max, step = 1, unit,
}: {
  id: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        className="form-input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        aria-describedby={unit ? `${id}-unit` : undefined}
        style={{ maxWidth: 140 }}
      />
      {unit && (
        <span id={`${id}-unit`} style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          {unit}
        </span>
      )}
    </div>
  );
}

// ── Step 1: Transportation ────────────────────────────────────

function TransportStep({
  data, onChange,
}: {
  data: TransportationData;
  onChange: (d: TransportationData) => void;
}) {
  const set = <K extends keyof TransportationData>(k: K, v: TransportationData[K]) =>
    onChange({ ...data, [k]: v });
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = (field: string, value: string, min: number, max: number) => {
    const err = validateNumberField(value, min, max, field);
    setErrors(e => ({ ...e, [field]: err?.message ?? null }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <FieldGroup
        id="vehicle-type"
        label="Primary vehicle type"
        hint="Select your most-used personal vehicle"
      >
        <select
          id="vehicle-type"
          className="form-select"
          value={data.vehicleType}
          onChange={e => set('vehicleType', e.target.value as TransportationData['vehicleType'])}
          aria-label="Select your vehicle type"
        >
          <option value="none">No personal vehicle</option>
          <option value="small-car">Small car (Hatchback, City car)</option>
          <option value="medium-car">Medium car (Sedan, Estate)</option>
          <option value="large-car">Large car (Saloon, MPV)</option>
          <option value="suv">SUV / 4×4</option>
          <option value="motorcycle">Motorcycle / Scooter</option>
        </select>
      </FieldGroup>

      {data.vehicleType !== 'none' && (
        <>
          <FieldGroup id="fuel-type" label="Fuel type">
            <select
              id="fuel-type"
              className="form-select"
              value={data.fuelType}
              onChange={e => set('fuelType', e.target.value as TransportationData['fuelType'])}
            >
              <option value="petrol">Petrol / Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric (EV)</option>
            </select>
          </FieldGroup>

          <FieldGroup
            id="commute-distance"
            label="One-way commute distance"
            hint="Average distance per one-way trip"
            error={errors['commute']}
          >
            <NumInput
              id="commute-distance"
              value={data.commuteDistance}
              onChange={v => {
                set('commuteDistance', v);
                validate('commute', String(v), 0, 500);
              }}
              min={0} max={500} unit="km"
            />
          </FieldGroup>
        </>
      )}

      <FieldGroup
        id="public-transport-days"
        label="Public transport days per week"
        hint="Days you commute by bus, train, or metro"
      >
        <div>
          <input
            id="public-transport-days"
            type="range"
            className="form-range"
            min={0} max={7} step={1}
            value={data.publicTransportDays}
            onChange={e => set('publicTransportDays', parseInt(e.target.value))}
            aria-valuetext={`${data.publicTransportDays} days per week`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>0 days</span>
            <strong style={{ color: 'var(--brand-400)' }}>{data.publicTransportDays} days/week</strong>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>7 days</span>
          </div>
        </div>
      </FieldGroup>

      <div className="grid-2">
        <FieldGroup id="short-flights" label="Short flights per year" hint="Under 3 hours">
          <NumInput id="short-flights" value={data.shortFlightsPerYear}
            onChange={v => set('shortFlightsPerYear', v)} min={0} max={50} unit="flights" />
        </FieldGroup>
        <FieldGroup id="long-flights" label="Long-haul flights per year" hint="Over 3 hours">
          <NumInput id="long-flights" value={data.longFlightsPerYear}
            onChange={v => set('longFlightsPerYear', v)} min={0} max={20} unit="flights" />
        </FieldGroup>
      </div>
    </div>
  );
}

// ── Step 2: Energy ────────────────────────────────────────────

function EnergyStep({ data, onChange }: { data: EnergyData; onChange: (d: EnergyData) => void }) {
  const set = <K extends keyof EnergyData>(k: K, v: EnergyData[K]) =>
    onChange({ ...data, [k]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-2">
        <FieldGroup
          id="monthly-kwh"
          label="Monthly electricity usage"
          hint="Check your electricity bill"
        >
          <NumInput id="monthly-kwh" value={data.monthlyElectricityKwh}
            onChange={v => set('monthlyElectricityKwh', v)} min={0} max={5000} unit="kWh" />
        </FieldGroup>
        <FieldGroup
          id="household-size"
          label="Household size"
          hint="Number of people sharing your home"
        >
          <NumInput id="household-size" value={data.householdSize}
            onChange={v => set('householdSize', v)} min={1} max={20} unit="people" />
        </FieldGroup>
      </div>

      <FieldGroup
        id="renewable-pct"
        label="Renewable energy percentage"
        hint="If you have solar panels or a green tariff"
      >
        <div>
          <input
            id="renewable-pct"
            type="range"
            className="form-range"
            min={0} max={100} step={5}
            value={data.renewablePercentage}
            onChange={e => set('renewablePercentage', parseInt(e.target.value))}
            aria-valuetext={`${data.renewablePercentage}% renewable energy`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>0% (grid)</span>
            <strong style={{ color: 'var(--brand-400)' }}>{data.renewablePercentage}% renewable</strong>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>100% clean</span>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup id="gas-heating" label="Home heating type">
        <label className="toggle-wrapper">
          <span className="toggle">
            <input
              id="gas-heating"
              type="checkbox"
              checked={data.hasGasHeating}
              onChange={e => set('hasGasHeating', e.target.checked)}
              aria-describedby="gas-hint"
            />
            <span className="toggle-slider" />
          </span>
          <span id="gas-hint">I use natural gas / oil heating</span>
        </label>
      </FieldGroup>

      {data.hasGasHeating && (
        <FieldGroup
          id="gas-monthly"
          label="Monthly gas usage"
          hint="Check your gas bill or estimate"
        >
          <NumInput id="gas-monthly" value={data.naturalGasMonthlyM3}
            onChange={v => set('naturalGasMonthlyM3', v)} min={0} max={1000} unit="m³" />
        </FieldGroup>
      )}
    </div>
  );
}

// ── Step 3: Food ──────────────────────────────────────────────

function FoodStep({ data, onChange }: { data: FoodData; onChange: (d: FoodData) => void }) {
  const set = <K extends keyof FoodData>(k: K, v: FoodData[K]) =>
    onChange({ ...data, [k]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <FieldGroup id="diet-type" label="Diet preference">
        <select
          id="diet-type"
          className="form-select"
          value={data.dietType}
          onChange={e => set('dietType', e.target.value as FoodData['dietType'])}
        >
          <option value="vegan">Vegan (plant-only)</option>
          <option value="vegetarian">Vegetarian (no meat)</option>
          <option value="pescatarian">Pescatarian (fish, no meat)</option>
          <option value="flexitarian">Flexitarian (mostly plant-based)</option>
          <option value="omnivore">Omnivore (balanced meat and veg)</option>
          <option value="heavy-meat">Heavy meat-eater (daily red meat)</option>
        </select>
      </FieldGroup>

      <FieldGroup
        id="beef-meals"
        label="Beef / lamb meals per week"
        hint="Burgers, steaks, lamb chops, etc."
      >
        <div>
          <input
            id="beef-meals"
            type="range"
            className="form-range"
            min={0} max={14} step={1}
            value={data.beefMealsPerWeek}
            onChange={e => set('beefMealsPerWeek', parseInt(e.target.value))}
            aria-valuetext={`${data.beefMealsPerWeek} beef meals per week`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Never</span>
            <strong style={{ color: 'var(--brand-400)' }}>{data.beefMealsPerWeek} meals/week</strong>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Daily</span>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup id="food-waste" label="Food waste level" hint="How much food do you typically throw away?">
        <select
          id="food-waste"
          className="form-select"
          value={data.foodWasteLevel}
          onChange={e => set('foodWasteLevel', e.target.value as FoodData['foodWasteLevel'])}
        >
          <option value="minimal">Minimal (use almost everything)</option>
          <option value="moderate">Moderate (occasional waste)</option>
          <option value="high">High (often throw food away)</option>
        </select>
      </FieldGroup>

      <FieldGroup
        id="local-food"
        label="Local / seasonal food percentage"
        hint="Percentage of food bought from local or seasonal sources"
      >
        <div>
          <input
            id="local-food"
            type="range"
            className="form-range"
            min={0} max={100} step={5}
            value={data.localFoodPercentage}
            onChange={e => set('localFoodPercentage', parseInt(e.target.value))}
            aria-valuetext={`${data.localFoodPercentage}% local food`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>0% local</span>
            <strong style={{ color: 'var(--brand-400)' }}>{data.localFoodPercentage}% local</strong>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>100% local</span>
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}

// ── Step 4: Shopping ──────────────────────────────────────────

function ShoppingStep({
  data, onChange,
}: { data: ShoppingData; onChange: (d: ShoppingData) => void }) {
  const set = <K extends keyof ShoppingData>(k: K, v: ShoppingData[K]) =>
    onChange({ ...data, [k]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-2">
        <FieldGroup id="online-orders" label="Online orders per month" hint="Amazon, ASOS, etc.">
          <NumInput id="online-orders" value={data.onlineOrdersPerMonth}
            onChange={v => set('onlineOrdersPerMonth', v)} min={0} max={200} unit="orders" />
        </FieldGroup>
        <FieldGroup id="fast-fashion" label="Fast fashion items per month" hint="Zara, H&M, Shein etc.">
          <NumInput id="fast-fashion" value={data.fastFashionItemsPerMonth}
            onChange={v => set('fastFashionItemsPerMonth', v)} min={0} max={50} unit="items" />
        </FieldGroup>
      </div>
      <div className="grid-2">
        <FieldGroup id="electronics" label="New electronics per year" hint="Phones, laptops, tablets">
          <NumInput id="electronics" value={data.electronicsPerYear}
            onChange={v => set('electronicsPerYear', v)} min={0} max={30} unit="items" />
        </FieldGroup>
        <FieldGroup id="furniture" label="New furniture pieces per year" hint="Sofas, tables, shelves">
          <NumInput id="furniture" value={data.newFurniturePerYear}
            onChange={v => set('newFurniturePerYear', v)} min={0} max={20} unit="pieces" />
        </FieldGroup>
      </div>
    </div>
  );
}

// ── Step 5: Waste ─────────────────────────────────────────────

function WasteStep({ data, onChange }: { data: WasteData; onChange: (d: WasteData) => void }) {
  const set = <K extends keyof WasteData>(k: K, v: WasteData[K]) =>
    onChange({ ...data, [k]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <FieldGroup id="recycling" label="Recycling habits" hint="How much of your waste do you recycle?">
        <select
          id="recycling"
          className="form-select"
          value={data.recyclingHabits}
          onChange={e => set('recyclingHabits', e.target.value as WasteData['recyclingHabits'])}
        >
          <option value="none">None — I don't recycle</option>
          <option value="some">Some — I recycle occasionally</option>
          <option value="most">Most — I recycle most materials</option>
          <option value="all">All — I recycle everything possible</option>
        </select>
      </FieldGroup>

      <FieldGroup id="composting" label="Composting">
        <label className="toggle-wrapper">
          <span className="toggle">
            <input
              id="composting"
              type="checkbox"
              checked={data.composting}
              onChange={e => set('composting', e.target.checked)}
            />
            <span className="toggle-slider" />
          </span>
          <span>I compost food scraps and organic waste</span>
        </label>
      </FieldGroup>

      <FieldGroup id="plastic-bags" label="Single-use plastic bags per week">
        <NumInput id="plastic-bags" value={data.plasticBagsPerWeek}
          onChange={v => set('plasticBagsPerWeek', v)} min={0} max={100} unit="bags" />
      </FieldGroup>

      <FieldGroup id="single-use" label="Single-use plastic level" hint="Straws, cutlery, coffee cups, bottles">
        <select
          id="single-use"
          className="form-select"
          value={data.singleUsePlasticLevel}
          onChange={e => set('singleUsePlasticLevel', e.target.value as WasteData['singleUsePlasticLevel'])}
        >
          <option value="high">High — I frequently use single-use plastics</option>
          <option value="moderate">Moderate — I use them sometimes</option>
          <option value="low">Low — I try to avoid single-use plastics</option>
          <option value="minimal">Minimal — I always use reusables</option>
        </select>
      </FieldGroup>
    </div>
  );
}

// ── Main Assessment Page ──────────────────────────────────────

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { completeAssessment } = useApp();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [transport, setTransport] = useState<TransportationData>(DEFAULT_TRANSPORT);
  const [energy, setEnergy] = useState<EnergyData>(DEFAULT_ENERGY);
  const [food, setFood] = useState<FoodData>(DEFAULT_FOOD);
  const [shopping, setShopping] = useState<ShoppingData>(DEFAULT_SHOPPING);
  const [waste, setWaste] = useState<WasteData>(DEFAULT_WASTE);

  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    const assessmentData: AssessmentData = {
      transportation: transport,
      energy,
      food,
      shopping,
      waste,
      completedAt: new Date().toISOString(),
    };
    completeAssessment(assessmentData);
    showToast('Assessment complete! Calculating your footprint…', 'success', '🌱');
    navigate('/dashboard');
  }, [transport, energy, food, shopping, waste, completeAssessment, navigate, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) handleNext();
  };

  return (
    <main id="main-content" className="page" onKeyDown={handleKeyDown}>
      <div className="container" style={{ maxWidth: 720 }}>
        {/* Page header */}
        <div className="page-header text-center">
          <h1 className="page-title font-display">Carbon Footprint Assessment</h1>
          <p className="page-subtitle">
            Answer {totalSteps} short sections to calculate your annual CO₂e emissions.
          </p>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Step ${currentStep + 1} of ${totalSteps}: ${STEPS[currentStep].label}`}
          style={{ marginBottom: '2rem' }}
        >
          <div className="flex justify-between mb-2" style={{ marginBottom: '0.75rem' }}>
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center" style={{ flex: i < totalSteps - 1 ? '1' : 'none' }}>
                <div
                  className={`step-dot ${i < currentStep ? 'completed' : i === currentStep ? 'active' : ''}`}
                  aria-label={`${step.label} ${i < currentStep ? '(completed)' : i === currentStep ? '(current)' : ''}`}
                >
                  {i < currentStep ? '✓' : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`step-line ${i < currentStep ? 'completed' : ''}`} />
                )}
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {Math.round(progress)}% complete
          </div>
        </div>

        {/* Step card */}
        <div className="card animate-fade-in" key={currentStep}>
          <div className="flex items-center gap-3" style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--grad-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
              }}
              aria-hidden="true"
            >
              {STEPS[currentStep].icon}
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                {STEPS[currentStep].label}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {STEPS[currentStep].description}
              </p>
            </div>
          </div>

          {currentStep === 0 && <TransportStep data={transport} onChange={setTransport} />}
          {currentStep === 1 && <EnergyStep data={energy} onChange={setEnergy} />}
          {currentStep === 2 && <FoodStep data={food} onChange={setFood} />}
          {currentStep === 3 && <ShoppingStep data={shopping} onChange={setShopping} />}
          {currentStep === 4 && <WasteStep data={waste} onChange={setWaste} />}

          <hr className="divider" />

          <div className="flex justify-between items-center gap-3">
            <button
              className="btn btn-ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              aria-label="Go to previous step"
              id="assessment-back"
            >
              ← Back
            </button>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {currentStep + 1} / {totalSteps}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleNext}
              id="assessment-next"
              aria-label={
                currentStep === totalSteps - 1
                  ? 'Submit assessment and view results'
                  : `Continue to ${STEPS[currentStep + 1]?.label}`
              }
            >
              {currentStep === totalSteps - 1 ? (
                <>Calculate Footprint 🌱</>
              ) : (
                <>Next: {STEPS[currentStep + 1]?.label} →</>
              )}
            </button>
          </div>
        </div>

        <p
          style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '1.5rem' }}
        >
          Your data is stored locally on your device only. We never send it to any server.
        </p>
      </div>
    </main>
  );
}
