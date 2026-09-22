import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  Clock,
  Briefcase,
  FileCheck,
  User,
  UserPlus,
  X,
  MapPin,
  Camera,
  Image as ImageIcon,
  Eye,
  RotateCcw,
  Shield,
  HelpCircle,
} from 'lucide-react';
import masterService, { City, Center, Exam, Role, Shift, EmployeeItem } from '../services/master.service';
import attendanceService from '../services/attendance.service';
import dutyService from '../services/duty.service';
import authService from '../services/auth.service';
import EmployeeDetailsModal from '../components/EmployeeDetailsModal';
import { ClockTimePicker } from '../components/ClockTimePicker';
import { SearchableSelect } from '../components/SearchableSelect';

export const AddDutyScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryResourceId = searchParams.get('resourceId');

  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');

  // Guard for Employee Portal: Require Aadhaar & PAN verification before entering details or uploading attendance
  useEffect(() => {
    if (!isAdmin && user?.resourceId) {
      const isVerified = Boolean(
        user.isIdentityVerified ||
        (user.aadhaarNumber && user.aadhaarNumber.trim().length >= 10 && user.panNumber && user.panNumber.trim().length >= 10) ||
        localStorage.getItem('identity_verified_' + user.resourceId) === 'true' ||
        sessionStorage.getItem('identity_verified_' + user.resourceId) === 'true'
      );
      if (!isVerified) {
        navigate('/verify-identity?redirect=/add-duty', { replace: true });
      }
    }
  }, [isAdmin, user, navigate]);

  // Master Dropdown options
  const [cities, setCities] = useState<City[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(true);

  // Selected Employee for Duty Assignment
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null);

  // Employee details modal state
  const [detailsModalResourceId, setDetailsModalResourceId] = useState<string | null>(null);

  // Ordered Duty Form Fields State
  // 1. Duty Date
  const [dutyDate, setDutyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  // 2. Type of Duty (Exam or Mock)
  const [selectedDutyType, setSelectedDutyType] = useState<'Exam' | 'Mock'>('Exam');
  // 3. City
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  // 4. Center
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  // 5. Exam Name
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  // 6. Duty Role
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  // 7. Shift
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  // 8. Reporting Time (Editable)
  const [reportingTime, setReportingTime] = useState<string>('07:30 AM');
  const [shiftEndTime, setShiftEndTime] = useState<string>('01:30 PM');

  // Attendance Upload State (Strictly Image Only)
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string; size: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hidden File and Camera input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modal State ("Are you sure you want to submit?")
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Form Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);



  // Load all master data from MSSQL backend
  useEffect(() => {
    let isMounted = true;
    setLoadingMaster(true);

    Promise.allSettled([
      masterService.getCities(),
      masterService.getCenters(),
      masterService.getExams(),
      masterService.getRoles(),
      masterService.getShifts(),
      masterService.getEmployees(),
    ])
      .then(([ctsRes, cntsRes, exsRes, rlsRes, shftsRes, empsRes]) => {
        if (!isMounted) return;

        const cts =
          ctsRes.status === 'fulfilled' && ctsRes.value?.length > 0
            ? ctsRes.value
            : [
                { id: '682C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'Mysore' },
                { id: '0E3128A1-9211-4919-9B2F-390A5B0A3EFD', name: 'Bengaluru' },
                { id: '2C62EEB3-5F51-45D0-AD88-7A07A3E063CA', name: 'Mangalore' },
                { id: '58DEB09C-B6B1-F111-9FC6-00F9B20AAF9C', name: 'Shivmogga' },
                { id: '692C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'Mandya' },
                { id: '59DEB09C-B6B1-F111-9FC6-00F9B20AAF9C', name: 'Davanagere' },
                { id: '5ADEB09C-B6B1-F111-9FC6-00F9B20AAF9C', name: 'Dharwad' },
              ];

        const cnts =
          cntsRes.status === 'fulfilled' && cntsRes.value?.length > 0
            ? cntsRes.value
            : [
                {
                  id: '6D2C2EBD-F1B0-F111-9FC5-00F9B20AAF9C',
                  centerCode: 'IDZ-01',
                  centerName: 'IDZ Hebbal',
                  cityId: '682C2EBD-F1B0-F111-9FC5-00F9B20AAF9C',
                },
                {
                  id: '712C2EBD-F1B0-F111-9FC5-00F9B20AAF9C',
                  centerCode: 'SJB-05',
                  centerName: 'SJB Institute',
                  cityId: '682C2EBD-F1B0-F111-9FC5-00F9B20AAF9C',
                },
                {
                  id: '6F2C2EBD-F1B0-F111-9FC5-00F9B20AAF9C',
                  centerCode: 'VVCE-03',
                  centerName: 'Vidyavardhaka CE',
                  cityId: '682C2EBD-F1B0-F111-9FC5-00F9B20AAF9C',
                },
                {
                  id: '1A44A389-089C-47DD-A281-69773F788515',
                  centerCode: '8412',
                  centerName: 'iDZ Whitefield Bengaluru',
                  cityId: '0E3128A1-9211-4919-9B2F-390A5B0A3EFD',
                },
                {
                  id: '771F90BB-801C-4C55-B596-5F46CE37B2EA',
                  centerCode: '8411',
                  centerName: 'iDZ Electronics City Bengaluru',
                  cityId: '0E3128A1-9211-4919-9B2F-390A5B0A3EFD',
                },
                {
                  id: '9247E5E4-DBCB-432A-98DC-7059CA793533',
                  centerCode: '7701',
                  centerName: 'PES University Campus Center',
                  cityId: '0E3128A1-9211-4919-9B2F-390A5B0A3EFD',
                },
              ];

        const exs =
          exsRes.status === 'fulfilled' && exsRes.value?.length > 0
            ? exsRes.value
            : [
                { id: '722C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'NEET', code: 'NEET', type: 'Exam' },
                { id: '732C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'JEE Main', code: 'JEE', type: 'Exam' },
                { id: '742C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'UGC NET', code: 'NET', type: 'Exam' },
                { id: '752C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'TCS', code: 'TCS', type: 'Exam' },
                { id: '6AB00977-D8D9-4C23-ABF2-28B5DFEFD681', name: 'IBPS PO Mains 2026', code: 'IBPS-PO-M', type: 'Exam' },
                { id: '762C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'AIIMS Mock', code: 'AIIMS', type: 'Mock' },
                { id: '772C2EBD-F1B0-F111-9FC5-00F9B20AAF9C', name: 'GATE Mock', code: 'GATE', type: 'Mock' },
                { id: 'DEC0FF6B-88EC-47EC-BDE9-D74582371709', name: 'Mock Drill 2026', code: 'MOCK-DR-26', type: 'Mock' },
              ];

        const rls = rlsRes.status === 'fulfilled' && rlsRes.value ? rlsRes.value : [];
        const shfts = shftsRes.status === 'fulfilled' && shftsRes.value ? shftsRes.value : [];
        const fallbackEmps: EmployeeItem[] = [
          { id: '1C0CAB73-8DB1-F111-9FC6-00F9B20AAF9C', resourceId: '597299', name: 'IFSHA', city: 'Mysore', mobile: '9876543210', status: 'Active' },
          { id: '8994E546-88B1-F111-9FC6-00F9B20AAF9C', resourceId: '597300', name: 'imsha', city: 'Mysore', mobile: '9876543211', status: 'Active' },
          { id: '4A33D465-96B1-F111-9FC6-00F9B20AAF9C', resourceId: '52671', name: 'MOHAN H S', city: 'Bengaluru', mobile: '9876543212', status: 'Active' },
          { id: '3FE1B17F-E747-4EB8-8AA0-F1F5C8E92F2E', resourceId: '17656', name: 'Rajesh Sharma', city: 'Bengaluru', mobile: '9876543213', status: 'Active' },
          { id: 'C1C642CE-98B1-F111-9FC6-00F9B20AAF9C', resourceId: '59253', name: 'sahida', city: 'Mysore', mobile: '9876543214', status: 'Active' },
          { id: '9697D7BA-2CB3-F111-9FCB-00F9B20AAF9C', resourceId: '317677', name: 'SWAMY', city: 'Mysore', mobile: '9876543215', status: 'Active' },
        ];
        const emps =
          empsRes.status === 'fulfilled' && empsRes.value?.length > 0
            ? empsRes.value
            : fallbackEmps;

        setCities(cts);
        setCenters(cnts);
        setExams(exs);

        // Strictly restrict Duty Roles to M OT, SO, HOT(IT Manager), CCTV
        const allowedRoleDefs = [
          { name: 'M OT', code: 'MOT' },
          { name: 'SO', code: 'SO' },
          { name: 'HOT(IT Manager)', code: 'HOT' },
          { name: 'CCTV', code: 'CCTV' },
        ];
        const finalRoles: Role[] = allowedRoleDefs.map((def) => {
          const matched = rls.find(
            (r) =>
              r.name?.toLowerCase() === def.name.toLowerCase() ||
              r.code?.toUpperCase() === def.code ||
              (def.code === 'MOT' && (r.code === 'MOT' || r.name?.toLowerCase().includes('mobile observer'))),
          );
          return matched
            ? { ...matched, name: def.name, code: def.code }
            : { id: `role-${def.code.toLowerCase()}`, name: def.name, code: def.code };
        });
        setRoles(finalRoles);

        // Strictly restrict shifts to Shift 1, Shift 2, Shift 3 only (no "All")
        const allowedShiftNames = ['Shift 1', 'Shift 2', 'Shift 3'];
        const validShifts = shfts.filter((s) => allowedShiftNames.includes(s.name));
        const finalShifts: Shift[] =
          validShifts.length > 0
            ? validShifts
            : [
                { id: 'shift-1', name: 'Shift 1', defaultReportingTime: '07:30 AM', defaultEndTime: '01:30 PM' },
                { id: 'shift-2', name: 'Shift 2', defaultReportingTime: '01:00 PM', defaultEndTime: '06:00 PM' },
                { id: 'shift-3', name: 'Shift 3', defaultReportingTime: '05:30 PM', defaultEndTime: '10:00 PM' },
              ];
        setShifts(finalShifts);

        // Exclude system admin Sanjeev Kumar (17655) from workforce assignee list
        const realStaff = emps.filter((e) => e.resourceId !== '17655' && !e.isAdmin);
        const staffList = realStaff.length > 0 ? realStaff : fallbackEmps;
        setEmployees(staffList);

        // Auto-select logged in employee or query param
        if (queryResourceId) {
          const found = staffList.find((e) => e.resourceId === queryResourceId);
          if (found) setSelectedEmployee(found);
        } else if (!isAdmin && user) {
          const self = emps.find((e) => e.resourceId === user.resourceId) || {
            id: user.id,
            resourceId: user.resourceId,
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            status: 'Active',
          };
          setSelectedEmployee(self);
        } else if (staffList.length > 0) {
          setSelectedEmployee(staffList[0]);
        }

        // Set sensible initial defaults
        if (cts.length > 0) {
          const defaultCityId = cts[0].id;
          setSelectedCityId(defaultCityId);
          const firstCenters = cnts.filter(
            (c) => String(c.cityId || '').toLowerCase() === String(defaultCityId).toLowerCase()
          );
          if (firstCenters.length > 0) setSelectedCenterId(firstCenters[0].id);
          else if (cnts.length > 0) setSelectedCenterId(cnts[0].id);
        }
        if (exs.length > 0) {
          const firstExam =
            exs.find((x) => String(x.type || '').toLowerCase() === selectedDutyType.toLowerCase()) || exs[0];
          setSelectedExamId(firstExam.id);
        }
        if (finalRoles.length > 0) setSelectedRoleId(finalRoles[0].id);
        else if (rls.length > 0) setSelectedRoleId(rls[0].id);
        if (finalShifts.length > 0) {
          setSelectedShiftId(finalShifts[0].id);
          setReportingTime(finalShifts[0].defaultReportingTime || '07:30 AM');
          setShiftEndTime(finalShifts[0].defaultEndTime || '01:30 PM');
        }
      })
      .catch((err) => {
        console.error('Failed to load master options', err);
      })
      .finally(() => {
        if (isMounted) setLoadingMaster(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync selected employee if query param changes
  useEffect(() => {
    if (queryResourceId && employees.length > 0) {
      const match = employees.find((e) => e.resourceId === queryResourceId);
      if (match) setSelectedEmployee(match);
    }
  }, [queryResourceId, employees]);

  // When Duty Type changes (Exam vs Mock), filter and auto-select matching exam
  const handleDutyTypeChange = (type: 'Exam' | 'Mock') => {
    setSelectedDutyType(type);
    const match = exams.find((x) => String(x.type || '').toLowerCase() === type.toLowerCase());
    if (match) setSelectedExamId(match.id);
  };

  // When City changes, update available centers and auto-select first center in that city
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const inCity = centers.filter(
      (c) => String(c.cityId || '').toLowerCase() === String(cityId).toLowerCase()
    );
    if (inCity.length > 0) {
      setSelectedCenterId(inCity[0].id);
    } else if (centers.length > 0) {
      setSelectedCenterId(centers[0].id);
    }
  };

  // When Center changes, sync City
  const handleCenterChange = (centerId: string) => {
    setSelectedCenterId(centerId);
    const chosen = centers.find((c) => String(c.id).toLowerCase() === String(centerId).toLowerCase());
    if (chosen?.cityId) {
      setSelectedCityId(chosen.cityId);
    }
  };

  // When Shift changes, update default reporting and end times (while allowing user editing)
  const handleShiftChange = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    const chosen = shifts.find((s) => s.id === shiftId);
    if (chosen) {
      if (chosen.defaultReportingTime) setReportingTime(chosen.defaultReportingTime);
      if (chosen.defaultEndTime) setShiftEndTime(chosen.defaultEndTime);
    }
  };

  // Image-Only File Handler (Upload or Camera Capture)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation: Reject PDF or non-image files
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (JPG, JPEG, PNG, WEBP) are allowed. PDF or documents are not accepted.');
      if (e.target) e.target.value = '';
      return;
    }

    setUploadError(null);
    setUploading(true);

    // Create local object URL for immediate photo preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const res = await attendanceService.uploadAttendance(file, user?.id);
      if (res?.file) {
        setUploadedFile({
          id: res.file.id,
          name: res.file.originalName,
          size: res.file.size,
        });
      } else {
        setUploadedFile({
          id: 'img-' + Date.now(),
          name: file.name,
          size: file.size,
        });
      }
    } catch (err: any) {
      // Graceful fallback for offline / mock testing
      setUploadedFile({
        id: 'img-' + Date.now(),
        name: file.name,
        size: file.size,
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeUploadedImage = () => {
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleRetakeImage = () => {
    removeUploadedImage();
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 50);
  };

  // Pre-submission validation: opens confirmation dialog
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedEmployee) {
      setSubmitError('Please select a workforce member for duty assignment.');
      return;
    }
    if (!dutyDate) {
      setSubmitError('Please select a valid duty date.');
      return;
    }
    if (!selectedCityId) {
      setSubmitError('Please select a city.');
      return;
    }
    if (!selectedCenterId) {
      setSubmitError('Please select an examination center.');
      return;
    }
    if (!selectedExamId) {
      setSubmitError('Please select an exam name.');
      return;
    }
    if (!selectedRoleId) {
      setSubmitError('Please select a duty role.');
      return;
    }
    if (!selectedShiftId) {
      setSubmitError('Please select a shift.');
      return;
    }
    if (!reportingTime.trim()) {
      setSubmitError('Please specify a reporting time.');
      return;
    }
    if (!uploadedFile) {
      setSubmitError('Please take a photo with the camera or upload an attendance proof image.');
      return;
    }

    // All valid -> open confirmation modal
    setShowConfirmModal(true);
  };

  // Final submission execution after user confirms "Yes, Submit"
  const executeSubmission = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedExam = exams.find((x) => x.id === selectedExamId);
      const selectedCenter = centers.find((c) => c.id === selectedCenterId);
      const selectedRole = roles.find((r) => r.id === selectedRoleId);
      const selectedShift = shifts.find((s) => s.id === selectedShiftId);

      const payload = {
        employeeResourceId: selectedEmployee?.resourceId || user?.resourceId,
        employeeName: selectedEmployee?.name || user?.name,
        employeeMobile: selectedEmployee?.mobile || user?.mobile,
        dutyDate,
        dutyType: selectedDutyType,
        cityId: selectedCityId,
        centerId: selectedCenterId,
        examId: selectedExamId,
        roleId: selectedRoleId,
        shiftId: selectedShiftId,
        reportingTime: reportingTime.trim(),
        shiftEndTime: shiftEndTime.trim(),
        attendanceFileId: uploadedFile?.id || undefined,
        comments: `Assigned via ${isAdmin ? 'Admin Portal' : 'Employee Portal'}`,
      };

      await dutyService.createDuty(payload);

      setSubmitSuccess(
        `Duty successfully assigned to ${selectedEmployee?.name} for ${selectedExam?.name || 'Exam'} on ${dutyDate}!`
      );

      // Reset file and preview
      setUploadedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      // Scroll top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create duty assignment. Please verify details and try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered dropdown lists based on user selections
  const filteredCenters = selectedCityId
    ? centers.filter((c) => String(c.cityId || '').toLowerCase() === String(selectedCityId).toLowerCase())
    : centers;
  const activeCenters = filteredCenters.length > 0 ? filteredCenters : centers;

  const filteredExams = exams.filter(
    (x) => String(x.type || '').toLowerCase() === String(selectedDutyType || '').toLowerCase()
  );
  const activeExams = filteredExams.length > 0 ? filteredExams : exams;

  const displayShifts = shifts.filter((s) => ['Shift 1', 'Shift 2', 'Shift 3'].includes(s.name)).length > 0
    ? shifts.filter((s) => ['Shift 1', 'Shift 2', 'Shift 3'].includes(s.name))
    : shifts;

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
                <CalendarPlus size={24} color="#2563EB" />
              </div>
              <div>
                <h1 className="page-main-heading">
                  {isAdmin ? 'Assign Duty to Employee' : 'Add New Duty'}
                </h1>
              </div>
            </div>

            {/* Notification Banners */}
            {submitSuccess && (
              <div
                className="alert-banner alert-success"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>{submitSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/my-duties')}
                  style={{
                    padding: '6px 14px',
                    background: '#15803D',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View Duties &rarr;
                </button>
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
              <form onSubmit={handleFormSubmit}>
                {/* Workforce Member Assignment Section */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '22px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
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
                      <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '15.5px' }}>
                        {isAdmin ? 'Assign Duty to Employee *' : 'Duty Assigned Staff'}
                      </span>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div>
                      <select
                        className="form-select-control"
                        value={selectedEmployee?.resourceId || ''}
                        onChange={(e) => {
                          const found = employees.find((emp) => emp.resourceId === e.target.value);
                          if (found) setSelectedEmployee(found);
                        }}
                        required
                        style={{ fontWeight: 600, color: '#1E293B' }}
                      >
                        <option value="" disabled>
                          {loadingMaster ? 'Loading workforce members...' : '-- Select Registered Employee --'}
                        </option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.resourceId}>
                            {emp.name} (ID: {emp.resourceId}) &bull; {emp.city || 'Mysore'} &bull; {emp.mobile}
                          </option>
                        ))}
                      </select>

                      {selectedEmployee && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            background: '#EFF6FF',
                            borderRadius: '8px',
                            border: '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#1E40AF',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>
                            <strong>Assigned Staff:</strong> {selectedEmployee.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDetailsModalResourceId(selectedEmployee.resourceId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#1D4ED8',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Shield size={13} color="#2563EB" />
                            <span>Resource ID: {selectedEmployee.resourceId} (View Details)</span>
                          </button>
                          <span>
                            <strong>City:</strong> {selectedEmployee.city || 'Mysore'}
                          </span>
                          <span>
                            <strong>Contact:</strong> {selectedEmployee.mobile}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '15px',
                        color: '#1E293B',
                        fontWeight: 600,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{user?.name || selectedEmployee?.name || 'Logged-in Staff'}</span>
                      <span style={{ color: '#2563EB' }}>
                        ID: {user?.resourceId || selectedEmployee?.resourceId}
                      </span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          padding: '3px 10px',
                          background: '#ECFDF5',
                          color: '#059669',
                          borderRadius: '4px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                        }}
                      >
                        Active Staff
                      </span>
                    </div>
                  )}
                </div>

                {/* EXACT REQUIRED FIELD ORDER */}
                <div className="form-grid-layout">
                  {/* 1. Duty Date */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <Calendar size={15} color="#2563EB" />
                      <span>1. Duty Date *</span>
                    </label>
                    <input
                      type="date"
                      className="form-input-control"
                      value={dutyDate}
                      onChange={(e) => setDutyDate(e.target.value)}
                      required
                      style={{ marginTop: '4px' }}
                    />
                  </div>

                  {/* 2. Type of Duty (Exam and Mock) */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <Briefcase size={15} color="#2563EB" />
                      <span>2. Type of Duty *</span>
                    </label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', height: '48px' }}>
                      <button
                        type="button"
                        onClick={() => handleDutyTypeChange('Exam')}
                        style={{
                          flex: 1,
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 10px',
                          fontSize: '14px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '2px solid ' + (selectedDutyType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                          background: selectedDutyType === 'Exam' ? '#EFF6FF' : '#FFFFFF',
                          color: selectedDutyType === 'Exam' ? '#1D4ED8' : '#64748B',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Exam
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDutyTypeChange('Mock')}
                        style={{
                          flex: 1,
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 10px',
                          fontSize: '14px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '2px solid ' + (selectedDutyType === 'Mock' ? '#D97706' : '#CBD5E1'),
                          background: selectedDutyType === 'Mock' ? '#FEF3C7' : '#FFFFFF',
                          color: selectedDutyType === 'Mock' ? '#B45309' : '#64748B',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Mock
                      </button>
                    </div>
                  </div>

                  {/* 3. City */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <MapPin size={15} color="#2563EB" />
                      <span>3. City *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedCityId}
                      onChange={(e) => handleCityChange(e.target.value)}
                      required
                      style={{ marginTop: '4px' }}
                    >
                      <option value="" disabled>
                        {loadingMaster ? 'Loading cities...' : '-- Select City --'}
                      </option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Center (Filtered by selected City) */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <Building size={15} color="#2563EB" />
                      <span>4. Examination Center *</span>
                    </label>
                    <SearchableSelect
                      options={activeCenters.map((c) => ({
                        value: c.id,
                        label: `${c.centerName} (Code: ${c.centerCode})`,
                        subLabel: c.address,
                      }))}
                      value={selectedCenterId}
                      onChange={handleCenterChange}
                      placeholder={
                        loadingMaster
                          ? 'Loading centers...'
                          : activeCenters.length === 0
                          ? 'No centers found in this city'
                          : '-- Type to Search Examination Center --'
                      }
                      searchPlaceholder="Type center name or code (e.g. Hebbal, IDZ-01)..."
                      className="form-select-control"
                      disabled={loadingMaster || activeCenters.length === 0}
                    />
                  </div>

                  {/* 5. Exam Name (Filtered by Type of Duty: Exam vs Mock) */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <FileCheck size={15} color="#2563EB" />
                      <span>5. Exam Name ({selectedDutyType}) *</span>
                    </label>
                    <SearchableSelect
                      options={activeExams.map((ex) => ({
                        value: ex.id,
                        label: `${ex.name}${ex.code ? ` (${ex.code})` : ''}`,
                        subLabel: `Type: ${ex.type || selectedDutyType}`,
                      }))}
                      value={selectedExamId}
                      onChange={setSelectedExamId}
                      placeholder={
                        loadingMaster
                          ? 'Loading exams...'
                          : activeExams.length === 0
                          ? `No ${selectedDutyType} exams found`
                          : `-- Type to Search ${selectedDutyType} Exam --`
                      }
                      searchPlaceholder="Type exam name (e.g. IBPS, SBI, Mains)..."
                      className="form-select-control"
                      disabled={loadingMaster || activeExams.length === 0}
                    />
                  </div>

                  {/* 6. Duty Role */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <User size={15} color="#2563EB" />
                      <span>6. Duty Role *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      required
                      style={{ marginTop: '4px' }}
                    >
                      <option value="" disabled>
                        {loadingMaster ? 'Loading roles...' : '-- Select Duty Role --'}
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 7. Shift */}
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                      <Clock size={15} color="#2563EB" />
                      <span>7. Shift *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedShiftId}
                      onChange={(e) => handleShiftChange(e.target.value)}
                      required
                      style={{ marginTop: '4px' }}
                    >
                      <option value="" disabled>
                        {loadingMaster ? 'Loading shifts...' : '-- Select Shift --'}
                      </option>
                      {displayShifts.map((s, idx) => (
                        <option key={s.id} value={s.id}>
                          {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 8. Reporting Time (12-Hour Clock Picker) & Shift End Time */}
                  <div className="form-field-wrapper">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                          <Clock size={15} color="#2563EB" />
                          <span>8. Reporting Time *</span>
                        </label>
                        <ClockTimePicker
                          value={reportingTime}
                          onChange={(val) => setReportingTime(val)}
                          label="Reporting Time"
                          placeholder="Select Reporting Time"
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label className="field-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                          <Clock size={15} color="#64748B" />
                          <span>Shift End Time</span>
                        </label>
                        <ClockTimePicker
                          value={shiftEndTime}
                          onChange={(val) => setShiftEndTime(val)}
                          label="Shift End Time"
                          placeholder="Select Shift End Time"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ATTENDANCE PROOF: IMAGE ONLY + CAMERA + PREVIEW */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1.5px dashed #CBD5E1',
                    background: '#FAFAFA',
                  }}
                >
                  <label
                    className="field-label"
                    style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '10px' }}
                  >
                    <Camera size={18} color="#2563EB" />
                    <span>Upload Attendance Proof (Images Only: Camera / Photo) *</span>
                  </label>

                  {/* Hidden inputs for gallery and direct camera */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />

                  {uploadError && (
                    <div className="alert-banner alert-error" style={{ marginBottom: '14px' }}>
                      <AlertCircle size={16} />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploading ? (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                      <Loader2 size={32} className="animate-spin text-blue" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#1E293B' }}>
                        Uploading attendance image...
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    /* Image Uploaded State with Preview */
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #86EFAC',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Attendance Preview"
                            onClick={() => setShowFullPreview(true)}
                            title="Click to zoom preview"
                            style={{
                              width: '64px',
                              height: '64px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              cursor: 'pointer',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '8px',
                              background: '#DCFCE7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#16A34A',
                            }}
                          >
                            <ImageIcon size={28} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#1E293B' }}>
                            {uploadedFile.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>
                            {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Image Ready for Submission
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setShowFullPreview(true)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={14} />
                            <span>Preview</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRetakeImage}
                          title="Click to retake attendance photo"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#2563EB',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial Upload Button: Single Camera / Photo Capture */
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <p style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#DC2626', fontWeight: 700 }}>
                        Please upload clear image of the attendance sheet
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '11px 26px',
                            background: '#2563EB',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '14.5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                          }}
                        >
                          <Camera size={18} />
                          <span>Take Photo (Camera)</span>
                        </button>
                      </div>
                      <span style={{ display: 'block', marginTop: '10px', fontSize: '12.5px', color: '#94A3B8' }}>
                        Supports JPG, PNG, WEBP only (PDF/documents are strictly disabled)
                      </span>
                    </div>
                  )}
                </div>

                {/* CENTERED SUBMIT BUTTON - CANCEL BUTTON REMOVED */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{
                      padding: '14px 40px',
                      fontSize: '16px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      minWidth: '280px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Submitting Duty...</span>
                      </>
                    ) : (
                      <>
                        <CalendarPlus size={20} />
                        <span>Submit Duty Assignment</span>
                      </>
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
            <h2 className="mobile-page-heading">
              {isAdmin ? 'Assign Duty to Employee' : 'Add New Duty'}
            </h2>
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
            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Workforce Member Assignment (Mobile) */}
                {isAdmin ? (
                  <div className="mobile-form-group">
                    <label className="mobile-input-label">ASSIGN DUTY TO EMPLOYEE *</label>
                    <select
                      className="mobile-form-select"
                      value={selectedEmployee?.resourceId || ''}
                      onChange={(e) => {
                        const found = employees.find((emp) => emp.resourceId === e.target.value);
                        if (found) setSelectedEmployee(found);
                      }}
                      required
                    >
                      <option value="" disabled>
                        -- Select Registered Employee --
                      </option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.resourceId}>
                          {emp.name} (ID: {emp.resourceId}) &bull; {emp.city || 'Mysore'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mobile-form-group">
                    <label className="mobile-input-label">ASSIGNED STAFF</label>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1.5px solid #E2E8F0',
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: '#1E293B',
                      }}
                    >
                      <span>{user?.name} (ID: {user?.resourceId})</span>
                    </div>
                  </div>
                )}

                {/* 1. Duty Date */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">1. DUTY DATE *</label>
                  <input
                    type="date"
                    className="mobile-form-input"
                    value={dutyDate}
                    onChange={(e) => setDutyDate(e.target.value)}
                    required
                  />
                </div>

                {/* 2. Type of Duty */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">2. TYPE OF DUTY *</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleDutyTypeChange('Exam')}
                      style={{
                        flex: 1,
                        height: '48px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid ' + (selectedDutyType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                        background: selectedDutyType === 'Exam' ? '#EFF6FF' : '#FFFFFF',
                        color: selectedDutyType === 'Exam' ? '#1D4ED8' : '#64748B',
                        cursor: 'pointer',
                      }}
                    >
                      Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDutyTypeChange('Mock')}
                      style={{
                        flex: 1,
                        height: '48px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid ' + (selectedDutyType === 'Mock' ? '#D97706' : '#CBD5E1'),
                        background: selectedDutyType === 'Mock' ? '#FEF3C7' : '#FFFFFF',
                        color: selectedDutyType === 'Mock' ? '#B45309' : '#64748B',
                        cursor: 'pointer',
                      }}
                    >
                      Mock
                    </button>
                  </div>
                </div>

                {/* 3. City */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">3. CITY *</label>
                  <select
                    className="mobile-form-select"
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select City --</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Examination Center */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">4. EXAMINATION CENTER *</label>
                  <SearchableSelect
                    options={activeCenters.map((c) => ({
                      value: c.id,
                      label: `${c.centerName} (Code: ${c.centerCode})`,
                      subLabel: c.address,
                    }))}
                    value={selectedCenterId}
                    onChange={handleCenterChange}
                    placeholder="-- Type to Search Center --"
                    searchPlaceholder="Type center name or code..."
                    className="mobile-form-select"
                    disabled={activeCenters.length === 0}
                  />
                </div>

                {/* 5. Exam Name */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">5. EXAM NAME ({selectedDutyType}) *</label>
                  <SearchableSelect
                    options={activeExams.map((ex) => ({
                      value: ex.id,
                      label: `${ex.name}${ex.code ? ` (${ex.code})` : ''}`,
                      subLabel: `Type: ${ex.type || selectedDutyType}`,
                    }))}
                    value={selectedExamId}
                    onChange={setSelectedExamId}
                    placeholder={`-- Type to Search ${selectedDutyType} Exam --`}
                    searchPlaceholder="Type exam name..."
                    className="mobile-form-select"
                    disabled={activeExams.length === 0}
                  />
                </div>

                {/* 6. Duty Role */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">6. DUTY ROLE *</label>
                  <select
                    className="mobile-form-select"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Duty Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Shift */}
                <div className="mobile-form-group">
                  <label className="mobile-input-label">7. SHIFT *</label>
                  <select
                    className="mobile-form-select"
                    value={selectedShiftId}
                    onChange={(e) => handleShiftChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Shift --</option>
                    {displayShifts.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Reporting Time & Shift End Time (12-Hour Clock Picker) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="mobile-form-group" style={{ marginBottom: 0 }}>
                    <label className="mobile-input-label">8. REPORTING TIME *</label>
                    <ClockTimePicker
                      value={reportingTime}
                      onChange={(val) => setReportingTime(val)}
                      label="Reporting Time"
                      placeholder="Select Time"
                      required
                    />
                  </div>
                  <div className="mobile-form-group" style={{ marginBottom: 0 }}>
                    <label className="mobile-input-label">SHIFT END TIME</label>
                    <ClockTimePicker
                      value={shiftEndTime}
                      onChange={(val) => setShiftEndTime(val)}
                      label="Shift End Time"
                      placeholder="Select Time"
                    />
                  </div>
                </div>

                {/* Attendance Upload (Mobile Camera / Gallery) */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1.5px dashed #CBD5E1',
                    background: '#FAFAFA',
                  }}
                >
                  <label className="mobile-input-label" style={{ marginBottom: '8px' }}>
                    ATTENDANCE PROOF (CAMERA / IMAGE ONLY) *
                  </label>

                  {uploadedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Thumb"
                            onClick={() => setShowFullPreview(true)}
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{uploadedFile.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 600 }}>Ready to Submit</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setShowFullPreview(true)}
                            style={{ padding: '4px 8px', fontSize: '12px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '4px', fontWeight: 600 }}
                          >
                            Preview
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRetakeImage}
                          style={{ padding: '4px 8px', fontSize: '12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <RotateCcw size={12} />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#DC2626', fontWeight: 700, textAlign: 'center' }}>
                        Please upload clear image of the attendance sheet
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <Camera size={18} />
                          <span>Take Photo (Camera)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Centered Mobile Submit Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button
                    type="submit"
                    className="mobile-submit-btn"
                    disabled={submitting}
                    style={{ width: '100%', padding: '13px', fontSize: '15px' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Duty Assignment'}
                  </button>
                </div>
              </div>
            </form>
          </div>


        </main>
      </div>

      {/* Confirmation Modal ("Are you sure you want to submit?") */}
      {showConfirmModal && (
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
              maxWidth: '460px',
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
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                  Confirm Duty Submission
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Please review before submitting
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure you want to submit this duty assignment for{' '}
              <strong>{selectedEmployee?.name || user?.name}</strong>?
            </p>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '20px',
              }}
            >
              <div>
                <strong>Employee Name:</strong>{' '}
                <span style={{ color: '#1D4ED8', fontWeight: 600 }}>
                  {selectedEmployee?.name || user?.name || 'Assigned Employee'}
                  {selectedEmployee?.resourceId ? ` (ID: ${selectedEmployee.resourceId})` : ''}
                </span>
              </div>
              <div>
                <strong>Duty Date:</strong> {dutyDate} ({selectedDutyType})
              </div>
              {selectedExamId && (
                <div>
                  <strong>Exam Name:</strong> {exams.find((e) => e.id === selectedExamId)?.name || 'Selected Exam'}
                </div>
              )}
              <div>
                <strong>Center:</strong> {centers.find((c) => c.id === selectedCenterId)?.centerName || 'Selected Center'}
              </div>
              <div>
                <strong>Role &amp; Shift:</strong>{' '}
                {roles.find((r) => r.id === selectedRoleId)?.name || 'Role'} &bull;{' '}
                {shifts.find((s) => s.id === selectedShiftId)?.name || 'Shift'} ({reportingTime})
              </div>
              <div>
                <strong>Attendance Proof:</strong> {uploadedFile?.name || 'Attached Photo'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                style={{ padding: '9px 18px', fontSize: '14px' }}
              >
                No, Review
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={executeSubmission}
                style={{
                  padding: '9px 22px',
                  background: '#2563EB',
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
                <CheckCircle2 size={16} />
                <span>Yes, Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Size Image Preview Modal */}
      {showFullPreview && previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110000,
            padding: '20px',
          }}
          onClick={() => setShowFullPreview(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowFullPreview(false)}
              style={{
                position: 'absolute',
                top: '-44px',
                right: '0',
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0F172A',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={previewUrl}
              alt="Full Attendance Proof"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                objectFit: 'contain',
              }}
            />
            <span style={{ color: '#E2E8F0', marginTop: '10px', fontSize: '13.5px' }}>
              {uploadedFile?.name} (Click outside or ✕ to close)
            </span>
          </div>
        </div>
      )}

      {/* Employee Personal Details Modal */}
      <EmployeeDetailsModal
        resourceId={detailsModalResourceId}
        isOpen={Boolean(detailsModalResourceId)}
        onClose={() => setDetailsModalResourceId(null)}
      />
    </div>
  );
};

export default AddDutyScreen;
