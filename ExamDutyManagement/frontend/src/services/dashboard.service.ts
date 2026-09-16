import apiClient from './api';

export interface DashboardStats {
  totalDuties: number;
  systemTotalDuties?: number;
  systemEmployeesCount?: number;
  thisMonth: number;
  exams: number;
  mocks: number;
}

export interface MonthlyOverviewItem {
  month: string;
  exams: number;
  mocks: number;
  total: number;
  isCurrent?: boolean;
}

export interface RecentDutySummary {
  num: number;
  id: string;
  exam: string;
  date: string;
  center: string;
  city: string;
  role: string;
  shift: string;
  status: 'Approved' | 'Pending' | 'Rejected' | string;
  reportingTime?: string;
  shiftEndTime?: string;
  employeeName?: string;
  resourceId?: string;
}

export interface EmployeeDashboardData {
  status: string;
  employee: {
    id: string;
    resourceId: string;
    name: string;
    email?: string;
    city?: string;
    status: string;
  };
  stats: DashboardStats;
  monthlyOverview: MonthlyOverviewItem[];
  recentDuties: RecentDutySummary[];
}

export const dashboardService = {
  async getEmployeeDashboard(resourceId?: string): Promise<EmployeeDashboardData> {
    const params = resourceId ? { resourceId } : undefined;
    const res = await apiClient.get<EmployeeDashboardData>('/dashboard/employee', {
      params,
    });
    return res.data;
  },
};

export default dashboardService;
