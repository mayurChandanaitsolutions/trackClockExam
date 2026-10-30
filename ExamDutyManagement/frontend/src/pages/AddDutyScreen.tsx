import React from 'react';
import authService, { isUserAdmin } from '../services/auth.service';
import { AdminAssignDutyScreen } from './admin/AdminAssignDutyScreen';
import { EmployeeMarkDutyScreen } from './employee/EmployeeMarkDutyScreen';

export const AddDutyScreen: React.FC = () => {
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);

  return isAdmin ? <AdminAssignDutyScreen /> : <EmployeeMarkDutyScreen />;
};

export default AddDutyScreen;
