import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { BackendHealthResponse } from '../types/duty.types';

export const checkBackendHealth = async (): Promise<BackendHealthResponse> => {
  // First attempt: direct to configured API_BASE_URL (http://localhost:5000/api/health)
  try {
    const response = await axios.get<BackendHealthResponse>(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    if (response.data && response.data.status === 'ok') {
      return response.data;
    }
  } catch {
    // Second attempt: try proxied route /api/health from Vite dev server
    try {
      const proxyResponse = await axios.get<BackendHealthResponse>('/api/health', {
        timeout: 5000,
      });
      if (proxyResponse.data && proxyResponse.data.status === 'ok') {
        return proxyResponse.data;
      }
    } catch {
      // Both attempts failed
    }
  }

  return {
    status: 'error',
    service: 'exam-duty-management-api',
    database: 'disconnected',
    details: 'Unable to reach backend server at http://localhost:5000/api/health',
  };
};
