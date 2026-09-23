import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              fontSize: '1.1rem',
            }}
          >
            🌉
          </span>
          <span className="nav-brand-gradient">SkillBridge</span>
        </Link>

        {/* Mobile menu toggle button */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav>
          <ul className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <li>
              <NavLink to="/" end onClick={closeMobileMenu}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/opportunities" onClick={closeMobileMenu}>
                Opportunities
              </NavLink>
            </li>

            {isAuthenticated && user ? (
              <>
                {/* Student Navigation */}
                {user.role === 'student' && (
                  <>
                    <li>
                      <NavLink to="/student/dashboard" onClick={closeMobileMenu}>
                        Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/student/applications" onClick={closeMobileMenu}>
                        My Applications
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/student/profile" onClick={closeMobileMenu}>
                        Profile
                      </NavLink>
                    </li>
                  </>
                )}

                {/* Recruiter / Admin Navigation */}
                {(user.role === 'recruiter' || user.role === 'admin') && (
                  <>
                    {user.role === 'recruiter' && (
                      <li>
                        <NavLink to="/recruiter/dashboard" onClick={closeMobileMenu}>
                          Dashboard
                        </NavLink>
                      </li>
                    )}
                    <li>
                      <NavLink to="/recruiter/opportunities" onClick={closeMobileMenu}>
                        My Opportunities
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/student/profile" onClick={closeMobileMenu}>
                        Profile
                      </NavLink>
                    </li>
                  </>
                )}

                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.5rem' }}>
                  <span
                    className="badge badge-info"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.65rem',
                      textTransform: 'capitalize',
                      letterSpacing: '0.02em',
                    }}
                  >
                    👤 {user.name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                    style={{
                      border: '1px solid var(--border-medium)',
                      padding: '0.35rem 0.75rem',
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Guest Navigation */}
                <li>
                  <NavLink to="/login" onClick={closeMobileMenu}>
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/register"
                    className="btn btn-primary btn-sm"
                    onClick={closeMobileMenu}
                    style={{ color: '#fff', padding: '0.45rem 1rem' }}
                  >
                    Get Started
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
