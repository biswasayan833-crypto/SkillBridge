import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      {/* Cinematic Hero Section */}
      <section
        className="card"
        style={{
          textAlign: 'center',
          padding: '5rem 2rem 4.5rem',
          marginBottom: '3.5rem',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        }}
      >
        {/* Ambient Top Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Factual Product Tag */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <span
            className="badge badge-purple"
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
            }}
          >
            🌉 Career Opportunity Platform for Students & Employers
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
            fontWeight: 800,
            maxWidth: '850px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
          }}
        >
          Connecting Student Ambition with{' '}
          <span
            style={{
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Career Opportunities
          </span>
        </h1>

        {/* Subtitle with Factual Product Language */}
        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 2.25rem',
            lineHeight: 1.65,
          }}
        >
          SkillBridge bridges the campus-to-career transition through structured applications,
          centralized resume management, and an API-driven status tracking workflow.
        </p>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <Link
            to="/opportunities"
            className="btn btn-primary btn-lg"
            style={{ padding: '0.85rem 2rem' }}
          >
            Explore Opportunities &rarr;
          </Link>

          {!isAuthenticated ? (
            <Link
              to="/register"
              className="btn btn-secondary btn-lg"
              style={{ padding: '0.85rem 2rem' }}
            >
              Create Account
            </Link>
          ) : user?.role === 'student' ? (
            <Link
              to="/student/dashboard"
              className="btn btn-secondary btn-lg"
              style={{ padding: '0.85rem 2rem' }}
            >
              Student Dashboard &rarr;
            </Link>
          ) : (
            <Link
              to="/recruiter/dashboard"
              className="btn btn-secondary btn-lg"
              style={{ padding: '0.85rem 2rem' }}
            >
              Recruiter Dashboard &rarr;
            </Link>
          )}
        </div>

        {/* Factual Platform Highlights Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
            <span>Structured Applications</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--accent-blue)' }}>✓</span>
            <span>Application Status Tracking</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--primary-400)' }}>✓</span>
            <span>Student & Recruiter Workflows</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--accent-purple)' }}>✓</span>
            <span>5-Stage Review Funnel</span>
          </div>
        </div>
      </section>

      {/* Role Pillars Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Tailored Capabilities for Both Sides of Hiring</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>
            Whether you are embarking on your first internship or building a dynamic team, SkillBridge simplifies candidate and opportunity management.
          </p>
        </div>

        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
          {/* Student Pillar Card */}
          <div className="card card-hover" style={{ padding: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              }}
            >
              🎓
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>For Students</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Discover active internships and entry-level positions aligned with your degree, technical skills, and preferred work mode.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
                <span>Faceted query filters by role type (internship/full-time), mode, and skills</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
                <span>Upload and manage PDF/DOCX resume documents up to 5 MB</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
                <span>Direct application submissions with optional custom cover letters</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
                <span>Track application progression across 7 distinct pipeline stages</span>
              </li>
            </ul>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/opportunities" className="btn btn-outline" style={{ width: '100%', padding: '0.65rem' }}>
                Browse Available Opportunities &rarr;
              </Link>
            </div>
          </div>

          {/* Recruiter Pillar Card */}
          <div className="card card-hover" style={{ padding: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              }}
            >
              💼
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>For Recruiters & Companies</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Publish career opportunities, inspect qualified student profiles, and advance candidates through an organized recruitment workflow.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>✓</span>
                <span>Post opportunities with compensation, requirements, and deadlines</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>✓</span>
                <span>Review candidate education, graduation year, skills tags, and resumes</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>✓</span>
                <span>API-driven application status updater (Applied &rarr; Selected / Rejected)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>✓</span>
                <span>Strict recruiter ownership boundaries and soft-deactivation control</span>
              </li>
            </ul>
            <div style={{ marginTop: '2rem' }}>
              {isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') ? (
                <Link to="/recruiter/opportunities/create" className="btn btn-outline" style={{ width: '100%', padding: '0.65rem' }}>
                  Post an Opportunity &rarr;
                </Link>
              ) : (
                <Link to="/register" className="btn btn-outline" style={{ width: '100%', padding: '0.65rem' }}>
                  Register as Recruiter &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Workflow Stepper Section */}
      <section
        className="card"
        style={{
          padding: '3rem 2rem',
          marginBottom: '4rem',
          border: '1px solid var(--border-medium)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>How SkillBridge Works</h2>
          <p>A transparent 4-step workflow from discovery to candidate selection.</p>
        </div>

        <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              1
            </div>
            <h4 style={{ marginBottom: '0.4rem' }}>Discover</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Filter by location, role type, work mode, and technical competencies.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              2
            </div>
            <h4 style={{ marginBottom: '0.4rem' }}>Apply</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Submit with your profile resume and an optional tailored statement.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              3
            </div>
            <h4 style={{ marginBottom: '0.4rem' }}>Review</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Recruiters evaluate candidate credentials and review candidate resumes.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              4
            </div>
            <h4 style={{ marginBottom: '0.4rem' }}>Progress</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Track candidate status updates from initial review to final offer.
            </p>
          </div>
        </div>
      </section>

      {/* Final Action Invitation Section */}
      <section
        style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-brand-subtle)',
          border: '1px solid var(--border-highlight)',
        }}
      >
        <h2 style={{ marginBottom: '0.75rem' }}>Ready to Get Started?</h2>
        <p style={{ maxWidth: '540px', margin: '0 auto 1.75rem', color: 'var(--text-secondary)' }}>
          Create an account to browse listings, submit applications, or publish opportunities today.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/opportunities" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            View All Opportunities &rarr;
          </Link>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem' }}>
              Register for Free
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
