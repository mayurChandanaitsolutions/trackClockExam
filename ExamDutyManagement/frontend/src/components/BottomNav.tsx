import React from 'react';
import { LayoutDashboard, PlusCircle, ClipboardList, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import authService from '../services/auth.service';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: 'add-duty',
      label: isAdmin ? 'Add Staff' : 'Add Duty',
      path: '/add-duty',
      icon: <PlusCircle size={20} />,
    },
    {
      id: 'my-duties',
      label: isAdmin ? 'Workforce' : 'My Duties',
      path: '/my-duties',
      icon: <ClipboardList size={20} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: <User size={20} />,
    },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="nav-item-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
