import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container animate-fade-in">
      <div className="splash-ambient-circle animate-pulse-glow" />

      {/* Top spacer */}
      <div />

      {/* Center Branding */}
      <div className="splash-center">
        <div className="splash-logo-box animate-pulse-glow">
          <ShieldCheck size={52} color="#FFFFFF" strokeWidth={2.2} />
        </div>
        <h1 className="splash-title">Exam Duty Management</h1>
        <p className="splash-subtitle">Workforce Attendance & Duty Management</p>
      </div>

      {/* Bottom Loading Indicator */}
      <div className="splash-footer">
        <div className="splash-spinner" />
        <span className="splash-loading-text">Loading application...</span>
      </div>
    </div>
  );
};

export default SplashScreen;
