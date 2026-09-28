import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Phone, ArrowRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import authService from '../services/auth.service';
import { hasContinuousSequence } from '../utils/validation';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  // Role Mode: 'employee' | 'admin'
  const [loginRole, setLoginRole] = useState<'employee' | 'admin'>('employee');
  const [resourceId, setResourceId] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [errors, setErrors] = useState<{ resourceId?: string; mobile?: string; server?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleResourceIdChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (hasContinuousSequence(digits, 5)) {
      setErrors((prev) => ({
        ...prev,
        resourceId: 'Continuous numbers like 12345 are not allowed.',
        server: undefined,
      }));
      return;
    }
    setResourceId(digits);
    if (errors.resourceId || errors.server) {
      setErrors((prev) => ({ ...prev, resourceId: undefined, server: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { resourceId?: string; mobile?: string } = {};

    if (!resourceId.trim()) {
      newErrors.resourceId = 'Resource ID is required';
    } else if (!/^\d+$/.test(resourceId.trim())) {
      newErrors.resourceId = 'Resource ID must contain numbers only';
    } else if (hasContinuousSequence(resourceId.trim(), 5)) {
      newErrors.resourceId = 'Continuous numbers like 12345 are not allowed';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, server: undefined }));

    try {
      // Connect to backend REST API (POST /api/auth/login) with loginType
      const emp = await authService.login(resourceId.trim(), mobile.trim(), loginRole);
      sessionStorage.setItem('exam_duty_user', JSON.stringify(emp));

      if (loginRole === 'admin' || emp.isAdmin) {
        // Admin portal: directly open dashboard
        navigate('/dashboard');
      } else {
        // Employee portal: check verification status directly from backend response!
        const isVerified = Boolean(
          emp.isIdentityVerified ||
          (emp.aadhaarNumber && emp.aadhaarNumber.trim().length >= 10 && emp.panNumber && emp.panNumber.trim().length >= 8) ||
          localStorage.getItem('identity_verified_' + emp.resourceId) === 'true'
        );

        if (isVerified) {
          // Already verified in database: open dashboard directly!
          navigate('/dashboard');
        } else {
          // First time employee: show Aadhaar and PAN verification before starting duty
          navigate('/verify-identity');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setErrors((prev) => ({ ...prev, server: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-phone-frame">
        {/* Top Wave Header */}
        <div className="login-top-hero">
          <div className="hero-shield-box">
            {loginRole === 'admin' ? (
              <ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Shield size={30} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </div>
          <h1 className="hero-app-title">Exam Duty Management</h1>
          <p className="hero-app-subtitle">Workforce Attendance &amp; Duty Management</p>

          {/* Smooth curved bottom wave */}
          <div className="hero-wave-svg">
            <svg viewBox="0 0 500 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path
                d="M0,0 C150,55 350,55 500,0 L500,60 L0,60 Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="login-card-container">
          {/* Admin vs Employee Buttons (Before Resource ID & Mobile Number) */}
          <div className="login-role-switch-container">
            <div className="login-role-switch">
              <button
                type="button"
                className={`login-role-btn ${loginRole === 'employee' ? 'active' : ''}`}
                onClick={() => {
                  setLoginRole('employee');
                  setErrors({});
                  setResourceId('');
                  setMobile('');
                }}
              >
                <User size={16} />
                <span>Employee</span>
              </button>
              <button
                type="button"
                className={`login-role-btn ${loginRole === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setLoginRole('admin');
                  setErrors({});
                  setResourceId('');
                  setMobile('');
                }}
              >
                <ShieldCheck size={16} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="login-header-group">
            <h2 className="login-form-title">
              {loginRole === 'admin' ? 'Admin Portal Login' : 'Employee Login'}
            </h2>
          </div>

          {loginRole === 'admin' && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                fontSize: '13.5px',
                color: '#166534',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span>Admin Credentials:</span>
                </div>
                <div style={{ marginTop: '3px', color: '#15803D' }}>
                  <span>Resource ID: <strong>17655</strong></span>
                  <span style={{ margin: '0 8px' }}>•</span>
                  <span>Mobile: <strong>9876543210</strong></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResourceId('17655');
                  setMobile('9876543210');
                  setErrors({});
                }}
                style={{
                  background: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                Auto Fill
              </button>
            </div>
          )}

          {errors.server && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#DC2626',
              fontSize: '14.5px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errors.server}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Resource ID */}
            <div className="form-group-item">
              <label className="input-title-label" htmlFor="resourceId">
                RESOURCE ID
              </label>
              <div className={`reference-input-box ${errors.resourceId ? 'input-error' : ''}`}>
                <User size={18} className="input-leading-icon" />
                <input
                  id="resourceId"
                  type="text"
                  inputMode="numeric"
                  className="clean-input"
                  placeholder="Enter Resource ID"
                  value={resourceId}
                  disabled={loading}
                  onChange={(e) => handleResourceIdChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      !['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              {errors.resourceId && (
                <span className="field-error-msg">
                  <AlertCircle size={14} />
                  {errors.resourceId}
                </span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="form-group-item">
              <label className="input-title-label" htmlFor="mobile">
                MOBILE NUMBER
              </label>
              <div className={`reference-input-box ${errors.mobile ? 'input-error' : ''}`}>
                <Phone size={18} className="input-leading-icon" />
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="clean-input"
                  placeholder="Enter 10-digit Mobile Number"
                  value={mobile}
                  disabled={loading}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setMobile(clean);
                    if (errors.mobile || errors.server) {
                      setErrors((prev) => ({ ...prev, mobile: undefined, server: undefined }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      !['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              {errors.mobile && (
                <span className="field-error-msg">
                  <AlertCircle size={14} />
                  {errors.mobile}
                </span>
              )}
            </div>

            {/* Login Button */}
            <button type="submit" className="reference-login-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
