import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Edit3,
  Save,
  Shield,
  MapPin,
} from 'lucide-react';
import { CityMultiSelectDropdown } from './CityMultiSelectDropdown';
import masterService, { EmployeeItem } from '../services/master.service';
import { hasContinuousSequence } from '../utils/validation';

interface EmployeeDetailsModalProps {
  resourceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updated: EmployeeItem) => void;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  resourceId,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editMobile, setEditMobile] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editAadhaar, setEditAadhaar] = useState<string>('');
  const [editPan, setEditPan] = useState<string>('');
  const [editCities, setEditCities] = useState<string[]>(['Mysore']);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Real-time inline warnings for continuous sequences
  const [editMobileWarning, setEditMobileWarning] = useState<string | null>(null);
  const [editAadhaarWarning, setEditAadhaarWarning] = useState<string | null>(null);

  const handleEditMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (hasContinuousSequence(digits, 6)) {
      setEditMobileWarning('Continuous numbers like 123456 are not allowed.');
      return;
    }
    setEditMobileWarning(null);
    setEditMobile(digits);
  };

  const handleEditAadhaarChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    if (hasContinuousSequence(digits, 6)) {
      setEditAadhaarWarning('Continuous numbers like 123456 are not allowed.');
      return;
    }
    setEditAadhaarWarning(null);
    setEditAadhaar(digits);
  };

  useEffect(() => {
    if (!isOpen || !resourceId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSaveSuccess(null);
    setEditMobileWarning(null);
    setEditAadhaarWarning(null);
    setIsEditing(false);

    masterService
      .getEmployeeByResourceId(resourceId)
      .then((emp) => {
        if (!isMounted) return;
        setEmployee(emp);
        setEditName(emp.name || '');
        setEditMobile(emp.mobile || '');
        setEditEmail(emp.email || '');
        setEditAadhaar(emp.aadhaarNumber || '');
        setEditPan(emp.panNumber || '');
        const parsed = emp.city
          ? emp.city.split(',').map((c: string) => c.trim()).filter(Boolean)
          : ['Mysore'];
        setEditCities(parsed.length > 0 ? parsed : ['Mysore']);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err.response?.data?.message || err.message || 'Failed to load employee details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, resourceId]);

  if (!isOpen || !resourceId) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId) return;

    if (!editName.trim()) {
      setError('Member Full Name is mandatory.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(editName.trim())) {
      setError('Member Full Name can only contain letters and spaces (no digits or symbols).');
      return;
    }
    if (!editMobile.trim()) {
      setError('Contact / Mobile Number is mandatory.');
      return;
    }
    if (!/^\d{10}$/.test(editMobile.trim())) {
      setError('Contact / Mobile Number must be exactly 10 digits (numbers only, no letters or symbols).');
      return;
    }
    if (hasContinuousSequence(editMobile.trim(), 6)) {
      setError('Contact / Mobile Number cannot contain continuous sequential numbers like 123456.');
      return;
    }
    if (!editEmail.trim()) {
      setError('Email Address is mandatory.');
      return;
    }
    const emailLower = editEmail.trim().toLowerCase();
    if (!emailLower.endsWith('@gmail.com') || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailLower)) {
      setError('Email Address must be a valid Gmail address ending with @gmail.com (e.g. user@gmail.com).');
      return;
    }
    if (!editAadhaar.trim()) {
      setError('Aadhaar Card Number is mandatory.');
      return;
    }
    if (!/^\d{12}$/.test(editAadhaar.trim())) {
      setError('Aadhaar Card Number must be exactly 12 digits (numbers only, no letters or symbols).');
      return;
    }
    if (hasContinuousSequence(editAadhaar.trim(), 6)) {
      setError('Aadhaar Card Number cannot contain continuous sequential numbers like 123456.');
      return;
    }
    if (!editPan.trim()) {
      setError('PAN Card Number is mandatory.');
      return;
    }
    if (editCities.length === 0) {
      setError('Please select at least one assigned city.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const updated = await masterService.updateEmployee(resourceId, {
        name: editName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim(),
        aadhaarNumber: editAadhaar.trim(),
        panNumber: editPan.trim().toUpperCase(),
        city: editCities.join(', '),
      });

      setEmployee(updated);
      setSaveSuccess('Personal details updated successfully in database!');
      setIsEditing(false);
      if (onUpdated) onUpdated(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const initials = employee?.name
    ? employee.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'EM';

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-content-card animate-fade-in"
        style={{
          maxWidth: '580px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '30px 26px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E2E8F0';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F1F5F9';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <X size={20} />
        </button>

        {/* Center Header: Avatar, Name & Resource ID Pill */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '26px',
              margin: '0 auto 12px',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
            }}
          >
            {initials}
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
            {employee?.name || 'Staff Member'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 700,
              }}
            >
              <Shield size={13} /> Resource ID: {resourceId}
            </span>
            <span
              style={{
                padding: '4px 12px',
                background: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 700,
              }}
            >
              Active Staff
            </span>
          </div>
        </div>

        {/* Alerts / Feedback */}
        {saveSuccess && (
          <div className="alert-banner alert-success" style={{ marginBottom: '16px', padding: '12px 16px', fontSize: '14.5px' }}>
            <CheckCircle2 size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}
        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: '16px', padding: '12px 16px', fontSize: '14.5px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748B' }}>
            <Loader2 size={32} className="animate-spin text-blue" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '14.5px' }}>Loading personal details from MSSQL database...</p>
          </div>
        ) : !employee ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B' }}>
            <p style={{ fontSize: '15px' }}>Employee record not found for Resource ID: {resourceId}.</p>
          </div>
        ) : isEditing ? (
          /* EDIT MODE */
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <Hash size={14} color="#2563EB" />
                  <span>STAFF / RESOURCE ID (LOCKED)</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  value={resourceId}
                  disabled
                  style={{ background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed', marginTop: '4px', fontSize: '15.5px' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <User size={14} color="#2563EB" />
                  <span>MEMBER FULL NAME *</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  placeholder="e.g. Rajesh Sharma"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  onKeyDown={(e) => {
                    if (
                      !/[a-zA-Z\s]/.test(e.key) &&
                      !['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete', ' '].includes(e.key) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
                  required
                  style={{ marginTop: '4px', fontSize: '15.5px' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <Phone size={14} color="#2563EB" />
                  <span>CONTACT / MOBILE NUMBER *</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="form-input-control"
                  placeholder="e.g. 9845281743"
                  value={editMobile}
                  onChange={(e) => handleEditMobileChange(e.target.value)}
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
                  required
                  style={{
                    marginTop: '4px',
                    fontSize: '15.5px',
                    borderColor: editMobileWarning ? '#EF4444' : undefined,
                  }}
                />
                {editMobileWarning && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}
                  >
                    <AlertCircle size={13} />
                    <span>{editMobileWarning}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <Mail size={14} color="#2563EB" />
                  <span>EMAIL ADDRESS *</span>
                </label>
                <input
                  type="email"
                  className="form-input-control"
                  placeholder="e.g. rajesh@gmail.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  style={{ marginTop: '4px', fontSize: '15.5px' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <CreditCard size={14} color="#2563EB" />
                  <span>AADHAAR CARD NUMBER *</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  className="form-input-control"
                  placeholder="e.g. 489278985583"
                  value={editAadhaar}
                  onChange={(e) => handleEditAadhaarChange(e.target.value)}
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
                  required
                  style={{
                    marginTop: '4px',
                    fontSize: '15.5px',
                    borderColor: editAadhaarWarning ? '#EF4444' : undefined,
                  }}
                />
                {editAadhaarWarning && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}
                  >
                    <AlertCircle size={13} />
                    <span>{editAadhaarWarning}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <FileText size={14} color="#2563EB" />
                  <span>PAN CARD NUMBER *</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  value={editPan}
                  onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                  required
                  style={{ marginTop: '4px', textTransform: 'uppercase', fontSize: '15.5px' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700 }}>
                  <MapPin size={14} color="#2563EB" />
                  <span>ASSIGNED CITY * (SELECT MULTIPLE)</span>
                </label>
                <CityMultiSelectDropdown
                  selectedCities={editCities}
                  onChange={setEditCities}
                  className="form-select-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  style={{ padding: '10px 22px', fontSize: '15px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ padding: '10px 26px', fontSize: '15px' }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving to MSSQL...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* VIEW DETAILS MODE (All 6 details centered in a clean grid) */
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '22px',
              }}
            >
              {/* 1. Resource ID */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Hash size={15} color="#2563EB" /> RESOURCE ID
                </span>
                <p style={{ margin: '6px 0 0', fontSize: '17px', fontWeight: 800, color: '#1E293B' }}>
                  {employee.resourceId}
                </p>
              </div>

              {/* 2. Full Name */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={15} color="#2563EB" /> FULL NAME
                </span>
                <p style={{ margin: '6px 0 0', fontSize: '17px', fontWeight: 800, color: '#1E293B' }}>
                  {employee.name}
                </p>
              </div>

              {/* 3. Contact / Mobile */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={15} color="#2563EB" /> CONTACT NUMBER
                </span>
                <p style={{ margin: '6px 0 0', fontSize: '17px', fontWeight: 800, color: '#1E293B' }}>
                  {employee.mobile || '—'}
                </p>
              </div>

              {/* 4. Email Address */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={15} color="#2563EB" /> EMAIL ADDRESS
                </span>
                <p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>
                  {employee.email || '—'}
                </p>
              </div>

              {/* 5. Aadhaar Card Number */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CreditCard size={15} color="#2563EB" /> AADHAAR CARD NUMBER
                </span>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: employee.aadhaarNumber ? '#0F172A' : '#DC2626',
                    fontFamily: 'monospace',
                  }}
                >
                  {employee.aadhaarNumber || 'Not provided'}
                </p>
              </div>

              {/* 6. PAN Card Number */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={15} color="#2563EB" /> PAN CARD NUMBER
                </span>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: employee.panNumber ? '#0F172A' : '#DC2626',
                    fontFamily: 'monospace',
                  }}
                >
                  {employee.panNumber || 'Not provided'}
                </p>
              </div>

              {/* 7. Assigned City */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={15} color="#2563EB" /> ASSIGNED CITY
                </span>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#1E293B',
                  }}
                >
                  {employee.city || 'Mysore'}
                </p>
              </div>
            </div>

            {/* Note if Aadhaar or PAN is missing */}
            {(!employee.aadhaarNumber || !employee.panNumber) && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>Aadhaar Card and PAN Card numbers are mandatory. Click Edit Details below to update them.</span>
              </div>
            )}

            {/* Centered Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
                style={{ padding: '10px 22px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Edit3 size={16} />
                <span>Edit / Update Details</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ padding: '10px 20px', fontSize: '15px' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EmployeeDetailsModal;
