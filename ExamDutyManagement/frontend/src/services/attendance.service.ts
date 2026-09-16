import apiClient from './api';

export interface AttendanceUploadResponse {
  status: string;
  message: string;
  file: {
    id: string;
    originalName: string;
    fileName: string;
    filePath: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
}

export const attendanceService = {
  async uploadAttendance(
    file: File,
    employeeId?: string,
  ): Promise<AttendanceUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (employeeId) {
      formData.append('employeeId', employeeId);
    }

    const res = await apiClient.post<AttendanceUploadResponse>(
      '/attendance/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },
};

export default attendanceService;
