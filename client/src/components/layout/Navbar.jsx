import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          <span className="nav-brand-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19L20 19" />
              <path d="M4 15C7 9 17 9 20 15" />
              <path d="M12 4L12 12" />
            </svg>
          </span>
          <span className="nav-brand-text">SkillBridge</span>
        </Link>

        {/* Mobile menu toggle */}
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

                <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginLeft: '0.5rem' }}>
                  <span
                    className="badge badge-info"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.6rem',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
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
                    style={{ color: '#fff' }}
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
