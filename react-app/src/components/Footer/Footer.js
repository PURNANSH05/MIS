import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHospital, 
  FaFacebookF, 
  FaTwitter, 
  FaLinkedinIn, 
  FaInstagram,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaArrowUp
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    product: [
      { name: 'Features', path: '/features' },
      { name: 'Pricing', path: '/pricing' },
      { name: 'Security', path: '/security' },
      { name: 'Integration', path: '/integration' }
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Blog', path: '/blog' },
      { name: 'Press', path: '/press' }
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'Documentation', path: '/docs' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Status', path: '/status' }
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
      { name: 'GDPR', path: '/gdpr' }
    ]
  };

  const socialLinks = [
    { icon: <FaFacebookF />, name: 'Facebook', url: '#' },
    { icon: <FaTwitter />, name: 'Twitter', url: '#' },
    { icon: <FaLinkedinIn />, name: 'LinkedIn', url: '#' },
    { icon: <FaInstagram />, name: 'Instagram', url: '#' }
  ];

  return (
    <footer className="footer">
      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            {/* Company Info */}
            <div className="footer-section company-info">
              <Link to="/" className="footer-logo">
                <FaHospital className="logo-icon" />
                <span className="logo-text">Medical Inventory Pro</span>
              </Link>
              <p className="company-description">
                Transforming healthcare facilities worldwide with intelligent inventory management solutions. We help hospitals, pharmacies, clinics, and medical centers optimize their supply chain operations with cutting-edge AI technology, real-time analytics, and predictive insights.
              </p>
              <div className="social-links">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url}
                    className="social-link"
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div className="footer-section">
              <h4>Product</h4>
              <ul className="footer-links">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div className="footer-section">
              <h4>Company</h4>
              <ul className="footer-links">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div className="footer-section">
              <h4>Support</h4>
              <ul className="footer-links">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-section contact-info">
              <h4>Contact Us</h4>
              <div className="contact-details">
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <div>
                    <strong>Phone:</strong>
                    <span>+1 (855) MED-PRO-1</span>
                  </div>
                </div>
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <strong>Email:</strong>
                    <span>info@medicalinventorypro.com</span>
                  </div>
                </div>
                <div className="contact-item">
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <strong>Address:</strong>
                    <span>123 Innovation Drive, Suite 100<br />New York, NY 10001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; 2024 Medical Inventory Pro. All rights reserved.</p>
            </div>
            <div className="legal-links">
              {footerLinks.legal.map((link, index) => (
                <Link key={index} to={link.path}>
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="certifications">
              <span className="cert-badge">HIPAA Compliant</span>
              <span className="cert-badge">ISO 27001</span>
              <span className="cert-badge">SOC 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className="back-to-top" 
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <FaArrowUp />
      </button>
    </footer>
  );
};

export default Footer;
