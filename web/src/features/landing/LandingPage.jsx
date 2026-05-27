import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ── SVG Icons ── */
function QueueIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h12M4 18h8" />
      <circle cx="20" cy="15" r="3" fill="currentColor" opacity="0.2" stroke="currentColor" />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 7v5c0 5.25 3.8 10.13 9 11 5.2-.87 9-5.75 9-11V7l-9-5z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <circle cx="17" cy="7" r="3" />
      <path d="M21 21v-2a4 4 0 00-3-3.87" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stats = [
    { value: '10K+', label: 'Customers Served' },
    { value: '500+', label: 'Partner Businesses' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '< 3min', label: 'Avg Wait Reduction' },
  ];

  const features = [
    { icon: <QueueIcon />, title: 'Smart Queue Management', desc: 'Automated queue flow with call-next, pause, skip, and priority tagging for PWD, elderly, and pregnant customers.' },
    { icon: <ChartIcon />, title: 'Real-Time Analytics', desc: 'Track daily queue volume, average service time, no-show rates, and peak hours with beautiful dashboards.' },
    { icon: <MapPinIcon />, title: 'Branch Mapping', desc: 'Customers discover your business on our interactive map with live queue status and estimated wait times.' },
    { icon: <BellIcon />, title: 'Instant Notifications', desc: 'Citizens receive real-time updates when their turn approaches — no more physical waiting in line.' },
    { icon: <UsersIcon />, title: 'Staff Management', desc: 'Add team members by email, assign roles, and manage your branch operations collaboratively.' },
    { icon: <ClockIcon />, title: 'Operating Hours Control', desc: 'Set business hours, pause queues during breaks, and temporarily disable listings with one click.' },
  ];

  const howItWorks = [
    { step: '01', title: 'Sign Up as Partner', desc: 'Register your business with details like category, address, operating hours, and number of counters.' },
    { step: '02', title: 'Get Verified', desc: 'Our admin team reviews and approves your establishment to ensure authenticity on the platform.' },
    { step: '03', title: 'Go Live', desc: 'Access your Partner Dashboard to manage queues, view analytics, and serve customers digitally.' },
    { step: '04', title: 'Grow Your Business', desc: 'Reduce wait times, increase customer satisfaction, and gain insights to optimize your operations.' },
  ];

  const categories = [
    { emoji: '🏦', name: 'Banks' },
    { emoji: '🏥', name: 'Hospitals' },
    { emoji: '🏛️', name: "Gov't Offices" },
    { emoji: '🍽️', name: 'Restaurants' },
    { emoji: '💇', name: 'Salons & Spas' },
    { emoji: '🏪', name: 'Retail Stores' },
    { emoji: '⚕️', name: 'Clinics' },
    { emoji: '📋', name: 'And More...' },
  ];

  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} id="landing-nav">
        <div className="landing-nav-inner">
          <a href="#" className="landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="landing-brand-logo">
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
                <rect width="56" height="56" rx="14" fill="white" fillOpacity="0.18" />
                <path d="M14 18h28M14 28h21M14 38h14" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="42" cy="35" r="9" fill="white" fillOpacity="0.92" />
                <text x="42" y="39.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2563eb">Q</text>
              </svg>
            </div>
            <span>QuickQueue</span>
          </a>

          <div className={`landing-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#categories" onClick={() => setMobileMenuOpen(false)}>Categories</a>
            <a href="#partner" onClick={() => setMobileMenuOpen(false)}>For Partners</a>
          </div>

          <div className="landing-nav-actions">
            <button className="landing-nav-login" onClick={() => navigate('/auth?mode=login')} id="nav-login-btn">
              Log In
            </button>
            <button className="landing-nav-register" onClick={() => navigate('/auth?mode=register')} id="nav-register-btn">
              Get Started
            </button>
          </div>

          <button
            className="landing-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="landing-hero" id="hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-orb landing-hero-orb-1" />
          <div className="landing-hero-orb landing-hero-orb-2" />
          <div className="landing-hero-orb landing-hero-orb-3" />
        </div>
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <SpeedIcon />
            <span>Smart Queue Management Platform</span>
          </div>
          <h1>
            Eliminate Waiting Lines.<br />
            <span className="landing-hero-gradient">Delight Every Customer.</span>
          </h1>
          <p className="landing-hero-sub">
            QuickQueue is a modern digital queue management system that connects businesses
            with customers in real-time. No more physical lines — just seamless, efficient service.
          </p>
          <div className="landing-hero-btns">
            <button className="landing-btn-primary" onClick={() => navigate('/auth?mode=register&role=partner')} id="hero-partner-btn">
              Register as Partner
              <ArrowRightIcon />
            </button>
            <button className="landing-btn-secondary" onClick={() => navigate('/auth?mode=register&role=customer')} id="hero-customer-btn">
              Join as Customer
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="landing-stats">
          {stats.map((s) => (
            <div key={s.label} className="landing-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section" id="features">
        <div className="landing-section-header">
          <span className="landing-section-tag">Features</span>
          <h2>Everything You Need to Manage Queues</h2>
          <p>Powerful tools for businesses and a delightful experience for customers</p>
        </div>
        <div className="landing-features-grid">
          {features.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-section landing-section-dark" id="how-it-works">
        <div className="landing-section-header">
          <span className="landing-section-tag light">How It Works</span>
          <h2>Get Started in 4 Simple Steps</h2>
          <p>From sign-up to serving customers — it takes less than 10 minutes</p>
        </div>
        <div className="landing-steps-grid">
          {howItWorks.map((item) => (
            <div key={item.step} className="landing-step-card">
              <div className="landing-step-number">{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="landing-section" id="categories">
        <div className="landing-section-header">
          <span className="landing-section-tag">Categories</span>
          <h2>Built for Every Industry</h2>
          <p>From banks and hospitals to salons and restaurants — QuickQueue serves them all</p>
        </div>
        <div className="landing-categories-grid">
          {categories.map((c) => (
            <div key={c.name} className="landing-category-card">
              <span className="landing-category-emoji">{c.emoji}</span>
              <span className="landing-category-name">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Partner CTA ── */}
      <section className="landing-section landing-partner-cta" id="partner">
        <div className="landing-cta-content">
          <h2>Ready to Transform Your Business?</h2>
          <p>
            Join hundreds of establishments already using QuickQueue.
            Register as a partner today and start managing your queues digitally.
          </p>
          <div className="landing-cta-features">
            <div className="landing-cta-feature">
              <CheckCircleIcon />
              <span>Free to get started</span>
            </div>
            <div className="landing-cta-feature">
              <CheckCircleIcon />
              <span>Admin-verified listing</span>
            </div>
            <div className="landing-cta-feature">
              <CheckCircleIcon />
              <span>Real-time analytics</span>
            </div>
            <div className="landing-cta-feature">
              <CheckCircleIcon />
              <span>Priority support</span>
            </div>
          </div>
          <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate('/auth?mode=register&role=partner')} id="cta-partner-btn">
            Become a Partner
            <ArrowRightIcon />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-brand">
              <div className="landing-brand-logo small">
                <svg width="22" height="22" viewBox="0 0 56 56" fill="none">
                  <rect width="56" height="56" rx="14" fill="white" fillOpacity="0.18" />
                  <path d="M14 18h28M14 28h21M14 38h14" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
                  <circle cx="42" cy="35" r="9" fill="white" fillOpacity="0.92" />
                  <text x="42" y="39.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2563eb">Q</text>
                </svg>
              </div>
              <span>QuickQueue</span>
            </div>
            <p>Smart Queue Management System for the modern world. Eliminate waiting lines and delight every customer.</p>
          </div>

          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#categories">Categories</a>
              <a href="#partner">For Partners</a>
            </div>
            <div className="landing-footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
              <a href="#">Blog</a>
            </div>
            <div className="landing-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>&copy; 2025 QuickQueue. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
