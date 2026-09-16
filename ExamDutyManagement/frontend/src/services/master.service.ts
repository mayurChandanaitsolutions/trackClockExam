import apiClient from './api';

export interface City {
  id: string;
  name: string;
  state?: string;
}

export interface Center {
  id: string;
  centerCode: string;
  centerName: string;
  cityId: string;
  address?: string;
  city?: City;
}

export interface Exam {
  id: string;
  name: string;
  code?: string;
  type: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
}

export interface Shift {
  id: string;
  name: string;
  defaultReportingTime: string;
  defaultEndTime: string;
}

export interface EmployeeItem {
  id: string;
  resourceId: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  status: string;
  role?: string;
  isAdmin?: boolean;
}

export const masterService = {
  async getCities(): Promise<City[]> {
    const res = await apiClient.get<City[]>('/cities');
    return res.data;
  },

  async getCenters(cityId?: string): Promise<Center[]> {
    const url = cityId ? `/centers?cityId=${encodeURIComponent(cityId)}` : '/centers';
    const res = await apiClient.get<Center[]>(url);
    return res.data;
  },

  async getExams(): Promise<Exam[]> {
    const res = await apiClient.get<Exam[]>('/exams');
    return res.data;
  },

  async getRoles(): Promise<Role[]> {
    const res = await apiClient.get<Role[]>('/roles');
    return res.data;
  },

  async getShifts(): Promise<Shift[]> {
    const res = await apiClient.get<Shift[]>('/shifts');
    return res.data;
  },

  async getEmployees(): Promise<EmployeeItem[]> {
    const res = await apiClient.get<EmployeeItem[]>('/employees');
    return res.data;
  },
};

export default masterService;
