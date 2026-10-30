import React from 'react';
import authService, { isUserAdmin } from '../services/auth.service';
import AdminProfileScreen from './admin/AdminProfileScreen';
import EmployeeProfileScreen from './employee/EmployeeProfileScreen';

export const ProfileScreen: React.FC = () => {
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);
  return isAdmin ? <AdminProfileScreen /> : <EmployeeProfileScreen />;
};

export default ProfileScreen;
