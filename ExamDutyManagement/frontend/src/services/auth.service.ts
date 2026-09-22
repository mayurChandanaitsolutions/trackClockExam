import apiClient from './api';

export interface EmployeeProfile {
  id: string;
  resourceId: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  status: string;
  role?: 'admin' | 'employee';
  isAdmin?: boolean;
  aadhaarNumber?: string;
  panNumber?: string;
  isIdentityVerified?: boolean;
}

export interface LoginResponse {
  status: string;
  message: string;
  employee: EmployeeProfile;
}

const STORAGE_KEY = 'exam_duty_user';

export const authService = {
  async login(
    resourceId: string,
    mobile: string,
    loginType: 'admin' | 'employee' = 'employee',
  ): Promise<EmployeeProfile> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        resourceId: resourceId.trim(),
        mobile: mobile.trim(),
        loginType,
      });
      if (response.data?.employee) {
        const emp = {
          ...response.data.employee,
          role: response.data.employee.role || (loginType === 'admin' ? 'admin' : 'employee'),
          isAdmin: response.data.employee.isAdmin ?? (loginType === 'admin'),
        };
        authService.setStoredUser(emp);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
        return emp;
      }
      throw new Error(response.data?.message || 'Login failed');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to login service';
      throw new Error(errorMsg);
    }
  },

  async getMe(resourceId?: string): Promise<EmployeeProfile> {
    const current = authService.getStoredUser();
    const idToFetch = resourceId || current?.resourceId || '17655';
    const response = await apiClient.get<{ status: string; employee: EmployeeProfile }>(
      `/auth/me?resourceId=${encodeURIComponent(idToFetch)}`
    );
    if (response.data?.employee) {
      authService.setStoredUser(response.data.employee);
      return response.data.employee;
    }
    throw new Error('Employee not found');
  },

  getStoredUser(): EmployeeProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: EmployeeProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default authService;
