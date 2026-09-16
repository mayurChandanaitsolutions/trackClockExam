import React from 'react';
import { Menu, Bell, UserCheck } from 'lucide-react';
import { HealthBadge } from './HealthBadge';
import authService from '../services/auth.service';

export const MobileHeader: React.FC = () => {
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
    <div className="mobile-header-section">
      {/* Top Mobile Bar */}
      <div className="mobile-top-bar">
        <button className="mobile-menu-btn" title="Menu">
          <Menu size={22} color="#0F172A" />
        </button>

        <div className="mobile-top-right">
          <div className="mobile-bell-wrapper">
            <Bell size={20} color="#0F172A" />
            <span className="bell-red-dot" />
          </div>
          <div className="user-avatar-circle small">
            <span>{initials}</span>
          </div>
        </div>
      </div>

      {/* Blue Banner with Welcome & Backend Status */}
      <div className="mobile-blue-banner">
        <div className="mobile-banner-top">
          <div className="mobile-welcome-text">
            <span className="welcome-label">Welcome,</span>
            <h1 className="user-name">{displayName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <div className="resource-id-pill">
                <UserCheck size={13} />
                <span>Resource ID: {resourceId}</span>
              </div>
              {user?.isAdmin && (
                <span
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    borderRadius: '6px',
                    background: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FCD34D',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="mobile-banner-badge">
            <HealthBadge />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
