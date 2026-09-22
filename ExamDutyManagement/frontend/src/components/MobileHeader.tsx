import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  UserCheck,
  X,
  Shield,
  LayoutDashboard,
  UserPlus,
  CalendarPlus,
  ClipboardList,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { HealthBadge } from './HealthBadge';
import authService from '../services/auth.service';
import EmployeeDetailsModal from './EmployeeDetailsModal';

export const MobileHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');
  const displayName = user?.name || (isAdmin ? 'Sanjeev Kumar N' : 'Staff Member');
  const resourceId = user?.resourceId || (isAdmin ? '17655' : '---');

  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SK';

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    ...(isAdmin
      ? [
          {
            label: 'Register Workforce',
            path: '/add-employee',
            icon: <UserPlus size={20} />,
          },
          {
            label: 'Assign Duty to Employee',
            path: '/add-duty',
            icon: <CalendarPlus size={20} />,
          },
          {
            label: 'Workforce Assigned Duties',
            path: '/my-duties',
            icon: <ClipboardList size={20} />,
          },
        ]
      : [
          {
            label: 'Add Duty & Attendance',
            path: '/add-duty',
            icon: <CalendarPlus size={20} />,
          },
          {
            label: 'My Examination Duties',
            path: '/my-duties',
            icon: <ClipboardList size={20} />,
          },
        ]),
    {
      label: 'My Profile & Account',
      path: '/profile',
      icon: <User size={20} />,
    },
  ];

  const handleLogout = () => {
    setDrawerOpen(false);
    authService.logout();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="mobile-header-section">
      {/* Top Mobile Bar */}
      <div className="mobile-top-bar">
        <button
          type="button"
          className="mobile-menu-btn"
          title="Open Menu"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Navigation Drawer"
        >
          <Menu size={20} color="#0F172A" strokeWidth={2.2} />
        </button>

        <div className="mobile-top-right">
          <div
            className="user-avatar-circle small"
            onClick={() => setShowDetailsModal(true)}
            style={{ cursor: 'pointer' }}
            title="Click to view details"
          >
            <span>{initials}</span>
          </div>
        </div>
      </div>

      {/* Blue Banner with Welcome & Backend Status */}
      <div className="mobile-blue-banner">
        {/* Row 1: Greeting on left, Backend Status on right (Properly balanced & aligned) */}
        <div className="mobile-banner-header-row">
          <span className="welcome-label">Welcome Back,</span>
          <div className="mobile-banner-badge">
            <HealthBadge />
          </div>
        </div>

        {/* Row 2: Full-width User Name (Never squeezed by badges) */}
        <h1 className="user-name">{displayName}</h1>

        {/* Row 3: Resource ID Pill & Role Badge */}
        <div className="mobile-banner-pills-row">
          <button
            type="button"
            className="resource-id-pill"
            onClick={() => setShowDetailsModal(true)}
            title="Click to view full personal details (Aadhaar, PAN, etc.)"
          >
            <UserCheck size={14} />
            <span>Resource ID: {resourceId}</span>
          </button>
          {isAdmin ? (
            <span className="mobile-role-badge badge-admin">ADMIN</span>
          ) : (
            <span className="mobile-role-badge badge-staff">STAFF</span>
          )}
        </div>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="drawer-header-bar">
              <div className="drawer-brand">
                <div className="drawer-brand-logo">
                  <Shield size={22} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <div>
                  <span className="drawer-app-title">Exam Duty</span>
                  <span className="drawer-app-sub">Management Portal</span>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Card */}
            <div
              className="drawer-user-card"
              onClick={() => {
                setDrawerOpen(false);
                setShowDetailsModal(true);
              }}
              title="Click to view full profile details"
            >
              <div className="drawer-user-avatar">
                <span>{initials}</span>
              </div>
              <div className="drawer-user-info">
                <div className="drawer-user-name">{displayName}</div>
                <div className="drawer-user-role-row">
                  <span className="drawer-id-badge">ID: {resourceId}</span>
                  <span className={`drawer-role-pill ${isAdmin ? 'admin' : 'staff'}`}>
                    {isAdmin ? 'ADMIN' : 'STAFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="drawer-nav-section">
              <span className="drawer-section-label">QUICK NAVIGATION</span>
              <nav className="drawer-nav-list">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate(item.path);
                      }}
                    >
                      <div className="drawer-item-left">
                        <span className="drawer-item-icon">{item.icon}</span>
                        <span className="drawer-item-label">{item.label}</span>
                      </div>
                      <ChevronRight size={16} className="drawer-chevron" />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer with Sign Out */}
            <div className="drawer-footer">
              <button
                type="button"
                className="drawer-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Sign Out Session</span>
              </button>
              <div className="drawer-version-tag">Exam Duty Management • KEA</div>
            </div>
          </aside>
        </div>
      )}

      {/* Employee Personal Details Modal */}
      <EmployeeDetailsModal
        resourceId={resourceId}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default MobileHeader;

