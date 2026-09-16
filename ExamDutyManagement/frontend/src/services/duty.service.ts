import apiClient from './api';

export interface DutyItem {
  id: string;
  employeeId: string;
  dutyDate: string;
  dutyType: 'Exam' | 'Mock';
  reportingTime?: string;
  shiftEndTime?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  cityId: string;
  centerId: string;
  examId: string;
  roleId: string;
  shiftId: string;
  attendanceFileId?: string;
  createdAt: string;
  employee?: { id: string; resourceId: string; name: string; mobile: string; email?: string; city?: string };
  city?: { id: string; name: string };
  center?: { id: string; centerCode: string; centerName: string; address?: string };
  exam?: { id: string; name: string; type: string; code?: string };
  role?: { id: string; name: string; code: string };
  shift?: { id: string; name: string; defaultReportingTime?: string; defaultEndTime?: string };
  attendanceFile?: { id: string; originalName: string; filePath: string; size?: number };
}

export interface CreateDutyPayload {
  employeeId?: string;
  resourceId?: string;
  employeeName?: string;
  employeeMobile?: string;
  employeeEmail?: string;
  dutyDate: string;
  cityId: string;
  centerId: string;
  dutyType?: string;
  examId: string;
  roleId: string;
  shiftId: string;
  reportingTime?: string;
  shiftEndTime?: string;
  attendanceFileId?: string;
}

export interface UpdateDutyPayload {
  dutyDate?: string;
  cityId?: string;
  centerId?: string;
  dutyType?: string;
  examId?: string;
  roleId?: string;
  shiftId?: string;
  reportingTime?: string;
  shiftEndTime?: string;
  attendanceFileId?: string;
}

export const dutyService = {
  async getMyDuties(
    status?: string,
    search?: string,
    resourceId?: string,
    dutyType?: string,
  ): Promise<DutyItem[]> {
    const params: Record<string, string> = {};
    if (status && status !== 'All') params.status = status;
    if (search && search.trim()) params.search = search.trim();
    if (resourceId) params.resourceId = resourceId;
    if (dutyType && dutyType !== 'All') params.dutyType = dutyType;

    const res = await apiClient.get<{ status: string; count: number; duties: DutyItem[] }>(
      '/duties/my',
      { params }
    );
    return res.data?.duties || [];
  },

  async getDutyById(id: string): Promise<DutyItem> {
    const res = await apiClient.get<{ status: string; duty: DutyItem }>(`/duties/${id}`);
    return res.data.duty;
  },

  async createDuty(payload: CreateDutyPayload): Promise<DutyItem> {
    const res = await apiClient.post<{ status: string; message: string; duty: DutyItem }>(
      '/duties',
      payload
    );
    return res.data.duty;
  },

  async updateDuty(id: string, payload: UpdateDutyPayload): Promise<DutyItem> {
    const res = await apiClient.put<{ status: string; message: string; duty: DutyItem }>(
      `/duties/${id}`,
      payload
    );
    return res.data.duty;
  },

  async deleteDuty(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/duties/${id}`);
    return res.data;
  },
};

export default dutyService;
