import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHeartbeat, 
  FaHospital, 
  FaPills, 
  FaUserMd, 
  FaShieldAlt, 
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
  FaStethoscope,
  FaMicroscope,
  FaAmbulance,
  FaPhoneAlt,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram
} from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const medicalServices = [
    {
      icon: <FaStethoscope />,
      title: "Medical Equipment Tracking",
      description: "Real-time monitoring of diagnostic equipment, surgical tools, and medical devices with advanced tracking technology.",
      color: "medical-blue"
    },
    {
      icon: <FaPills />,
      title: "Pharmaceutical Management",
      description: "Comprehensive drug inventory system with expiration tracking, batch management, and regulatory compliance.",
      color: "medical-green"
    },
    {
      icon: <FaMicroscope />,
      title: "Laboratory Supplies",
      description: "Specialized tracking for lab reagents, test kits, and scientific equipment with quality control protocols.",
      color: "medical-purple"
    },
    {
      icon: <FaAmbulance />,
      title: "Emergency Response",
      description: "Critical inventory management for emergency medical supplies and rapid response equipment.",
      color: "medical-red"
    },
    {
      icon: <FaUserMd />,
      title: "Staff Management",
      description: "Healthcare professional credentialing, training records, and compliance documentation.",
      color: "medical-teal"
    },
    {
      icon: <FaShieldAlt />,
      title: "Compliance & Safety",
      description: "HIPAA compliance, safety protocols, and regulatory reporting for healthcare facilities.",
      color: "medical-indigo"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Chief Medical Officer, Metropolitan Medical Center",
      content: "This medical inventory system has transformed our hospital operations. We've reduced medication waste by 45% and improved patient care efficiency significantly.",
      avatar: "SM",
      rating: 5
    },
    {
      name: "James Rodriguez",
      role: "Pharmacy Director, HealthFirst Hospitals",
      content: "The real-time tracking and predictive analytics have revolutionized our pharmaceutical management. Essential for modern healthcare operations.",
      avatar: "JR",
      rating: 5
    },
    {
      name: "Dr. Emily Chen",
      role: "Healthcare Administrator, Regional Medical Network",
      content: "Comprehensive, intuitive, and exceptionally reliable. This platform has become the cornerstone of our medical supply chain management.",
      avatar: "EC",
      rating: 5
    }
  ];

  const medicalStats = [
    { number: "2,500+", label: "Healthcare Facilities" },
    { number: "10M+", label: "Medical Items Tracked" },
    { number: "99.99%", label: "System Reliability" },
    { number: "24/7", label: "Medical Support" }
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`medical-homepage ${isLoaded ? 'loaded' : ''}`}>
      {/* Hero Section */}
      <section className="medical-hero">
        <div className="hero-background">
          <div className="medical-pattern"></div>
          <div className="pulse-overlay"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <FaHeartbeat className="badge-icon" />
              <span>Trusted by Healthcare Professionals</span>
            </div>
            <h1 className="hero-title">
              <FaHospital className="hero-main-icon" />
              Medical Inventory Pro
            </h1>
            <p className="hero-subtitle">
              Advanced Healthcare Supply Chain Management with AI-Powered Analytics and Real-Time Medical Intelligence
            </p>
            <p className="hero-description">
              Transform your healthcare facility with our enterprise-grade, HIPAA-compliant medical inventory solution. 
              Reduce operational costs by 40%, eliminate critical shortages, and enhance patient care through 
              intelligent automation and predictive analytics.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="medical-btn medical-btn-primary">
                <FaHeartbeat />
                Start Medical Trial
                <FaArrowRight />
              </Link>
              <Link to="/about" className="medical-btn medical-btn-secondary">
                <FaStethoscope />
                Medical Demo
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="medical-animation">
              <div className="heartbeat-line"></div>
              <div className="medical-icons">
                <FaPills className="floating-icon pill-icon" />
                <FaStethoscope className="floating-icon steth-icon" />
                <FaMicroscope className="floating-icon scope-icon" />
                <FaHeartbeat className="floating-icon heart-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Stats */}
      <section className="medical-stats">
        <div className="stats-container">
          <div className="stats-grid">
            {medicalStats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-bar"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Services */}
      <section className="medical-services">
        <div className="services-container">
          <div className="section-header">
            <div className="header-badge">
              <FaUserMd />
              <span>Medical Solutions</span>
            </div>
            <h2>Comprehensive Healthcare Inventory Management</h2>
            <p>Advanced medical-grade inventory solutions designed specifically for healthcare facilities</p>
          </div>
          <div className="services-grid">
            {medicalServices.map((service, index) => (
              <div key={index} className={`service-card ${service.color}`}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="service-learn">
                  <Link to="/inventory">Learn More</Link>
                  <FaArrowRight />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Testimonials */}
      <section className="medical-testimonials">
        <div className="testimonials-container">
          <div className="section-header">
            <div className="header-badge">
              <FaCheckCircle />
              <span>Medical Success Stories</span>
            </div>
            <h2>Trusted by Leading Healthcare Professionals</h2>
            <p>Real experiences from medical professionals using our platform</p>
          </div>
          <div className="testimonial-slider">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`testimonial-card ${index === currentTestimonial ? 'active' : ''}`}
              >
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaCheckCircle key={i} className="rating-star" />
                  ))}
                </div>
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Medical CTA */}
      <section className="medical-cta">
        <div className="cta-container">
          <div className="cta-content">
            <div className="cta-badge">
              <FaHospital />
              <span>Healthcare Excellence</span>
            </div>
            <h2>Ready to Transform Your Medical Operations?</h2>
            <p>
              Join over 2,500 healthcare facilities leveraging our platform to enhance efficiency, 
              reduce costs, and improve patient care outcomes with medical-grade inventory management.
            </p>
            <div className="cta-actions">
              <Link to="/login" className="medical-btn medical-btn-primary medical-btn-large">
                <FaHeartbeat />
                Start Medical Trial
              </Link>
              <Link to="/about" className="medical-btn medical-btn-outline medical-btn-large">
                <FaPhoneAlt />
                Schedule Medical Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
