export type DutyStatus = 'Approved' | 'Pending' | 'Rejected';

export interface Duty {
  id: string;
  exam: string;
  date: string;
  center: string;
  city: string;
  role: string;
  shift: string;
  status: DutyStatus;
}

export interface DutyStats {
  totalDuties: number;
  thisMonth: number;
  exams: number;
  mocks: number;
}

export interface BackendHealthResponse {
  status: 'ok' | 'error';
  service: string;
  database: 'connected' | 'disconnected';
  details?: string;
}

export interface UserProfile {
  name: string;
  resourceId: string;
  mobile: string;
}
