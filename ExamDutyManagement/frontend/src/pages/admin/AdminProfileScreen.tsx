import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../../components/DesktopTopNav';
import { DesktopSidebar } from '../../components/DesktopSidebar';
import { MobileHeader } from '../../components/MobileHeader';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  CheckCircle2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import authService from '../../services/auth.service';

export const AdminProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();

  const displayName = 'Mohan';
  const resourceId = '5914';
  const mobile = user?.mobile || '9876543210';
  const email = 'mohan@gmail.com';
  const city = 'Mysuru';

  const handleLogout = () => {
    authService.logout();
    sessionStorage.clear();
    localStorage.removeItem('exam_duty_user');
    navigate('/login');
  };

  return (
    <div className="unified-dashboard-root animate-fade-in">
      {/* 1. Desktop View */}
      <div className="desktop-layout-wrapper">
        <DesktopTopNav />
        <div className="desktop-main-row">
          <DesktopSidebar />

          <main className="desktop-content-panel">
            <div className="page-section-header">
              <div className="page-header-icon-box">
                <ShieldCheck size={24} color="#2563EB" />
              </div>
              <div>
                <h1 className="page-main-heading">Admin Profile</h1>
                <p className="page-sub-heading">System Administrator Account &amp; Access Controls</p>
              </div>
            </div>

            {/* Profile Hero Card */}
            <div className="profile-hero-card">
              <div className="profile-hero-left">
                <div className="profile-avatar-large">
                  <span>M</span>
                </div>
                <div className="profile-hero-names">
                  <h2 className="profile-fullname">{displayName}</h2>
                  <div className="profile-badge-row">
                    <span className="profile-res-pill">
                      <Shield size={14} /> Resource ID: {resourceId}
                    </span>
                    <span className="profile-status-pill active">
                      <CheckCircle2 size={13} /> Super Administrator
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-hero-actions">
                <button
                  type="button"
                  className="profile-desktop-logout-btn"
                  onClick={handleLogout}
                  title="Logout from admin account"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Admin Details Grid */}
            <div className="profile-details-grid" style={{ gridTemplateColumns: 'minmax(0, 680px)' }}>
              <div className="profile-info-card">
                <h3 className="card-subhead">Administrator Details</h3>
                <div className="info-item-row">
                  <span className="info-label">
                    <Shield size={16} /> System Role
                  </span>
                  <span className="info-val bold" style={{ color: '#2563EB' }}>Super Administrator</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <User size={16} /> Admin Name
                  </span>
                  <span className="info-val bold">{displayName}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <Shield size={16} /> Resource ID
                  </span>
                  <span className="info-val">{resourceId}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <Phone size={16} /> Mobile Number
                  </span>
                  <span className="info-val">{mobile}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <Mail size={16} /> Official Email
                  </span>
                  <span className="info-val">{email}</span>
                </div>
                <div className="info-item-row" style={{ borderBottom: 'none' }}>
                  <span className="info-label">
                    <MapPin size={16} /> Base Location
                  </span>
                  <span className="info-val">{city}</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* 2. Mobile View */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />

        <main className="mobile-content-body">
          <div className="mobile-page-title-row">
            <h2 className="mobile-page-heading">Admin Profile</h2>
          </div>

          <div className="mobile-profile-card">
            <div className="mobile-avatar-big">
              <span>M</span>
            </div>
            <h3 className="mobile-profile-name">{displayName}</h3>
            <span className="mobile-profile-id">Resource ID: {resourceId}</span>
            <span className="profile-status-pill active" style={{ marginTop: '8px' }}>
              ● Super Administrator
            </span>

            <div className="mobile-profile-info-list">
              <div className="mobile-info-line">
                <Phone size={16} />
                <span>{mobile}</span>
              </div>
              <div className="mobile-info-line">
                <Mail size={16} />
                <span>{email}</span>
              </div>
              <div className="mobile-info-line" style={{ borderBottom: 'none' }}>
                <MapPin size={16} />
                <span>{city}</span>
              </div>
            </div>

            <div className="mobile-profile-btn-stack" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="mobile-btn-logout"
                onClick={handleLogout}
                title="Logout from admin account"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfileScreen;

