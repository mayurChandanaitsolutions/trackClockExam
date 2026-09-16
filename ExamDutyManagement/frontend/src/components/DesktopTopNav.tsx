import React from 'react';
import { Shield, Menu, Bell } from 'lucide-react';
import { HealthBadge } from './HealthBadge';
import authService from '../services/auth.service';

export const DesktopTopNav: React.FC = () => {
  const user = authService.getStoredUser();
  const displayName = user?.name || 'Sanjeev Kumar N';
  const resourceId = user?.resourceId || '17655';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SK';

  return (
    <header className="desktop-top-header">
      {/* Left Branding */}
      <div className="top-nav-left">
        <div className="top-nav-logo-box">
          <Shield size={24} color="#2563EB" strokeWidth={2.4} />
        </div>
        <div className="top-nav-brand-text">
          <h1 className="top-brand-title">Exam Duty Management</h1>
        </div>
        <button className="top-nav-hamburger" title="Toggle Sidebar">
          <Menu size={20} color="#475569" />
        </button>
      </div>

      {/* Right User & System Meta */}
      <div className="top-nav-right">
        {/* Backend Connected Indicator */}
        <HealthBadge />

        {/* Notification Bell */}
        <div className="top-nav-bell-wrapper" title="Notifications">
          <Bell size={20} color="#475569" />
          <span className="bell-red-dot" />
        </div>

        {/* User Profile Pill */}
        <div className="top-nav-user-profile">
          <div className="user-avatar-circle">
            <span>{initials}</span>
          </div>
          <div className="user-text-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="user-display-name">{displayName}</span>
              {user?.isAdmin ? (
                <span
                  style={{
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    background: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FCD34D',
                  }}
                >
                  ADMIN
                </span>
              ) : (
                <span
                  style={{
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  STAFF
                </span>
              )}
            </div>
            <span className="user-resource-id">Resource ID: {resourceId}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DesktopTopNav;
