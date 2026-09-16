import React, { useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/health.service';
import { BackendHealthResponse } from '../types/duty.types';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHealth = async () => {
    try {
      const data = await checkBackendHealth();
      setHealth(data);
    } catch {
      setHealth({
        status: 'error',
        service: 'exam-duty-management-api',
        database: 'disconnected',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = health?.status === 'ok' && health?.database === 'connected';

  return (
    <div
      className={`health-badge ${isConnected ? 'badge-connected' : 'badge-offline'}`}
      title={
        isConnected
          ? 'Backend and Database Connected'
          : health?.details || 'Backend Offline'
      }
    >
      <span className={`health-dot ${isConnected ? 'connected' : 'offline'}`} />
      <span>
        {isConnected
          ? 'Backend Connected'
          : loading
          ? 'Connecting...'
          : 'Backend Offline'}
      </span>
    </div>
  );
};

export default HealthBadge;
