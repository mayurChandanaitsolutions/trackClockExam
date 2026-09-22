import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, CalendarPlus, ClipboardList, User, LogOut } from 'lucide-react';
import authService from '../services/auth.service';

export const DesktopSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={19} />,
    },
    ...(isAdmin
      ? [
          {
            id: 'add-employee',
            label: 'Add Employee',
            path: '/add-employee',
            icon: <UserPlus size={19} />,
          },
          {
            id: 'add-duty',
            label: 'Assign Duty to Employee',
            path: '/add-duty',
            icon: <CalendarPlus size={19} />,
          },
          {
            id: 'my-duties',
            label: 'Workforce Duties',
            path: '/my-duties',
            icon: <ClipboardList size={19} />,
          },
        ]
      : [
          {
            id: 'add-duty',
            label: 'Add Duty',
            path: '/add-duty',
            icon: <CalendarPlus size={19} />,
          },
          {
            id: 'my-duties',
            label: 'My Duties',
            path: '/my-duties',
            icon: <ClipboardList size={19} />,
          },
        ]),
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: <User size={19} />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('exam_duty_user');
    sessionStorage.removeItem('exam_duty_user');
    navigate('/login');
  };

  return (
    <aside className="desktop-sidebar">
      {/* Navigation List */}
      <nav className="sidebar-nav-list">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout Item */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <button className="sidebar-nav-item sidebar-logout-btn" onClick={handleLogout}>
          <span className="sidebar-item-icon">
            <LogOut size={19} />
          </span>
          <span className="sidebar-item-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
