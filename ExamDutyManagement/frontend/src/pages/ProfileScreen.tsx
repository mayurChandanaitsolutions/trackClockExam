import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  HelpCircle,
  CheckCircle2,
  CalendarCheck,
  Building,
  Headphones,
  ExternalLink,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import authService, { EmployeeProfile } from '../services/auth.service';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Help modal
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

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
    navigate('/login');
  };

  const displayName = profile?.name || 'Sanjeev Kumar N';
  const resourceId = profile?.resourceId || '17655';
  const mobile = profile?.mobile || '9876543210';
  const email = profile?.email || 'sanjeev.kumar@examduty.gov.in';
  const city = profile?.city || 'Bengaluru';
  const aadhaarNumber = profile?.aadhaarNumber;
  const panNumber = profile?.panNumber;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SK';

  return (
    <div className="unified-dashboard-root animate-fade-in">
      {/* 1. DESKTOP VIEW */}
      <div className="desktop-layout-wrapper">
        <DesktopTopNav />
        <div className="desktop-main-row">
          <DesktopSidebar />

          <main className="desktop-content-panel">
            {/* Page Title */}
            <div className="page-section-header">
              <div className="page-header-icon-box">
                <User size={24} color="#2563EB" />
              </div>
              <div>
                <h1 className="page-main-heading">Employee Profile</h1>
                <p className="page-sub-heading">
                  Manage your workforce credentials, personal information, and portal preferences
                </p>
              </div>
            </div>

            {/* Profile Card */}
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
                  </div>
                </div>
              </div>

            </div>

            {/* Profile Info Grid */}
            <div className="profile-details-grid">
              <div className="profile-info-card">
                <h3 className="card-subhead">Workforce Details</h3>
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
                    <Mail size={16} /> Official Email
                  </span>
                  <span className="info-val">{email}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <MapPin size={16} /> Base City
                  </span>
                  <span className="info-val">{city}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <ShieldCheck size={16} /> Aadhaar Card
                  </span>
                  <span className="info-val bold" style={{ color: '#047857' }}>
                    {aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.replace(/\s+/g, '').slice(-4)}` : 'Verified on Portal'}
                  </span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">
                    <CreditCard size={16} /> PAN Card
                  </span>
                  <span className="info-val bold" style={{ color: '#0369A1' }}>
                    {panNumber || 'Verified on Portal'}
                  </span>
                </div>
              </div>

              <div className="profile-info-card">
                <h3 className="card-subhead">System &amp; Quick Actions</h3>
                <div className="quick-action-list">
                  <button
                    className="quick-action-row"
                    onClick={() => setShowHelpModal(true)}
                  >
                    <div className="action-row-left">
                      <div className="action-row-icon green">
                        <HelpCircle size={18} />
                      </div>
                      <div>
                        <span className="action-row-title">Help &amp; Support</span>
                        <span className="action-row-sub">Exam cell contacts &amp; guidelines</span>
                      </div>
                    </div>
                    <ExternalLink size={15} color="#94A3B8" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW */}
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
                <span>{email}</span>
              </div>
              <div className="mobile-info-line">
                <MapPin size={16} />
                <span>{city}</span>
              </div>
              <div className="mobile-info-line">
                <ShieldCheck size={16} />
                <span>Aadhaar: {aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.replace(/\s+/g, '').slice(-4)}` : 'Verified'}</span>
              </div>
              <div className="mobile-info-line">
                <CreditCard size={16} />
                <span>PAN: {panNumber || 'Verified'}</span>
              </div>
            </div>

            <div className="mobile-profile-btn-stack">
              <button
                className="mobile-btn-outline"
                onClick={() => setShowHelpModal(true)}
              >
                <HelpCircle size={16} />
                <span>Help &amp; Support</span>
              </button>
            </div>
          </div>
        </main>
      </div>


      {/* HELP & SUPPORT MODAL */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Help &amp; Examination Support</h3>
              <button className="modal-close-btn" onClick={() => setShowHelpModal(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body-details">
              <div className="help-box-item">
                <Headphones size={20} color="#2563EB" />
                <div>
                  <span className="help-box-title">Examination Control Room Helpdesk</span>
                  <span className="help-box-val">+91 (080) 2296-1000 / 1800-425-0011</span>
                  <span className="help-box-desc">Available 24x7 during examination schedules</span>
                </div>
              </div>

              <div className="help-box-item">
                <Mail size={20} color="#2563EB" />
                <div>
                  <span className="help-box-title">Official Support Email</span>
                  <span className="help-box-val">support.examduty@karnataka.gov.in</span>
                  <span className="help-box-desc">For attendance proofs and duty verification inquiries</span>
                </div>
              </div>

              <div className="help-box-item">
                <Building size={20} color="#2563EB" />
                <div>
                  <span className="help-box-title">Duty Assignment Guidelines</span>
                  <span className="help-box-desc">
                    All duties must have attendance uploaded within 48 hours of shift completion for approval.
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer-row">
              <button className="btn-primary" onClick={() => setShowHelpModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
