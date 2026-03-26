import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './PublicPage.css';

const PublicPage = ({ title, subtitle }) => {
  const location = useLocation();
  const params = useParams();

  const computedTitle = title || (params.slug ? params.slug.replace(/-/g, ' ') : 'Page');
  const computedSubtitle = subtitle || `This page is available at ${location.pathname}`;

  return (
    <div className="public-page">
      <div className="public-page-inner">
        <h1 className="public-page-title">{computedTitle}</h1>
        <p className="public-page-subtitle">{computedSubtitle}</p>

        <div className="public-page-actions">
          <Link to="/" className="public-page-btn public-page-btn-primary">Back to Home</Link>
          <Link to="/login" className="public-page-btn public-page-btn-secondary">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicPage;
