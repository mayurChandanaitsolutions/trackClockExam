import React from 'react';
import authService, { isUserAdmin } from '../services/auth.service';
import { AdminWorkforceDutiesScreen } from './admin/AdminWorkforceDutiesScreen';
import { EmployeeMyDutiesScreen } from './employee/EmployeeMyDutiesScreen';

export const MyDutiesScreen: React.FC = () => {
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);

  return isAdmin ? <AdminWorkforceDutiesScreen /> : <EmployeeMyDutiesScreen />;
};

export default MyDutiesScreen;
