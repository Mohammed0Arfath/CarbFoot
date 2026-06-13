import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/Toast';
import Navigation from '@/components/Navigation';

// Lazy-loaded pages for code splitting
const HomePage        = lazy(() => import('@/pages/HomePage'));
const AssessmentPage  = lazy(() => import('@/pages/AssessmentPage'));
const DashboardPage   = lazy(() => import('@/pages/DashboardPage'));
const GoalsPage       = lazy(() => import('@/pages/GoalsPage'));
const ChallengesPage  = lazy(() => import('@/pages/ChallengesPage'));
const SimulatorPage   = lazy(() => import('@/pages/SimulatorPage'));

function PageLoader() {
  return (
    <div
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '50vh', flexDirection: 'column', gap: '1rem',
      }}
      role="status"
      aria-label="Loading page"
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid var(--bg-elevated)',
        borderTopColor: 'var(--brand-400)',
        animation: 'spin 0.8s linear infinite',
      }} aria-hidden="true" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Loading…</span>
    </div>
  );
}


export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"           element={<HomePage />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/dashboard"  element={<DashboardPage />} />
                <Route path="/goals"      element={<GoalsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/simulator"  element={<SimulatorPage />} />
                <Route path="*"           element={<NotFound />} />
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}

function NotFound() {
  return (
    <main id="main-content" className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div className="container" style={{ maxWidth: 480 }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }} aria-hidden="true">🌿</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          This page doesn't exist. Let's get you back on track.
        </p>
        <a href="/" className="btn btn-primary" aria-label="Return to home page">
          ← Back to Home
        </a>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '2rem 0',
        marginTop: 'auto',
      }}
      role="contentinfo"
    >
      <div className="container">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden="true">🌿</span>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CarbFoot AI</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              — Personal Carbon Intelligence
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Emission factors: EPA · IPCC AR6 · IEA · DEFRA 2023.
            Estimates are directional guidance, not exact measurements.
          </p>
        </div>
      </div>
    </footer>
  );
}
