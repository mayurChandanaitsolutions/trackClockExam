import React from 'react';
import { ArrowLeft, Clock, LayoutDashboard, PlusCircle, ClipboardList, User, UserCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HealthBadge } from './HealthBadge';

interface PlaceholderViewProps {
  title: string;
  icon: React.ReactNode;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, icon }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Consistent Header with Desktop Navigation */}
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="user-info-col">
            <span className="welcome-label">Exam Duty Portal</span>
            <h1 className="user-name">{title}</h1>
            <div className="resource-id-pill">
              <UserCheck size={14} />
              <span>Resource ID: 17655</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="desktop-header-nav" aria-label="Desktop Navigation">
            <button
              className={`desktop-nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button
              className={`desktop-nav-btn ${location.pathname === '/add-duty' ? 'active' : ''}`}
              onClick={() => navigate('/add-duty')}
            >
              <PlusCircle size={16} />
              <span>Add Duty</span>
            </button>
            <button
              className={`desktop-nav-btn ${location.pathname === '/my-duties' ? 'active' : ''}`}
              onClick={() => navigate('/my-duties')}
            >
              <ClipboardList size={16} />
              <span>My Duties</span>
            </button>
            <button
              className={`desktop-nav-btn ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              <User size={16} />
              <span>Profile</span>
            </button>
          </nav>

          <div className="header-status-wrap">
            <HealthBadge />
          </div>
        </div>
      </header>

      {/* Main Placeholder Card */}
      <div className="placeholder-container animate-fade-in">
        <div className="placeholder-icon-box">{icon}</div>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-subtitle">
          This module is scheduled for the upcoming development phase.
        </p>
        <div className="placeholder-badge">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            Coming in next step
          </span>
        </div>

        <button
          className="placeholder-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PlaceholderView;
