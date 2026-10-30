import React from 'react';
import authService, { isUserAdmin } from '../services/auth.service';
import AdminDashboardScreen from './admin/AdminDashboardScreen';
import EmployeeDashboardScreen from './employee/EmployeeDashboardScreen';

export const DashboardScreen: React.FC = () => {
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);
  return isAdmin ? <AdminDashboardScreen /> : <EmployeeDashboardScreen />;
};

export default DashboardScreen;
