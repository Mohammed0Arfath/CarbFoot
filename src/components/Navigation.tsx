import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { NavLink, useLocation } from 'react-router-dom';
import type { Theme } from '@/types';

const NAV_ITEMS = [
  { to: '/',            label: 'Home',       icon: '🏠', ariaLabel: 'Home page' },
  { to: '/assessment',  label: 'Assess',     icon: '📊', ariaLabel: 'Carbon assessment' },
  { to: '/dashboard',   label: 'Dashboard',  icon: '📈', ariaLabel: 'Analytics dashboard' },
  { to: '/simulator',   label: 'Simulator',  icon: '🔬', ariaLabel: 'Carbon reduction simulator' },
  { to: '/goals',       label: 'Goals',      icon: '🎯', ariaLabel: 'Goal tracking' },
  { to: '/challenges',  label: 'Challenges', icon: '⚡', ariaLabel: 'Eco challenges' },
];

// Mobile nav shows a subset
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(n =>
  ['/', '/assessment', '/dashboard', '/goals', '/challenges'].includes(n.to)
);

export default function Navigation() {
  const { state, setTheme } = useApp();
  const location = useLocation();
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sync high contrast mode with document
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-high-contrast',
      highContrast ? 'true' : 'false'
    );
  }, [highContrast]);

  // Sync reduced motion with document
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduced-motion',
      reducedMotion ? 'true' : 'false'
    );
  }, [reducedMotion]);

  const toggleTheme = () => {
    const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <>
      {/* Skip navigation link — real accessibility, not decorative */}
      <a
        href="#main-content"
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Desktop Nav */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="container nav-inner">
          <NavLink to="/" className="nav-logo" aria-label="CarbFoot AI — go to home page">
            <span className="nav-logo-mark" aria-hidden="true">🌿</span>
            <span className="font-display">CarbFoot AI</span>
          </NavLink>

          <ul className="nav-links desktop-nav-links" role="list" aria-label="Site navigation">
            {NAV_ITEMS.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  aria-label={item.ariaLabel}
                  aria-current={location.pathname === item.to ? 'page' : undefined}
                  end={item.to === '/'}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {state.hasCompletedAssessment && (
              <div
                className="badge badge-brand"
                aria-label={`Your eco score: ${state.carbonResult?.ecoScore} out of 100`}
                role="status"
              >
                <span aria-hidden="true">🌿</span>
                Score: {state.carbonResult?.ecoScore ?? '—'}
              </div>
            )}

            {/* Reduced motion toggle */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setReducedMotion(m => !m)}
              aria-label={reducedMotion ? 'Enable animations' : 'Reduce animations (accessibility)'}
              aria-pressed={reducedMotion}
              title={reducedMotion ? 'Enable animations' : 'Reduce motion'}
              id="reduced-motion-toggle"
            >
              {reducedMotion ? '✦' : '✧'}
            </button>

            {/* High contrast toggle */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setHighContrast(hc => !hc)}
              aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode (accessibility)'}
              aria-pressed={highContrast}
              title={highContrast ? 'Normal contrast' : 'High contrast'}
              id="high-contrast-toggle"
            >
              ◑
            </button>

            {/* Dark/light mode */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
              id="theme-toggle"
            >
              {state.theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
        {MOBILE_NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            aria-label={item.ariaLabel}
            aria-current={location.pathname === item.to ? 'page' : undefined}
            end={item.to === '/'}
            style={{ flexDirection: 'column', gap: '2px', fontSize: '0.6875rem', padding: '0.375rem 0.5rem' }}
          >
            <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
