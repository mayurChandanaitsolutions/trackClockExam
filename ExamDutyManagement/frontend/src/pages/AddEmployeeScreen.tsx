import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import { EmployeeDetailsModal } from '../components/EmployeeDetailsModal';
import { BulkUploadEmployeeModal } from '../components/BulkUploadEmployeeModal';
import { ExportEmployeesCard } from '../components/ExportEmployeesCard';
import { CityMultiSelectDropdown } from '../components/CityMultiSelectDropdown';
import { SweetAlertToast } from '../components/SweetAlertToast';
import {
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Mail,
  Hash,
  ArrowRight,
  Upload,
  CreditCard,
  FileText,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import masterService, { EmployeeItem } from '../services/master.service';
import authService, { isUserAdmin } from '../services/auth.service';
import { hasContinuousSequence } from '../utils/validation';

export const AddEmployeeScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);

  // Form State (All fields)
  const [resourceId, setResourceId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Mysore']);

  // Real-time inline warnings for continuous sequences
  const [mobileWarning, setMobileWarning] = useState<string | null>(null);
  const [aadhaarWarning, setAadhaarWarning] = useState<string | null>(null);

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (hasContinuousSequence(digits, 6)) {
      setMobileWarning('Continuous numbers like 123456 are not allowed.');
      return;
    }
    setMobileWarning(null);
    setMobile(digits);
  };

  const handleAadhaarChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    if (hasContinuousSequence(digits, 6)) {
      setAadhaarWarning('Continuous numbers like 123456 are not allowed.');
      return;
    }
    setAadhaarWarning(null);
    setAadhaarNumber(digits);
  };

  // Modal State for viewing/editing details
  const [selectedModalResourceId, setSelectedModalResourceId] = useState<string | null>(null);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Deletion confirmation modal state
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedSuccessInfo, setDeletedSuccessInfo] = useState<{ name: string; resourceId: string } | null>(null);

  // Registered Employees List for Admin reference
  const [registeredEmployees, setRegisteredEmployees] = useState<EmployeeItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [createdEmp, setCreatedEmp] = useState<{ id: string; resourceId: string; name: string } | null>(null);
  const [lastRegistered, setLastRegistered] = useState<EmployeeItem | null>(null);

  // Load existing employees
  const loadEmployees = async () => {
    setLoadingList(true);
    try {
      const emps = await masterService.getEmployees();
      // Exclude temporary admin Sanjeev Kumar (17655) and admin account
      const realStaff = emps.filter((e) => e.resourceId !== '17655' && e.resourceId?.toLowerCase() !== 'admin' && !e.isAdmin);
      setRegisteredEmployees(realStaff.length > 0 ? realStaff : emps);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadEmployees();
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!resourceId.trim()) {
      setSubmitError('Please enter a Staff / Resource ID.');
      return;
    }
    if (!name.trim()) {
      setSubmitError('Please enter Member Full Name.');
      return;
    }
    if (!mobile.trim()) {
      setSubmitError('Please enter a Contact / Mobile Number.');
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      setSubmitError('Contact / Mobile Number must be exactly 10 digits.');
      return;
    }
    if (hasContinuousSequence(mobile.trim(), 6)) {
      setSubmitError('Contact / Mobile Number cannot contain continuous sequential numbers like 123456.');
      return;
    }
    if (!email.trim()) {
      setSubmitError('Please enter an Email Address.');
      return;
    }
    if (!aadhaarNumber.trim()) {
      setSubmitError('Please enter Aadhaar Card Number.');
      return;
    }
    if (!/^\d{12}$/.test(aadhaarNumber.trim())) {
      setSubmitError('Aadhaar Card Number must be exactly 12 digits.');
      return;
    }
    if (hasContinuousSequence(aadhaarNumber.trim(), 6)) {
      setSubmitError('Aadhaar Card Number cannot contain continuous sequential numbers like 123456.');
      return;
    }
    if (!panNumber.trim()) {
      setSubmitError('Please enter PAN Card Number.');
      return;
    }

    if (selectedCities.length === 0) {
      setSubmitError('Please select at least one assigned city.');
      return;
    }

    setSubmitting(true);
    try {
      const newEmp = await masterService.createEmployee({
        resourceId: resourceId.trim(),
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        city: selectedCities.join(', '),
      });

      setCreatedEmp({
        id: newEmp.id,
        resourceId: newEmp.resourceId,
        name: newEmp.name,
      });
      setLastRegistered(newEmp);
      setSubmitSuccess(`Employee "${newEmp.name}" (ID: ${newEmp.resourceId}) registered successfully! Details displayed below.`);
      setToastMessage(`Employee "${newEmp.name}" registered successfully.`);

      // Immediately display new employee at the very top of the table below
      setRegisteredEmployees((prev) => [newEmp, ...prev.filter((e) => e.resourceId !== newEmp.resourceId)]);
      setCurrentPage(1);

      // Clear input fields
      setResourceId('');
      setName('');
      setMobile('');
      setEmail('');
      setAadhaarNumber('');
      setPanNumber('');
      setMobileWarning(null);
      setAadhaarWarning(null);
      setSelectedCities(['Mysore']);

      // Refresh list from database
      loadEmployees();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to register employee. Please check details and try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    setDeleting(true);
    setDeleteError(null);
    const info = { name: deletingEmployee.name, resourceId: deletingEmployee.resourceId };
    try {
      await masterService.deleteEmployee(deletingEmployee.resourceId);
      setDeletingEmployee(null);
      setDeletedSuccessInfo(info);
      setSubmitSuccess(`Employee "${info.name}" (ID: ${info.resourceId}) deleted successfully.`);
      setToastMessage(`Selected employee "${info.name}" deleted successfully.`);
      loadEmployees();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete employee.');
    } finally {
      setDeleting(false);
    }
  };

  // TrackClock HR Pagination State (15 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Total pages based on all registered employees
  const totalPages = Math.max(1, Math.ceil(registeredEmployees.length / pageSize));

  // Keep currentPage within bounds if list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Paginated employees for current page
  const displayedEmployees = registeredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="unified-dashboard-root animate-fade-in">
      {/* 1. DESKTOP VIEW */}
      <div className="desktop-layout-wrapper">
        <DesktopTopNav />
        <div className="desktop-main-row">
          <DesktopSidebar />

          <main className="desktop-content-panel">
            {/* Page Header */}
            <div className="page-section-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="page-header-icon-box">
                  <UserPlus size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">Add New Employee</h1>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowBulkModal(true)}
                style={{
                  padding: '10px 18px',
                  fontSize: '15px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Upload size={16} />
                <span>Bulk Upload Employee</span>
              </button>
            </div>

            {/* Notification Banners */}
            {submitSuccess && (
              <div className="alert-banner alert-success">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>{submitSuccess}</span>
                </div>
              </div>
            )}
            {submitError && (
              <div className="alert-banner alert-error">
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Personal Details Form Card */}
            <div className="duty-form-card" style={{ marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} color="#2563EB" />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>
                    Personal Information
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="add-employee-form-grid">
                  {/* 1. Staff / Resource ID */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <Hash size={15} color="#2563EB" />
                      <span>STAFF / RESOURCE ID *</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-input-control"
                      placeholder="e.g. 597305"
                      value={resourceId}
                      onChange={(e) => setResourceId(e.target.value.replace(/\D/g, ''))}
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
                    />
                  </div>

                  {/* 2. Member Full Name */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <User size={15} color="#2563EB" />
                      <span>MEMBER FULL NAME *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. Rajesh Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
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
                    />
                  </div>

                  {/* 3. Contact Number */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <Phone size={15} color="#2563EB" />
                      <span>CONTACT / MOBILE NUMBER *</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className="form-input-control"
                      placeholder="e.g. 9845281743"
                      value={mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
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
                        borderColor: mobileWarning ? '#EF4444' : undefined,
                      }}
                    />
                    {mobileWarning && (
                      <span className="field-validation-msg">
                        <AlertCircle size={13} />
                        <span>{mobileWarning}</span>
                      </span>
                    )}
                  </div>

                  {/* 4. Email Address */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <Mail size={15} color="#2563EB" />
                      <span>EMAIL ADDRESS *</span>
                    </label>
                    <input
                      type="email"
                      className="form-input-control"
                      placeholder="e.g. rajesh@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* 5. Assigned City (Multi-Select with Checkboxes) */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <MapPin size={15} color="#2563EB" />
                      <span>ASSIGNED CITY * (SELECT MULTIPLE)</span>
                    </label>
                    <CityMultiSelectDropdown
                      selectedCities={selectedCities}
                      onChange={setSelectedCities}
                      className="form-select-control"
                    />
                  </div>

                  {/* 6. Aadhaar Card Number */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <CreditCard size={15} color="#2563EB" />
                      <span>AADHAAR CARD NUMBER *</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      className="form-input-control"
                      placeholder="e.g. 489278985583"
                      value={aadhaarNumber}
                      onChange={(e) => handleAadhaarChange(e.target.value)}
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
                        borderColor: aadhaarWarning ? '#EF4444' : undefined,
                      }}
                    />
                    {aadhaarWarning && (
                      <span className="field-validation-msg">
                        <AlertCircle size={13} />
                        <span>{aadhaarWarning}</span>
                      </span>
                    )}
                  </div>

                  {/* 7. PAN Card Number */}
                  <div className="employee-field-wrapper">
                    <label className="employee-field-label">
                      <FileText size={15} color="#2563EB" />
                      <span>PAN CARD NUMBER *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Registering Employee...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Save &amp; Register Employee</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Newly Registered Employee Details Card (Directly Below Form) */}
            {lastRegistered && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  marginBottom: '22px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    borderBottom: '1px solid #DCFCE7',
                    paddingBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D' }}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>
                      Newly Registered Employee Details
                    </span>
                  </div>
                  <span
                    style={{
                      background: '#16A34A',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '12px',
                      letterSpacing: '0.4px',
                    }}
                  >
                    SAVED &amp; REGISTERED
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '12px',
                    background: '#FFFFFF',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #BBF7D0',
                    fontSize: '13.5px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      STAFF / RESOURCE ID
                    </span>
                    <strong style={{ color: '#2563EB', fontSize: '15px' }}>{lastRegistered.resourceId}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      MEMBER FULL NAME
                    </span>
                    <strong style={{ color: '#1E293B', fontSize: '14.5px' }}>{lastRegistered.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      CONTACT / MOBILE NUMBER
                    </span>
                    <strong style={{ color: '#1E293B' }}>{lastRegistered.mobile}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      EMAIL ADDRESS
                    </span>
                    <strong style={{ color: '#1E293B' }}>{lastRegistered.email || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      ASSIGNED CITY
                    </span>
                    <strong style={{ color: '#0F766E' }}>{lastRegistered.city || 'Mysore'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      AADHAAR CARD NUMBER
                    </span>
                    <strong style={{ color: '#334155', fontFamily: 'monospace' }}>
                      {lastRegistered.aadhaarNumber || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                      PAN CARD NUMBER
                    </span>
                    <strong style={{ color: '#334155', fontFamily: 'monospace' }}>
                      {lastRegistered.panNumber || '—'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Registered Staff Reference Table */}
            <div className="recent-duties-card">
              <div className="recent-duties-header">
                <div className="recent-title-wrap">
                  <div className="recent-icon-box">
                    <Users size={18} color="#2563EB" />
                  </div>
                  <h2 className="recent-main-title">
                    Registered Workforce Members ({registeredEmployees.length})
                  </h2>
                </div>
              </div>

              <div className="desktop-table-container">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl No</th>
                      <th>Resource ID</th>
                      <th>Full Name</th>
                      <th>Contact Number</th>
                      <th>Email Address</th>
                      <th>City</th>
                      <th>Aadhaar No.</th>
                      <th>PAN No.</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                          No workforce members found.
                        </td>
                      </tr>
                    ) : (
                      displayedEmployees.map((emp, idx) => {
                        const isNew = emp.resourceId === lastRegistered?.resourceId;
                        return (
                          <tr
                            key={emp.id || idx}
                            style={{
                              backgroundColor: isNew ? '#F0FDF4' : undefined,
                              transition: 'background-color 0.3s ease',
                            }}
                          >
                            <td className="col-num">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {(currentPage - 1) * pageSize + idx + 1}
                                {isNew && (
                                  <span
                                    style={{
                                      background: '#16A34A',
                                      color: '#FFFFFF',
                                      fontSize: '9px',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    NEW
                                  </span>
                                )}
                              </span>
                            </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedModalResourceId(emp.resourceId)}
                              title="Click to view & edit full personal details (Aadhaar, PAN, etc.)"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontWeight: 700,
                                color: '#2563EB',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '15px',
                              }}
                            >
                              {emp.resourceId}
                            </button>
                          </td>
                          <td style={{ fontWeight: 600, color: '#1E293B' }}>{emp.name}</td>
                          <td>{emp.mobile}</td>
                          <td style={{ color: '#64748B' }}>{emp.email || '—'}</td>
                          <td style={{ fontWeight: 600, color: '#0F766E' }}>{emp.city || 'Mysore'}</td>
                          <td style={{ color: '#475569', fontFamily: 'monospace' }}>{emp.aadhaarNumber || '—'}</td>
                          <td style={{ color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>{emp.panNumber || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedModalResourceId(emp.resourceId)}
                                title="Edit employee information"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 11px',
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#1D4ED8',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeletingEmployee(emp);
                                }}
                                title="Delete employee"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 11px',
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  color: '#DC2626',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>

              {/* TrackClock HR Horizontal Numbered Pagination Bar */}
              {registeredEmployees.length > 0 && (
                <div
                  className="trackclock-pagination-wrap"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderTop: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
                    *Showing {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, registeredEmployees.length)} of{' '}
                    {registeredEmployees.length} records (15 per page)
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="trackclock-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '0 12px' }}
                    >
                      &larr; Back
                    </button>

                    {getPageNumbers().map((item, i) =>
                      item === '...' ? (
                        <span key={`ellipsis-${i}`} className="trackclock-page-ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${item}`}
                          type="button"
                          className={`trackclock-page-btn ${currentPage === item ? 'active' : ''}`}
                          onClick={() => setCurrentPage(Number(item))}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="trackclock-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{ padding: '0 12px' }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TrackClock HR Style Work Place Filter & Export Card */}
            <ExportEmployeesCard
              employees={registeredEmployees}
            />
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />

        <main className="mobile-content-body">
          <div className="mobile-page-title-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="mobile-page-heading">Add Employee</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowBulkModal(true)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Upload size={14} />
              <span>Bulk Upload</span>
            </button>
          </div>

          {submitSuccess && (
            <div className="alert-banner alert-success">
              <CheckCircle2 size={16} />
              <span>{submitSuccess}</span>
            </div>
          )}
          {submitError && (
            <div className="alert-banner alert-error">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}



          <div className="mobile-form-card" style={{ marginBottom: '16px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">STAFF / RESOURCE ID *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="mobile-form-input"
                    placeholder="e.g. 597305"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value.replace(/\D/g, ''))}
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
                  />
                </div>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">MEMBER FULL NAME *</label>
                  <input
                    type="text"
                    className="mobile-form-input"
                    placeholder="e.g. Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
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
                  />
                </div>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">CONTACT / MOBILE NUMBER *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="mobile-form-input"
                    placeholder="e.g. 9845281743"
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
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
                    style={{ borderColor: mobileWarning ? '#EF4444' : undefined }}
                  />
                  {mobileWarning && (
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
                      <span>{mobileWarning}</span>
                    </span>
                  )}
                </div>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    className="mobile-form-input"
                    placeholder="e.g. rajesh@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">ASSIGNED CITY * (SELECT MULTIPLE)</label>
                  <CityMultiSelectDropdown
                    selectedCities={selectedCities}
                    onChange={setSelectedCities}
                    className="mobile-form-select"
                  />
                </div>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">AADHAAR CARD NUMBER *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    className="mobile-form-input"
                    placeholder="e.g. 489278985583"
                    value={aadhaarNumber}
                    onChange={(e) => handleAadhaarChange(e.target.value)}
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
                    style={{ borderColor: aadhaarWarning ? '#EF4444' : undefined }}
                  />
                  {aadhaarWarning && (
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
                      <span>{aadhaarWarning}</span>
                    </span>
                  )}
                </div>
                <div className="mobile-form-group">
                  <label className="mobile-input-label">PAN CARD NUMBER *</label>
                  <input
                    type="text"
                    className="mobile-form-input"
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <button
                  type="submit"
                  className="mobile-submit-btn"
                  disabled={submitting}
                  style={{ marginTop: '8px' }}
                >
                  {submitting ? 'Saving...' : 'Save & Register Employee'}
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Workforce Reference Table (Exact same full table layout as Desktop) */}
          <div className="recent-duties-card" style={{ marginTop: '20px' }}>
            <div className="recent-duties-header">
              <div className="recent-title-wrap">
                <div className="recent-icon-box">
                  <Users size={18} color="#2563EB" />
                </div>
                <h2 className="recent-main-title">
                  Registered Workforce Members ({registeredEmployees.length})
                </h2>
              </div>
            </div>

            <div className="desktop-table-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="recent-table" style={{ minWidth: '850px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Sl No</th>
                    <th>Resource ID</th>
                    <th>Full Name</th>
                    <th>Contact Number</th>
                    <th>Email Address</th>
                    <th>City</th>
                    <th>Aadhaar No.</th>
                    <th>PAN No.</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                        No workforce members found.
                      </td>
                    </tr>
                  ) : (
                    displayedEmployees.map((emp, idx) => {
                      const isNew = emp.resourceId === lastRegistered?.resourceId;
                      return (
                        <tr
                          key={emp.id || idx}
                          style={{
                            backgroundColor: isNew ? '#F0FDF4' : undefined,
                            transition: 'background-color 0.3s ease',
                          }}
                        >
                          <td className="col-num">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {(currentPage - 1) * pageSize + idx + 1}
                              {isNew && (
                                <span
                                  style={{
                                    background: '#16A34A',
                                    color: '#FFFFFF',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedModalResourceId(emp.resourceId)}
                              title="Click to view & edit full personal details (Aadhaar, PAN, etc.)"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontWeight: 700,
                                color: '#2563EB',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '15px',
                              }}
                            >
                              {emp.resourceId}
                            </button>
                          </td>
                          <td style={{ fontWeight: 600, color: '#1E293B' }}>{emp.name}</td>
                          <td>{emp.mobile}</td>
                          <td style={{ color: '#64748B' }}>{emp.email || '—'}</td>
                          <td style={{ fontWeight: 600, color: '#0F766E' }}>{emp.city || 'Mysore'}</td>
                          <td style={{ color: '#475569', fontFamily: 'monospace' }}>{emp.aadhaarNumber || '—'}</td>
                          <td style={{ color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>{emp.panNumber || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedModalResourceId(emp.resourceId)}
                                title="Edit employee information"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 11px',
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#1D4ED8',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeletingEmployee(emp);
                                }}
                                title="Delete employee"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 11px',
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  color: '#DC2626',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* TrackClock HR Horizontal Numbered Pagination Bar */}
            {registeredEmployees.length > 0 && (
              <div
                className="trackclock-pagination-wrap"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderTop: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
                  *Showing {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, registeredEmployees.length)} of{' '}
                  {registeredEmployees.length} records (15 per page)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="trackclock-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{ padding: '0 12px' }}
                  >
                    &larr; Back
                  </button>

                  {getPageNumbers().map((item, i) =>
                    item === '...' ? (
                      <span key={'mobile-page-ellipsis-' + i} className="trackclock-page-ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        key={'mobile-page-' + item}
                        type="button"
                        className={'trackclock-page-btn ' + (currentPage === item ? 'active' : '')}
                        onClick={() => setCurrentPage(Number(item))}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="trackclock-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{ padding: '0 12px' }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TrackClock HR Style Work Place Filter & Export Card for Mobile */}
          <ExportEmployeesCard
            employees={registeredEmployees}
          />
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                  Confirm Delete Employee
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Permanent workforce removal
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to delete <strong>{deletingEmployee.name}</strong> (Resource ID:{' '}
              <strong>{deletingEmployee.resourceId}</strong>)? This will remove the employee and all their assigned
              duties from the database.
            </p>

            {deleteError && (
              <div className="alert-banner alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={deleting}
                onClick={() => {
                  setDeletingEmployee(null);
                  setDeleteError(null);
                }}
                style={{ padding: '9px 18px', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteEmployee}
                style={{
                  padding: '9px 20px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Yes, Delete Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Popup Modal */}
      {deletedSuccessInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px',
          }}
          onClick={() => setDeletedSuccessInfo(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '19px', fontWeight: 700, color: '#1E293B' }}>
              Employee Deleted Successfully
            </h3>

            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Employee <strong style={{ color: '#0F172A' }}>{deletedSuccessInfo.name}</strong>, Resource ID:{' '}
              <strong style={{ color: '#0F172A' }}>{deletedSuccessInfo.resourceId}</strong> has been deleted successfully.
            </p>

            <button
              type="button"
              onClick={() => setDeletedSuccessInfo(null)}
              style={{
                width: '100%',
                padding: '11px 20px',
                background: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#15803D')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#16A34A')}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Employee Personal Details Modal */}
      <EmployeeDetailsModal
        resourceId={selectedModalResourceId}
        isOpen={Boolean(selectedModalResourceId)}
        onClose={() => setSelectedModalResourceId(null)}
        onUpdated={() => loadEmployees()}
      />

      {/* SweetAlert Toast Popup (matching Image 2) */}
      <SweetAlertToast
        show={Boolean(toastMessage)}
        message={toastMessage || ""}
        onClose={() => setToastMessage(null)}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadEmployeeModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          loadEmployees();
          setSubmitSuccess('Workforce members registered successfully via bulk upload!');
          setToastMessage('Workforce members registered successfully via bulk upload!');
        }}
        existingEmployees={registeredEmployees}
      />
    </div>
  );
};

export default AddEmployeeScreen;
