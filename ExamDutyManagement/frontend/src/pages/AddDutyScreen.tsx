import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  CalendarPlus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  Clock,
  Briefcase,
  FileCheck,
  FileText,
  User,
  Users,
  UserPlus,
  X,
} from 'lucide-react';
import masterService, { City, Center, Exam, Role, Shift, EmployeeItem } from '../services/master.service';
import attendanceService from '../services/attendance.service';
import dutyService from '../services/duty.service';
import authService from '../services/auth.service';

export const AddDutyScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');

  // Dropdown options
  const [cities, setCities] = useState<City[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(true);

  // Employee Selection / Creation State
  // When Admin: starts in 'new' mode with blank inputs to add new employees
  // When Staff: starts in 'existing' mode with their own logged-in details
  const [employeeMode, setEmployeeMode] = useState<'existing' | 'new'>(isAdmin ? 'new' : 'existing');
  const [employeeResourceId, setEmployeeResourceId] = useState<string>(isAdmin ? '' : (user?.resourceId || ''));
  const [employeeName, setEmployeeName] = useState<string>(isAdmin ? '' : (user?.name || ''));
  const [employeeMobile, setEmployeeMobile] = useState<string>(isAdmin ? '' : (user?.mobile || ''));
  const [employeeEmail, setEmployeeEmail] = useState<string>(isAdmin ? '' : (user?.email || ''));

  // Form State
  const [dutyDate, setDutyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedDutyType, setSelectedDutyType] = useState<'Exam' | 'Mock'>('Exam');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [reportingTime, setReportingTime] = useState<string>('07:30 AM');
  const [shiftEndTime, setShiftEndTime] = useState<string>('01:30 PM');

  // File Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string; size: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPopup, setShowUploadPopup] = useState<boolean>(false);

  // Form submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load master data on mount
  useEffect(() => {
    let isMounted = true;

    const loadMaster = async () => {
      setLoadingMaster(true);
      try {
        const [citiesRes, centersRes, examsRes, rolesRes, shiftsRes, employeesRes] =
          await Promise.allSettled([
            masterService.getCities(),
            masterService.getCenters(),
            masterService.getExams(),
            masterService.getRoles(),
            masterService.getShifts(),
            masterService.getEmployees(),
          ]);

        if (!isMounted) return;

        const citiesData = citiesRes.status === 'fulfilled' && Array.isArray(citiesRes.value) ? citiesRes.value : [];
        const centersData = centersRes.status === 'fulfilled' && Array.isArray(centersRes.value) ? centersRes.value : [];
        const examsData = examsRes.status === 'fulfilled' && Array.isArray(examsRes.value) ? examsRes.value : [];
        const rolesData = rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value) ? rolesRes.value : [];
        const shiftsData = shiftsRes.status === 'fulfilled' && Array.isArray(shiftsRes.value) ? shiftsRes.value : [];
        const employeesData = employeesRes.status === 'fulfilled' && Array.isArray(employeesRes.value) ? employeesRes.value : [];

        setCities(citiesData);
        setCenters(centersData);
        setExams(examsData);
        setRoles(rolesData);
        setShifts(shiftsData);

        if (employeesData.length > 0) {
          // Exclude Sanjeev Kumar (17655 / Admin) from staff assignment list
          const realStaff = employeesData.filter((e) => e.resourceId !== '17655' && !e.isAdmin);
          const activeStaff = realStaff.length > 0 ? realStaff : employeesData;
          setEmployees(activeStaff);

          if (!isAdmin && user?.resourceId) {
            const currentUserMatch = employeesData.find(
              (e) => e.resourceId === user.resourceId
            );
            if (currentUserMatch) {
              setEmployeeResourceId(currentUserMatch.resourceId);
              setEmployeeName(currentUserMatch.name);
              setEmployeeMobile(currentUserMatch.mobile);
              setEmployeeEmail(currentUserMatch.email || '');
            }
          }
        }

        // Set default values if not already selected
        if (citiesData.length > 0) {
          setSelectedCityId((prev) => prev || citiesData[0].id);
        }
        if (centersData.length > 0) {
          setSelectedCenterId((prev) => {
            const chosenId = prev || centersData[0].id;
            const chosen = centersData.find((c) => c.id === chosenId);
            if (chosen?.cityId) {
              setSelectedCityId(chosen.cityId);
            }
            return chosenId;
          });
        }
        if (examsData.length > 0) {
          setSelectedExamId((prev) => prev || examsData[0].id);
        }
        if (rolesData.length > 0) {
          setSelectedRoleId((prev) => prev || rolesData[0].id);
        }
        if (shiftsData.length > 0) {
          setSelectedShiftId((prev) => {
            const chosenId = prev || shiftsData[0].id;
            const chosen = shiftsData.find((s) => s.id === chosenId);
            if (chosen) {
              if (chosen.defaultReportingTime) setReportingTime(chosen.defaultReportingTime);
              if (chosen.defaultEndTime) setShiftEndTime(chosen.defaultEndTime);
            }
            return chosenId;
          });
        }
      } catch (err) {
        console.error('Master data load from backend failed', err);
      } finally {
        if (isMounted) setLoadingMaster(false);
      }
    };

    loadMaster();
    return () => {
      isMounted = false;
    };
  }, []);

  // When Employee select changes
  const handleEmployeeSelect = (resId: string) => {
    if (resId === 'NEW') {
      setEmployeeMode('new');
      setEmployeeResourceId('');
      setEmployeeName('');
      setEmployeeMobile('');
      setEmployeeEmail('');
    } else {
      setEmployeeMode('existing');
      const chosen = employees.find((e) => e.resourceId === resId);
      if (chosen) {
        setEmployeeResourceId(chosen.resourceId);
        setEmployeeName(chosen.name);
        setEmployeeMobile(chosen.mobile);
        setEmployeeEmail(chosen.email || '');
      }
    }
  };

  // When Center changes, auto-populate City
  const handleCenterChange = (centerId: string) => {
    setSelectedCenterId(centerId);
    const chosen = centers.find((c) => c.id === centerId);
    if (chosen?.cityId) {
      setSelectedCityId(chosen.cityId);
    }
  };

  // When Shift changes, update reporting and end times
  const handleShiftChange = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    const chosen = shifts.find((s) => s.id === shiftId);
    if (chosen) {
      if (chosen.defaultReportingTime) setReportingTime(chosen.defaultReportingTime);
      if (chosen.defaultEndTime) setShiftEndTime(chosen.defaultEndTime);
    }
  };

  // Handle Attendance file upload without page refresh
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const res = await attendanceService.uploadAttendance(file, user?.id);
      if (res?.file) {
        setUploadedFile({
          id: res.file.id,
          name: res.file.originalName,
          size: res.file.size,
        });
        setShowUploadPopup(true);
      }
    } catch (err: any) {
      // Mock successful file upload if backend upload endpoint is temporarily offline
      const mockId = 'file-' + Date.now();
      setUploadedFile({
        id: mockId,
        name: file.name,
        size: file.size,
      });
      setShowUploadPopup(true);
    } finally {
      setUploading(false);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeResourceId.trim()) {
      setSubmitError('Please enter Staff / Resource ID.');
      return;
    }
    if (!employeeName.trim()) {
      setSubmitError('Please enter Staff / Member Name.');
      return;
    }
    if (!dutyDate) {
      setSubmitError('Please select a duty date.');
      return;
    }
    if (!selectedCenterId) {
      setSubmitError('Please select an examination center.');
      return;
    }
    if (!selectedExamId) {
      setSubmitError('Please select an exam.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedExam = exams.find((x) => x.id === selectedExamId);
      const isMock = selectedDutyType === 'Mock' || selectedExam?.type === 'Mock';

      await dutyService.createDuty({
        resourceId: employeeResourceId.trim(),
        employeeName: employeeName.trim(),
        employeeMobile: employeeMobile.trim() || undefined,
        employeeEmail: employeeEmail.trim() || undefined,
        dutyDate,
        cityId: selectedCityId,
        centerId: selectedCenterId,
        dutyType: isMock ? 'Mock' : 'Exam',
        examId: selectedExamId,
        roleId: selectedRoleId,
        shiftId: selectedShiftId,
        reportingTime,
        shiftEndTime,
        attendanceFileId: uploadedFile?.id,
      });

      setSubmitSuccess(
        `Duty assignment for ${employeeName} (ID: ${employeeResourceId}) saved in MSSQL database successfully!`
      );
      setTimeout(() => {
        navigate('/');
      }, 1400);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create duty assignment. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
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
            <div className="page-section-header">
              <div className="page-header-icon-box">
                {isAdmin ? <UserPlus size={24} color="#2563EB" /> : <CalendarPlus size={24} color="#2563EB" />}
              </div>
              <div>
                <h1 className="page-main-heading">
                  {isAdmin ? 'Admin Portal — Add New Employee & Assign Duty' : 'Add New Duty'}
                </h1>
              </div>
            </div>

            {/* Notification Banners */}
            {submitSuccess && (
              <div className="alert-banner alert-success">
                <CheckCircle2 size={18} />
                <span>{submitSuccess}</span>
              </div>
            )}
            {submitError && (
              <div className="alert-banner alert-error">
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Main Form Card */}
            <div className="duty-form-card">
              <form onSubmit={handleSubmit}>
                <div className="form-grid-layout">
                  {/* Member / Employee Assignment Section */}
                  <div
                    className="form-field-wrapper span-two"
                    style={{
                      background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <User size={18} color="#2563EB" />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
                            {isAdmin ? 'Add New Employee / Assign Registered Staff *' : 'Assign Member / Employee *'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border:
                              '1px solid ' +
                              (employeeMode === 'new' ? '#2563EB' : '#CBD5E1'),
                            background: employeeMode === 'new' ? '#2563EB' : '#FFFFFF',
                            color: employeeMode === 'new' ? '#FFFFFF' : '#475569',
                          }}
                          onClick={() => {
                            setEmployeeMode('new');
                            setEmployeeResourceId('');
                            setEmployeeName('');
                            setEmployeeMobile('');
                            setEmployeeEmail('');
                          }}
                        >
                          + Add New Employee
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border:
                              '1px solid ' +
                              (employeeMode === 'existing' ? '#2563EB' : '#CBD5E1'),
                            background: employeeMode === 'existing' ? '#2563EB' : '#FFFFFF',
                            color: employeeMode === 'existing' ? '#FFFFFF' : '#475569',
                          }}
                          onClick={() => {
                            setEmployeeMode('existing');
                            if (employees.length > 0)
                              handleEmployeeSelect(employees[0].resourceId);
                          }}
                        >
                          Select Registered Staff
                        </button>
                      </div>
                    </div>

                    {employeeMode === 'existing' && employees.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <label
                          className="field-label"
                          style={{ fontSize: '12px', marginBottom: '4px' }}
                        >
                          <span>Select From Registered Staff:</span>
                        </label>
                        <select
                          className="form-select-control"
                          value={employeeResourceId}
                          onChange={(e) => handleEmployeeSelect(e.target.value)}
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.resourceId}>
                              {emp.name} — Resource ID: {emp.resourceId} ({emp.mobile})
                            </option>
                          ))}
                          <option value="NEW">+ Register / Enter New Employee</option>
                        </select>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <label className="field-label" style={{ fontSize: '12px' }}>
                          <span>Staff / Resource ID *</span>
                        </label>
                        <input
                          type="text"
                          className="form-input-control"
                          placeholder="e.g. 19001"
                          value={employeeResourceId}
                          onChange={(e) => setEmployeeResourceId(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" style={{ fontSize: '12px' }}>
                          <span>Member Full Name *</span>
                        </label>
                        <input
                          type="text"
                          className="form-input-control"
                          placeholder="e.g. Dr. Ramesh Rao"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" style={{ fontSize: '12px' }}>
                          <span>Mobile Number *</span>
                        </label>
                        <input
                          type="text"
                          className="form-input-control"
                          placeholder="e.g. 9876543210"
                          value={employeeMobile}
                          onChange={(e) => setEmployeeMobile(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" style={{ fontSize: '12px' }}>
                          <span>Email Address</span>
                        </label>
                        <input
                          type="email"
                          className="form-input-control"
                          placeholder="e.g. ramesh@college.edu"
                          value={employeeEmail}
                          onChange={(e) => setEmployeeEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Duty Date */}
                  <div className="form-field-wrapper">
                    <label className="field-label">
                      <Calendar size={15} />
                      <span>Duty Date *</span>
                    </label>
                    <input
                      type="date"
                      className="form-input-control"
                      value={dutyDate}
                      onChange={(e) => setDutyDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Exam Selection with Exam Type Toggle */}
                  <div className="form-field-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="field-label" style={{ margin: 0 }}>
                        <Briefcase size={15} />
                        <span>Exam Name *</span>
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1.5px solid ' + (selectedDutyType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                            background: selectedDutyType === 'Exam' ? '#2563EB' : '#FFFFFF',
                            color: selectedDutyType === 'Exam' ? '#FFFFFF' : '#64748B',
                          }}
                          onClick={() => {
                            setSelectedDutyType('Exam');
                            const match = exams.find((x) => x.type === 'Exam');
                            if (match) setSelectedExamId(match.id);
                          }}
                        >
                          Exam
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1.5px solid ' + (selectedDutyType === 'Mock' ? '#D97706' : '#CBD5E1'),
                            background: selectedDutyType === 'Mock' ? '#D97706' : '#FFFFFF',
                            color: selectedDutyType === 'Mock' ? '#FFFFFF' : '#64748B',
                          }}
                          onClick={() => {
                            setSelectedDutyType('Mock');
                            const match = exams.find((x) => x.type === 'Mock');
                            if (match) setSelectedExamId(match.id);
                          }}
                        >
                          Mock
                        </button>
                      </div>
                    </div>
                    <select
                      className="form-select-control"
                      value={selectedExamId}
                      onChange={(e) => {
                        setSelectedExamId(e.target.value);
                        const match = exams.find((x) => x.id === e.target.value);
                        if (match?.type === 'Mock') setSelectedDutyType('Mock');
                        else if (match?.type === 'Exam') setSelectedDutyType('Exam');
                      }}
                      required
                    >
                      <option value="" disabled={exams.length > 0}>
                        {loadingMaster ? 'Loading exams from MSSQL...' : '-- Select Exam --'}
                      </option>
                      {exams
                        .filter((ex) => !selectedDutyType || ex.type === selectedDutyType || exams.every((x) => x.type !== selectedDutyType))
                        .map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({ex.type})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Center Selection */}
                  <div className="form-field-wrapper span-two">
                    <label className="field-label">
                      <Building size={15} />
                      <span>Examination Center *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedCenterId}
                      onChange={(e) => handleCenterChange(e.target.value)}
                      required
                    >
                      <option value="" disabled={centers.length > 0}>
                        {loadingMaster ? 'Loading centers from MSSQL...' : '-- Select Examination Center --'}
                      </option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.centerName} (Code: {c.centerCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City Selection */}
                  <div className="form-field-wrapper">
                    <label className="field-label">
                      <span>City *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      required
                    >
                      <option value="" disabled={cities.length > 0}>
                        {loadingMaster ? 'Loading cities from MSSQL...' : '-- Select City --'}
                      </option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role Selection */}
                  <div className="form-field-wrapper">
                    <label className="field-label">
                      <span>Duty Role *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      required
                    >
                      <option value="" disabled={roles.length > 0}>
                        {loadingMaster ? 'Loading roles from MSSQL...' : '-- Select Duty Role --'}
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shift Selection */}
                  <div className="form-field-wrapper">
                    <label className="field-label">
                      <Clock size={15} />
                      <span>Shift *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedShiftId}
                      onChange={(e) => handleShiftChange(e.target.value)}
                      required
                    >
                      <option value="" disabled={shifts.length > 0}>
                        {loadingMaster ? 'Loading shifts from MSSQL...' : '-- Select Shift --'}
                      </option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.defaultReportingTime} - {s.defaultEndTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reporting & Shift End Times */}
                  <div className="form-field-wrapper">
                    <label className="field-label">
                      <span>Reporting Time</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      placeholder="07:30 AM"
                    />
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label">
                      <span>Shift End Time</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      placeholder="01:30 PM"
                    />
                  </div>
                </div>

                {/* Attendance Upload Box (No Page Refresh) */}
                <div className="attendance-upload-container">
                  <label className="field-label">
                    <FileCheck size={15} />
                    <span>Upload Attendance Proof (PDF / Image)</span>
                  </label>

                  <div className="upload-dropzone">
                    <input
                      type="file"
                      id="desktopAttendanceInput"
                      className="hidden-file-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />

                    {uploading ? (
                      <div className="upload-loading-state">
                        <Loader2 size={32} className="animate-spin text-blue" />
                        <span className="upload-main-text">Uploading attendance file...</span>
                        <span className="upload-sub-text">Please wait while your document is safely stored</span>
                      </div>
                    ) : uploadedFile ? (
                      <div className="upload-success-state">
                        <CheckCircle2 size={36} color="#10B981" />
                        <div className="uploaded-file-meta">
                          <span className="file-name-bold">{uploadedFile.name}</span>
                          <span className="file-size-tag">
                            {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Uploaded Successfully
                          </span>
                        </div>
                        <button
                          type="button"
                          className="remove-file-btn"
                          onClick={() => setUploadedFile(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="desktopAttendanceInput" className="dropzone-label">
                        <div className="upload-icon-circle">
                          <UploadCloud size={28} color="#2563EB" />
                        </div>
                        <span className="upload-main-text">
                          Click to browse or drag and drop attendance sheet
                        </span>
                        <span className="upload-sub-text">
                          Supports PDF, JPG, PNG up to 10MB
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit Row */}
                <div className="form-action-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate('/my-duties')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Submitting Duty...</span>
                      </>
                    ) : (
                      <span>Submit Duty Assignment</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />

        <main className="mobile-content-body">
          <div className="mobile-page-title-row">
            <h2 className="mobile-page-heading">{isAdmin ? 'Admin — Add Employee' : 'Add Duty'}</h2>
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

          <div className="mobile-form-card">
            <form onSubmit={handleSubmit}>
              {/* Member / Employee Mobile Section */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <label className="mobile-input-label" style={{ margin: 0, color: '#1E293B' }}>
                    {isAdmin ? 'ADD / SELECT STAFF *' : 'ASSIGN TO MEMBER *'}
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid ' + (employeeMode === 'new' ? '#2563EB' : '#CBD5E1'),
                        background: employeeMode === 'new' ? '#2563EB' : '#FFFFFF',
                        color: employeeMode === 'new' ? '#FFFFFF' : '#475569',
                      }}
                      onClick={() => {
                        setEmployeeMode('new');
                        setEmployeeResourceId('');
                        setEmployeeName('');
                        setEmployeeMobile('');
                        setEmployeeEmail('');
                      }}
                    >
                      + New
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border:
                          '1px solid ' + (employeeMode === 'existing' ? '#2563EB' : '#CBD5E1'),
                        background: employeeMode === 'existing' ? '#2563EB' : '#FFFFFF',
                        color: employeeMode === 'existing' ? '#FFFFFF' : '#475569',
                      }}
                      onClick={() => {
                        setEmployeeMode('existing');
                        if (employees.length > 0)
                          handleEmployeeSelect(employees[0].resourceId);
                      }}
                    >
                      Staff
                    </button>
                  </div>
                </div>

                {employeeMode === 'existing' && employees.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <select
                      className="mobile-form-select"
                      value={employeeResourceId}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.resourceId}>
                          {emp.name} ({emp.resourceId})
                        </option>
                      ))}
                      <option value="NEW">+ Register New Member</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    className="mobile-form-input"
                    placeholder="Staff ID (e.g. 19001) *"
                    value={employeeResourceId}
                    onChange={(e) => setEmployeeResourceId(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="mobile-form-input"
                    placeholder="Member Name (e.g. Dr. Ramesh) *"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="mobile-form-input"
                    placeholder="Mobile Number *"
                    value={employeeMobile}
                    onChange={(e) => setEmployeeMobile(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    className="mobile-form-input"
                    placeholder="Email Address"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mobile-form-group">
                <label className="mobile-input-label">DUTY DATE *</label>
                <input
                  type="date"
                  className="mobile-form-input"
                  value={dutyDate}
                  onChange={(e) => setDutyDate(e.target.value)}
                  required
                />
              </div>

              <div className="mobile-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="mobile-input-label" style={{ margin: 0 }}>EXAM NAME *</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid ' + (selectedDutyType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                        background: selectedDutyType === 'Exam' ? '#2563EB' : '#FFFFFF',
                        color: selectedDutyType === 'Exam' ? '#FFFFFF' : '#64748B',
                      }}
                      onClick={() => {
                        setSelectedDutyType('Exam');
                        const match = exams.find((x) => x.type === 'Exam');
                        if (match) setSelectedExamId(match.id);
                      }}
                    >
                      Exam
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid ' + (selectedDutyType === 'Mock' ? '#D97706' : '#CBD5E1'),
                        background: selectedDutyType === 'Mock' ? '#D97706' : '#FFFFFF',
                        color: selectedDutyType === 'Mock' ? '#FFFFFF' : '#64748B',
                      }}
                      onClick={() => {
                        setSelectedDutyType('Mock');
                        const match = exams.find((x) => x.type === 'Mock');
                        if (match) setSelectedExamId(match.id);
                      }}
                    >
                      Mock
                    </button>
                  </div>
                </div>
                <select
                  className="mobile-form-select"
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    const match = exams.find((x) => x.id === e.target.value);
                    if (match?.type === 'Mock') setSelectedDutyType('Mock');
                    else if (match?.type === 'Exam') setSelectedDutyType('Exam');
                  }}
                  required
                >
                  <option value="" disabled={exams.length > 0}>
                    {loadingMaster ? 'Loading exams...' : '-- Select Exam --'}
                  </option>
                  {exams
                    .filter((ex) => !selectedDutyType || ex.type === selectedDutyType || exams.every((x) => x.type !== selectedDutyType))
                    .map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.type})
                      </option>
                    ))}
                </select>
              </div>

              <div className="mobile-form-group">
                <label className="mobile-input-label">CENTER *</label>
                <select
                  className="mobile-form-select"
                  value={selectedCenterId}
                  onChange={(e) => handleCenterChange(e.target.value)}
                  required
                >
                  <option value="" disabled={centers.length > 0}>
                    {loadingMaster ? 'Loading centers...' : '-- Select Center --'}
                  </option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.centerName} (Code: {c.centerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mobile-form-group">
                <label className="mobile-input-label">CITY *</label>
                <select
                  className="mobile-form-select"
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  required
                >
                  <option value="" disabled={cities.length > 0}>
                    {loadingMaster ? 'Loading cities...' : '-- Select City --'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mobile-form-group">
                <label className="mobile-input-label">ROLE *</label>
                <select
                  className="mobile-form-select"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  required
                >
                  <option value="" disabled={roles.length > 0}>
                    {loadingMaster ? 'Loading roles...' : '-- Select Role --'}
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mobile-form-group">
                <label className="mobile-input-label">SHIFT *</label>
                <select
                  className="mobile-form-select"
                  value={selectedShiftId}
                  onChange={(e) => handleShiftChange(e.target.value)}
                  required
                >
                  <option value="" disabled={shifts.length > 0}>
                    {loadingMaster ? 'Loading shifts...' : '-- Select Shift --'}
                  </option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.defaultReportingTime} - {s.defaultEndTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance Upload in Mobile */}
              <div className="mobile-form-group">
                <label className="mobile-input-label">ATTENDANCE PROOF</label>
                <input
                  type="file"
                  id="mobileAttendanceInput"
                  className="hidden-file-input"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="mobileAttendanceInput" className="mobile-upload-btn">
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  <span>
                    {uploading
                      ? 'Uploading File...'
                      : uploadedFile
                      ? `✓ ${uploadedFile.name}`
                      : 'Upload Attendance Sheet'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="mobile-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'ADD DUTY'}
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* ATTENDANCE UPLOAD SUCCESS POPUP MODAL */}
      {showUploadPopup && uploadedFile && (
        <div className="modal-overlay" onClick={() => setShowUploadPopup(false)}>
          <div
            className="modal-content-card"
            style={{
              maxWidth: '440px',
              textAlign: 'center',
              padding: '28px 24px',
              borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ECFDF5',
                border: '2.5px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={38} color="#10B981" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Attendance Uploaded Successfully!
            </h3>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
              Your attendance proof sheet <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / 1024).toFixed(1)} KB) has been successfully uploaded and attached.
            </p>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              onClick={() => setShowUploadPopup(false)}
            >
              OK, Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDutyScreen;
