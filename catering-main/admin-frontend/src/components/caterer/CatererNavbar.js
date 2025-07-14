import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NAV_LINKS = [
  { to: '/caterer/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/caterer/orders', label: 'Orders', icon: 'assignment' },
  { to: '/caterer/menu', label: 'Menu', icon: 'restaurant_menu' },
  { to: '/caterer/settings', label: 'Settings', icon: 'settings' },
];

const CatererNavbar = () => {
  const catererInfo = useSelector(state => state.caterer.catererInfo);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/'); // Hard redirect to reset all state
  };
  
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <nav className="admin-navbar" style={{ padding: '0.75rem 1rem', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
      <div className="admin-navbar-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="admin-navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {catererInfo?.businessLogo ? (
            <img src={catererInfo.businessLogo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <span className="admin-logo-icon" style={{ fontSize: '1.5rem' }}>🎂</span>
          )}
          <span className="admin-logo-text" style={{ fontWeight: 'bold', lineHeight: 1.2 }}>{catererInfo?.businessName || 'Catering'}<br/>{catererInfo?.businessName ? '' : 'Pro'}</span>
        </div>

        {/* Desktop Menu */}
        {!isMobile && (
          <div className="admin-navbar-links" style={{ display: 'flex', gap: '1rem' }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`admin-navbar-link${location.pathname.startsWith(link.to) ? ' active' : ''}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 1rem', borderRadius: 8 }}
              >
                <span className="material-icons" style={{ fontSize: 22 }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            <button className="btn-admin admin-navbar-logout" title="Logout" onClick={handleLogout} style={{ marginLeft: 16, padding: '0.5rem 1.25rem', borderRadius: 8 }}>
              Logout
            </button>
          </div>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button onClick={toggleMobileMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <span className="material-icons" style={{ fontSize: 28 }}>menu</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            background: 'white', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
            padding: '1rem',
            zIndex: 1000
          }}
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`mobile-menu-link${location.pathname.startsWith(link.to) ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem', textDecoration: 'none', borderRadius: 8, marginBottom: '0.5rem' }}
            >
              <span className="material-icons">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          <button onClick={handleLogout} className="mobile-menu-link" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem', borderRadius: 8, border: 'none', background: 'transparent' }}>
            <span className="material-icons">logout</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default CatererNavbar; 