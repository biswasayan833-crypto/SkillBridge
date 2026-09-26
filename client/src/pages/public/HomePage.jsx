import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import opportunityService from '../../services/opportunityService';
import OpportunityCard from '../../components/opportunities/OpportunityCard';
import heroImage from '../../assets/images/skillbridge-hero-clean.webp';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [featuredOpportunities, setFeaturedOpportunities] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const handleMouseMove = (e) => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (window.innerWidth < 1024) return;

    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Normalized offset between -0.5 and +0.5
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    // Ultra-subtle: max 3px horizontally, max 2px vertically
    const offsetX = Math.round(normX * 6 * 10) / 10;
    const offsetY = Math.round(normY * 4 * 10) / 10;

    setPointerOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseLeave = () => {
    setPointerOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    let isMounted = true;
    const loadFeatured = async () => {
      try {
        const res = await opportunityService.getOpportunities({ limit: 3 });
        if (isMounted && res.success && Array.isArray(res.data)) {
          setFeaturedOpportunities(res.data);
        }
      } catch {
        // Graceful fallback if service is momentarily offline
      } finally {
        if (isMounted) setLoadingFeatured(false);
      }
    };
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* ===================================================================
          1. CINEMATIC HERO SECTION
          =================================================================== */}
      <section
        ref={heroRef}
        className="hero-cinematic"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Visual Layer */}
        <div
          className="hero-bg-layer"
          aria-hidden="true"
          style={
            pointerOffset.x !== 0 || pointerOffset.y !== 0
              ? { transform: `translate3d(${pointerOffset.x}px, ${pointerOffset.y}px, 0)` }
              : undefined
          }
        >
          <img
            src={heroImage}
            alt="SkillBridge Developer Workspace"
            className="hero-cinematic-img"
            loading="eager"
          />
          <div className="hero-overlay-gradient" />
        </div>

        {/* Content Container (Grid-Aligned) */}
        <div className="container hero-content-container">
          <div className="hero-text-column">
            {/* Eyebrow */}
            <div className="hero-eyebrow hero-animate-eyebrow">
              INTERNSHIPS / JOBS / CAREER GROWTH
            </div>

            {/* Headline */}
            <h1 className="hero-headline hero-animate-headline">
              Build the next step<br />
              of your <span className="hero-headline-accent">career.</span>
            </h1>

            {/* Supporting Text */}
            <p className="hero-supporting-text hero-animate-supporting">
              Discover internships and opportunities matched to your skills and goals.
            </p>

            {/* CTA Group */}
            <div className="hero-cta-group hero-animate-cta">
              <Link
                to="/opportunities"
                className="btn btn-primary hero-btn-primary"
              >
                Explore Opportunities &rarr;
              </Link>

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="btn btn-secondary hero-btn-secondary"
                >
                  Sign In
                </Link>
              ) : user?.role === 'student' ? (
                <Link
                  to="/student/dashboard"
                  className="btn btn-secondary hero-btn-secondary"
                >
                  Student Dashboard &rarr;
                </Link>
              ) : (
                <Link
                  to="/recruiter/dashboard"
                  className="btn btn-secondary hero-btn-secondary"
                >
                  Recruiter Dashboard &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          MAIN CONTENT BELOW HERO
          =================================================================== */}
      <div className="container" style={{ paddingTop: '3.5rem' }}>
        {/* ===================================================================
            2. OPPORTUNITY DISCOVERY (Quick Specialization Filters)
            =================================================================== */}
        <section
          style={{
            marginBottom: '4.5rem',
            padding: '2rem 2.25rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Explore by Specialization & Work Mode
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Filter open positions by role type, working arrangement, and technical stack.
              </p>
            </div>
            <Link
              to="/opportunities"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none' }}
            >
              Browse all postings &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            <Link to="/opportunities?type=internship" className="filter-pill">
              Internships
            </Link>
            <Link to="/opportunities?type=full-time" className="filter-pill">
              Full-Time Roles
            </Link>
            <Link to="/opportunities?workMode=remote" className="filter-pill">
              Remote Positions
            </Link>
            <Link to="/opportunities?workMode=hybrid" className="filter-pill">
              Hybrid
            </Link>
            <Link to="/opportunities?search=Software" className="filter-pill">
              Software Engineering
            </Link>
            <Link to="/opportunities?search=React" className="filter-pill">
              React / Frontend
            </Link>
            <Link to="/opportunities?search=Node" className="filter-pill">
              Node.js / Backend
            </Link>
            <Link to="/opportunities?search=Full+Stack" className="filter-pill">
              Full Stack
            </Link>
          </div>
        </section>

        {/* ===================================================================
            3. SELECTED OPPORTUNITY PREVIEWS (Live API-Backed Listings)
            =================================================================== */}
        <section style={{ marginBottom: '5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.35rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Featured Opportunities
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                Recent openings published by hiring organizations on SkillBridge.
              </p>
            </div>
            <Link
              to="/opportunities"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none' }}
            >
              View all opportunities ({featuredOpportunities.length}+) &rarr;
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    height: '240px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                  }}
                />
              ))}
            </div>
          ) : featuredOpportunities.length > 0 ? (
            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
              {featuredOpportunities.map((opp) => (
                <OpportunityCard key={opp._id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '3rem 2rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.925rem' }}>
                Explore the full opportunities marketplace to discover active job and internship postings.
              </p>
              <Link to="/opportunities" className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                Go to Opportunities &rarr;
              </Link>
            </div>
          )}
        </section>

        {/* ===================================================================
            4. HOW SKILLBRIDGE WORKS (Editorial 4-Stage Pathway)
            =================================================================== */}
        <section style={{ marginBottom: '5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 700, margin: '0 0 0.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              How SkillBridge Works
            </h2>
            <p style={{ maxWidth: '540px', margin: '0 auto', fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A transparent four-stage pathway designed to eliminate hiring friction for students and employers.
            </p>
          </div>

          <div className="grid grid-cols-4" style={{ gap: '1.25rem' }}>
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--primary-400)',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                }}
              >
                01 / DISCOVER
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Find Matching Roles
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                Filter listings by role type, working arrangement, compensation, and required competencies.
              </p>
            </div>

            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--primary-400)',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                }}
              >
                02 / APPLY
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                One-Click Submission
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                Submit verified student profile data and resume documents with an optional custom statement.
              </p>
            </div>

            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--primary-400)',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                }}
              >
                03 / SCREEN
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Recruiter Evaluation
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                Hiring managers review candidate academic credentials, skills, and download attached resumes directly.
              </p>
            </div>

            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--primary-400)',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                }}
              >
                04 / PROGRESS
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Pipeline Tracking
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                Monitor application progression through screening, interview rounds, and decision status.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================================
            5. DUAL-SIDED VALUE PROPOSITION (Students vs. Employers)
            =================================================================== */}
        <section
          style={{
            marginBottom: '5rem',
            padding: '2.75rem 2.5rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 700, margin: '0 0 0.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Designed for Both Sides of Technical Placement
            </h2>
            <p style={{ maxWidth: '580px', margin: '0 auto', fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Tailored tools for students launching their careers and recruiters building technical teams.
            </p>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '2.5rem' }}>
            {/* For Students */}
            <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '2rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Candidates
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
                For Students & Graduates
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Create a structured technical profile, upload your resume, and apply to vetted roles without repetitive manual entry.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>—</span>
                  <span>Faceted search by role type, work arrangement, and technical stack</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>—</span>
                  <span>Centralized PDF/DOCX resume management with single-click submission</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>—</span>
                  <span>Transparent 6-stage tracking across screening, interview, and offers</span>
                </li>
              </ul>

              <div style={{ marginTop: '1.75rem' }}>
                <Link to="/opportunities" className="btn btn-outline" style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}>
                  Explore Student Roles &rarr;
                </Link>
              </div>
            </div>

            {/* For Recruiters */}
            <div style={{ paddingLeft: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Employers
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
                For Recruiters & Companies
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Publish technical listings, review qualified applicants with standardized criteria, and coordinate hiring stages.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>—</span>
                  <span>Publish postings with clear compensation, qualifications, and deadlines</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>—</span>
                  <span>Inspect candidate education, graduation year, skills, and download resumes</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>—</span>
                  <span>One-click stage progression from Applied to Interview and Selected</span>
                </li>
              </ul>

              <div style={{ marginTop: '1.75rem' }}>
                {isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') ? (
                  <Link to="/recruiter/opportunities/create" className="btn btn-outline" style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}>
                    Post an Opportunity &rarr;
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-outline" style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}>
                    Register as Recruiter &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            6. FINAL CALL TO ACTION (Calm, Confident)
            =================================================================== */}
        <section
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Ready to Build Your Career Pathway?
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 1.75rem', color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Create an account to explore matching opportunities, manage your credentials, or recruit emerging technical talent.
          </p>
          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/opportunities" className="btn btn-primary" style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem' }}>
              View All Opportunities &rarr;
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary" style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem' }}>
                Create Free Account
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
