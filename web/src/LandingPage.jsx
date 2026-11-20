import React from 'react';
import { useTheme } from './ThemeContext.jsx';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
    title: 'Real-time Inventory',
    description: 'Track stock levels across multiple warehouses with live updates. Never run out of critical items again.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    ),
    title: 'Barcode Scanning',
    description: 'Scan products instantly with camera or handheld scanner. Reduce manual entry errors and speed up receiving.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    title: 'Analytics & Reports',
    description: 'Gain insights with dashboards showing sales trends, low stock alerts, and turnover rates.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    title: 'Multi-user Support',
    description: 'Role-based access control for admins, managers, and staff. Audit trails for all inventory changes.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    title: 'Cycle Counting',
    description: 'Schedule and perform cycle counts without disrupting operations. Maintain accuracy year-round.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ),
    title: 'POS Integration',
    description: 'Process sales directly from the system. Automatic inventory deduction and receipt generation.',
  },
];

export default function LandingPage({ onLogin }) {
  const { theme, themes, changeTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="landing-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="landing-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span>Inventory Manager</span>
        </div>
        <nav className="landing-nav">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#demo" className="landing-nav-link">Demo</a>
          <a href="#pricing" className="landing-nav-link">Pricing</a>
          <button onClick={onLogin} className="landing-hero-btn primary" style={{ padding: '10px 20px', fontSize: '14px' }}>Sign In</button>
          <div className="theme-selector">
            <select
              value={theme}
              onChange={(e) => changeTheme(e.target.value)}
              aria-label="Select theme"
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-content">
            <div className="landing-hero-badge">
              <span>🚀</span>
              <span>Version 2.0 Released</span>
            </div>
            <h1 id="hero-title" className="landing-hero-title">
              Streamline Your <span>Inventory Management</span>
            </h1>
            <p className="landing-hero-description">
              A modern, real-time inventory management system built for teams who need speed, accuracy, and insights. Track stock, process orders, and make data-driven decisions.
            </p>
            <div className="landing-hero-actions">
              <button onClick={onLogin} className="landing-hero-btn primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Start Free Trial
              </button>
              <button className="landing-hero-btn secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                Watch Demo
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <span>✓ No credit card required</span>
              <span>✓ 14-day free trial</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </section>

        <section id="features" className="landing-features" aria-labelledby="features-title">
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', marginBottom: '48px' }}>
            <h2 id="features-title" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Everything You Need to Manage Inventory
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              Powerful features designed for modern warehouses, retail stores, and e-commerce operations.
            </p>
          </div>
          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="landing-feature">
                <div className="landing-feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="landing-cta" aria-labelledby="cta-title">
          <h2 id="cta-title" className="landing-cta-title">Ready to Transform Your Inventory?</h2>
          <p className="landing-cta-description">
            Join thousands of teams already using Inventory Manager to reduce stockouts, improve accuracy, and save time.
          </p>
          <button onClick={onLogin} className="landing-hero-btn primary">
            Get Started Free
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <p className="landing-footer-text">
          © 2026 Inventory Manager. Built with React & Vite.
        </p>
      </footer>
    </div>
  );
}