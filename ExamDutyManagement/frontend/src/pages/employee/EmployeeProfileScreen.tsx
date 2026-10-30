import React, { useEffect, useState } from 'react';
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
  CreditCard,
  FileText,
} from 'lucide-react';
import authService, { EmployeeProfile } from '../../services/auth.service';

export const EmployeeProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = authService.getStoredUser();
        const resId = stored?.resourceId;
        const fetched = await authService.getMe(resId);
        setProfile(fetched);
      } catch {
        const stored = authService.getStoredUser();
        if (stored) setProfile(stored);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    authService.logout();
    sessionStorage.clear();
    localStorage.removeItem('exam_duty_user');
    navigate('/login');
  };

  const storedUser = authService.getStoredUser();
  const displayName = profile?.name || storedUser?.name || 'Staff Member';
  const resourceId = profile?.resourceId || storedUser?.resourceId || '';
  const mobile = profile?.mobile || storedUser?.mobile || '';
  const email = profile?.email || storedUser?.email || '';
  const city = profile?.city || storedUser?.city || 'Karnataka';
  const aadhaarNumber = profile?.aadhaarNumber || storedUser?.aadhaarNumber;
  const panNumber = profile?.panNumber || storedUser?.panNumber;
  const isVerified = Boolean(
    profile?.isIdentityVerified ||
    storedUser?.isIdentityVerified ||
    localStorage.getItem('identity_verified_' + resourceId) === 'true'
  );

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EM';

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
                <User size={24} color="#2563EB" />
              </div>
              <div>
                <h1 className="page-main-heading">Employee Profile</h1>
                <p className="page-sub-heading">Personal Credentials &amp; Verification Status</p>
              </div>
            </div>

            {/* Profile Hero Card */}
            <div className="profile-hero-card">
              <div className="profile-hero-left">
                <div className="profile-avatar-large">
                  <span>{initials}</span>
                </div>
                <div className="profile-hero-names">
                  <h2 className="profile-fullname">{displayName}</h2>
                  <div className="profile-badge-row">
                    <span className="profile-res-pill">
                      <Shield size={14} /> Resource ID: {resourceId}
                    </span>
                    <span className="profile-status-pill active">
                      <CheckCircle2 size={13} /> {profile?.status || 'Active'}
                    </span>
                    {isVerified && (
                      <span className="profile-status-pill active" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                        <CheckCircle2 size={13} /> KYC Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-hero-actions">
                <button
                  type="button"
                  className="profile-desktop-logout-btn"
                  onClick={handleLogout}
                  title="Logout from system"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="profile-details-grid" style={{ gridTemplateColumns: 'minmax(0, 680px)' }}>
              <div className="profile-info-card">
                <h3 className="card-subhead">Personal &amp; Contact Details</h3>
                <div className="info-item-row">
                  <span className="info-label">
                    <Shield size={16} /> Resource ID
                  </span>
                  <span className="info-val bold">{resourceId}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <User size={16} /> Full Name
                  </span>
                  <span className="info-val">{displayName}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <Phone size={16} /> Mobile Number
                  </span>
                  <span className="info-val">{mobile}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <Mail size={16} /> Email Address
                  </span>
                  <span className="info-val">{email || '---'}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <MapPin size={16} /> Assigned City
                  </span>
                  <span className="info-val">{city}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <CreditCard size={16} /> Aadhaar Card Number
                  </span>
                  <span className="info-val">{aadhaarNumber ? `•••• •••• ${aadhaarNumber.slice(-4)}` : 'Verified'}</span>
                </div>
                <div className="info-item-row" style={{ borderBottom: 'none' }}>
                  <span className="info-label">
                    <FileText size={16} /> PAN Card Number
                  </span>
                  <span className="info-val">{panNumber || 'Verified'}</span>
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
            <h2 className="mobile-page-heading">My Profile</h2>
          </div>

          <div className="mobile-profile-card">
            <div className="mobile-avatar-big">
              <span>{initials}</span>
            </div>
            <h3 className="mobile-profile-name">{displayName}</h3>
            <span className="mobile-profile-id">Resource ID: {resourceId}</span>
            <span className="profile-status-pill active" style={{ marginTop: '8px' }}>
              ● {profile?.status || 'Active'}
            </span>

            <div className="mobile-profile-info-list">
              <div className="mobile-info-line">
                <Phone size={16} />
                <span>{mobile}</span>
              </div>
              <div className="mobile-info-line">
                <Mail size={16} />
                <span>{email || '---'}</span>
              </div>
              <div className="mobile-info-line">
                <MapPin size={16} />
                <span>{city}</span>
              </div>
              {panNumber && (
                <div className="mobile-info-line">
                  <FileText size={16} />
                  <span>PAN: {panNumber}</span>
                </div>
              )}
              {aadhaarNumber && (
                <div className="mobile-info-line" style={{ borderBottom: 'none' }}>
                  <CreditCard size={16} />
                  <span>Aadhaar: •••• {aadhaarNumber.slice(-4)}</span>
                </div>
              )}
            </div>

            <div className="mobile-profile-btn-stack" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="mobile-btn-logout"
                onClick={handleLogout}
                title="Logout from system"
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

export default EmployeeProfileScreen;

