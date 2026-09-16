import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach user headers from localStorage
apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('exam_duty_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user?.resourceId) {
        config.headers['x-resource-id'] = user.resourceId;
      }
      if (user?.id) {
        config.headers['x-employee-id'] = user.id;
      }
    } catch (e) {
      console.error('Failed to parse user session', e);
    }
  }
  return config;
});

export default apiClient;
