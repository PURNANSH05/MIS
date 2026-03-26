import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaHeartbeat, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import './About.css';

const About = () => {
  const highlights = [
    {
      title: 'Healthcare-first Design',
      description: 'Built specifically for hospitals, clinics, and pharmacies with medical-grade UX patterns.',
      icon: FaHeartbeat,
    },
    {
      title: 'Compliance & Auditability',
      description: 'Structured workflows and traceability to support strong compliance practices.',
      icon: FaShieldAlt,
    },
    {
      title: 'Operational Intelligence',
      description: 'Clear dashboards and reporting that help reduce waste and stockouts.',
      icon: FaChartLine,
    },
    {
      title: 'Reliable Inventory Control',
      description: 'Designed to keep critical items available and expiry risks visible.',
      icon: FaCheckCircle,
    },
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1 className="about-title">About Medical Inventory Pro</h1>
          <p className="about-subtitle">
            Medical Inventory Pro is a professional inventory management interface designed for modern healthcare environments.
            It focuses on clarity, speed, and safety so your teams can manage supplies with confidence.
          </p>
          <div className="about-actions">
            <Link to="/login" className="about-btn about-btn-primary">Login</Link>
            <Link to="/pricing" className="about-btn about-btn-secondary">View Pricing</Link>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <h2 className="about-section-title">What we help you achieve</h2>
          <div className="about-grid">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="about-card">
                  <div className="about-card-icon">
                    <Icon />
                  </div>
                  <div className="about-card-title">{h.title}</div>
                  <div className="about-card-desc">{h.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-section about-section-muted">
        <div className="about-container">
          <h2 className="about-section-title">Our approach</h2>
          <div className="about-two-col">
            <div className="about-panel">
              <div className="about-panel-title">Patient safety mindset</div>
              <div className="about-panel-text">
                Inventory decisions impact care delivery. We design screens and interactions that reduce cognitive load,
                highlight exceptions, and keep critical information visible.
              </div>
            </div>
            <div className="about-panel">
              <div className="about-panel-title">Operational simplicity</div>
              <div className="about-panel-text">
                Clean navigation, predictable layouts, and consistent typography ensure teams can work fast with minimal training.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
