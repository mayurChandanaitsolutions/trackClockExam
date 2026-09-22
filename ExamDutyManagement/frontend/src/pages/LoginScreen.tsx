import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Phone, ArrowRight, AlertCircle, ClipboardCheck, Users, Loader2, ShieldCheck } from 'lucide-react';
import authService from '../services/auth.service';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  // Role Mode: 'employee' | 'admin'
  const [loginRole, setLoginRole] = useState<'employee' | 'admin'>('employee');
  const [resourceId, setResourceId] = useState<string>('597299');
  const [mobile, setMobile] = useState<string>('8050162843');
  const [errors, setErrors] = useState<{ resourceId?: string; mobile?: string; server?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const validate = (): boolean => {
    const newErrors: { resourceId?: string; mobile?: string } = {};

    if (!resourceId.trim()) {
      newErrors.resourceId = 'Resource ID is required';
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

    // Client-side quick check for Admin role
    const resUpper = resourceId.trim().toUpperCase();
    const isAdmin =
      resUpper === '17655' ||
      resUpper.includes('ADMIN') ||
      resUpper.includes('CHANDANA');

    if (loginRole === 'admin' && !isAdmin) {
      setErrors({
        server: `Access Denied: Resource ID ${resourceId} does not have Administrator privileges. Only Administrators can sign in here. Please switch to Employee Login.`,
      });
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
          (emp.aadhaarNumber && emp.aadhaarNumber.trim().length >= 10 && emp.panNumber && emp.panNumber.trim().length >= 10) ||
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
              <ShieldCheck size={40} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Shield size={40} color="#FFFFFF" strokeWidth={2.4} />
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
                  setResourceId('597299');
                  setMobile('8050162843');
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
                  setResourceId('17655');
                  setMobile('9876543210');
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
            <p className="login-form-sub">
              {loginRole === 'admin'
                ? 'Administrative access for authorized managers only'
                : 'Sign in with your registered workforce resource ID'}
            </p>
          </div>

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
                  className="clean-input"
                  placeholder="17655"
                  value={resourceId}
                  disabled={loading}
                  onChange={(e) => {
                    setResourceId(e.target.value);
                    if (errors.resourceId || errors.server) {
                      setErrors((prev) => ({ ...prev, resourceId: undefined, server: undefined }));
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
                  maxLength={10}
                  className="clean-input"
                  placeholder="9876543210"
                  value={mobile}
                  disabled={loading}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setMobile(clean);
                    if (errors.mobile || errors.server) {
                      setErrors((prev) => ({ ...prev, mobile: undefined, server: undefined }));
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

            {/* Quick Staff Selection helper */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                {loginRole === 'admin' ? 'TEMPORARY ADMIN CREDENTIAL:' : 'QUICK LOGIN (REGISTERED STAFF):'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {loginRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setResourceId('17655');
                      setMobile('9876543210');
                    }}
                    style={{
                      background: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      color: '#92400E',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    👑 Sanjeev Kumar (17655)
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceId('597299');
                        setMobile('8050162843');
                      }}
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      👤 IFSHA (597299)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceId('597300');
                        setMobile('8073634462');
                      }}
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      👤 Imsha Gaima (597300)
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Bottom Illustrated Section */}
        <div className="login-bottom-illustration">
          <div className="illustration-graphic-badge">
            <div className="clipboard-icon-center">
              <ClipboardCheck size={42} color="#3B82F6" strokeWidth={2.2} />
            </div>
            <Users size={28} color="#93C5FD" className="workforce-icon-bg" />
          </div>
          <p className="illustration-headline">Reliable Workforce for a Better Tomorrow</p>
          <span className="illustration-sub">Official Examination Duty Portal</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
