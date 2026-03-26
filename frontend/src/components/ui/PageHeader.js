import React from 'react';
import './PageHeader.css';

const PageHeader = ({ title, subtitle, actions, icon: Icon }) => {
  return (
    <div className="ui-page-header">
      <div className="ui-page-header-left">
        <h1 className="ui-page-title">
          {Icon ? <Icon className="ui-page-title-icon" /> : null}
          <span>{title}</span>
        </h1>
        {subtitle ? <p className="ui-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-page-header-actions">{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
