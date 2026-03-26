import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHospital, 
  FaBars, 
  FaTimes, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaChevronDown 
} from 'react-icons/fa';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.nav-item')) {
        setActiveDropdown(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveDropdown(null);
  };

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  };

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: <FaHospital />
    },
    {
      name: 'About',
      path: '/about',
      icon: <FaHospital />
    },
    {
      name: 'Solutions',
      dropdown: [
        { name: 'Hospitals & Medical Centers', path: '/solutions/hospitals' },
        { name: 'Pharmacies & Clinics', path: '/solutions/pharmacies' },
        { name: 'Emergency Care Centers', path: '/solutions/emergency' },
        { name: 'Long-term Care Facilities', path: '/solutions/longterm' }
      ]
    },
    {
      name: 'Features',
      dropdown: [
        { name: 'Smart Inventory Management', path: '/features/inventory' },
        { name: 'AI Analytics Dashboard', path: '/features/analytics' },
        { name: 'Real-time Tracking', path: '/features/tracking' },
        { name: 'Compliance & Security', path: '/features/security' }
      ]
    },
    {
      name: 'Pricing',
      path: '/pricing'
    },
    {
      name: 'Resources',
      dropdown: [
        { name: 'Help Center', path: '/help' },
        { name: 'Documentation', path: '/docs' },
        { name: 'Blog & Insights', path: '/blog' },
        { name: 'Case Studies', path: '/case-studies' }
      ]
    },
    {
      name: 'Contact',
      path: '/contact'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="contact-info">
              <span>+1 (855) MED-PRO-1</span>
              <span>info@medicalinventorypro.com</span>
              <span>123 Innovation Drive, Suite 100<br />New York, NY 10001</span>
            </div>
            <div className="top-bar-actions">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Get Started</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`main-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-content">
            {/* Logo */}
            <Link to="/" className="nav-logo" onClick={closeMenu}>
              <FaHospital className="logo-icon" />
              <span className="logo-text">Medical Inventory Pro</span>
            </Link>

            {/* Desktop Menu */}
            <ul className="nav-menu desktop-menu">
              {navItems.map((item, index) => (
                <li key={index} className="nav-item">
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      {item.icon && <span className="nav-icon">{item.icon}</span>}
                      {item.name}
                    </Link>
                  ) : (
                    <div
                      className="nav-link dropdown-toggle"
                      onClick={() => toggleDropdown(item.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDropdown(item.name);
                        }
                      }}
                    >
                      {item.name}
                      <FaChevronDown className={`dropdown-arrow ${activeDropdown === item.name ? 'open' : ''}`} />
                    </div>
                  )}
                  
                  {item.dropdown && (
                    <div className={`dropdown-menu ${activeDropdown === item.name ? 'show' : ''}`}>
                      {item.dropdown.map((dropdownItem, dropdownIndex) => (
                        <Link 
                          key={dropdownIndex}
                          to={dropdownItem.path}
                          className="dropdown-item"
                          onClick={closeMenu}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMenuOpen ? 'show' : ''}`}>
            <ul className="nav-menu mobile-nav-menu">
              {navItems.map((item, index) => (
                <li key={index} className="nav-item">
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      {item.icon && <span className="nav-icon">{item.icon}</span>}
                      {item.name}
                    </Link>
                  ) : (
                    <div 
                      className="nav-link dropdown-toggle"
                      onClick={() => toggleDropdown(item.name)}
                    >
                      {item.name}
                      <FaChevronDown className={`dropdown-arrow ${activeDropdown === item.name ? 'open' : ''}`} />
                    </div>
                  )}
                  
                  {item.dropdown && (
                    <div className={`mobile-dropdown ${activeDropdown === item.name ? 'show' : ''}`}>
                      {item.dropdown.map((dropdownItem, dropdownIndex) => (
                        <Link 
                          key={dropdownIndex}
                          to={dropdownItem.path}
                          className="dropdown-item"
                          onClick={closeMenu}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
            {/* Mobile Actions */}
            <div className="mobile-actions">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
