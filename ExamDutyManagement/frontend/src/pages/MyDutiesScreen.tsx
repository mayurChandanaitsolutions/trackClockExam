import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  User,
  X,
  AlertTriangle,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import dutyService, { DutyItem } from '../services/duty.service';
import masterService, { Center, Exam, Role, Shift, EmployeeItem, City } from '../services/master.service';
import authService from '../services/auth.service';
import EmployeeDetailsModal from '../components/EmployeeDetailsModal';
import { ExportJobsCard } from '../components/ExportJobsCard';
import { normalizeDateToYMD } from '../utils/excelExport';
import { API_BASE_URL } from '../config/api.config';

export const MyDutiesScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');

  const [duties, setDuties] = useState<DutyItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [examTypeFilter, setExamTypeFilter] = useState<'All' | 'Exam' | 'Mock'>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const adminPageSize = 15;
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected duty for Details Modal
  const [viewingDuty, setViewingDuty] = useState<DutyItem | null>(null);

  // Attendance document preview lightbox modal
  const [previewDocDuty, setPreviewDocDuty] = useState<DutyItem | null>(null);

  // Employee details modal state
  const [detailsModalResourceId, setDetailsModalResourceId] = useState<string | null>(null);

  // Selected duty for Edit Modal (All details display & edit)
  const [editingDuty, setEditingDuty] = useState<DutyItem | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editExamId, setEditExamId] = useState<string>('');
  const [editDutyType, setEditDutyType] = useState<'Exam' | 'Mock'>('Exam');
  const [editCityId, setEditCityId] = useState<string>('');
  const [editCenterId, setEditCenterId] = useState<string>('');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [editShiftId, setEditShiftId] = useState<string>('');
  const [editReportingTime, setEditReportingTime] = useState<string>('07:30 AM');
  const [editShiftEndTime, setEditShiftEndTime] = useState<string>('01:30 PM');
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm modal
  const [deletingDuty, setDeletingDuty] = useState<DutyItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Master options for edit modal
  const [roles, setRoles] = useState<Role[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);

  // Load duties from backend
  const fetchDuties = async () => {
    setLoading(true);
    try {
      const resourceParam = isAdmin ? 'ALL' : (user?.resourceId || '');
      const items = await dutyService.getMyDuties(
        undefined,
        searchQuery,
        resourceParam,
        examTypeFilter === 'All' ? undefined : examTypeFilter
      );
      setDuties(items || []);
    } catch (err) {
      console.error('Failed to load duties from backend:', err);
      setDuties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, [examTypeFilter]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchQuery, examTypeFilter]);

  useEffect(() => {
    // Load master data for edit modal dropdowns and export card
    masterService.getRoles().then(setRoles).catch(() => {});
    masterService.getShifts().then(setShifts).catch(() => {});
    masterService.getExams().then(setExams).catch(() => {});
    masterService.getCities().then(setCities).catch(() => {});
    masterService.getCenters().then(setCenters).catch(() => {});
    if (isAdmin) {
      masterService.getEmployees().then(setEmployees).catch(() => {});
    }
  }, [isAdmin]);

  // Filter duties locally when search query typed, date selected, or exam type toggled
  const filteredDuties = duties.filter((d) => {
    // Date filter (Employee / Admin)
    if (dateFilter) {
      const dutyDateYMD = normalizeDateToYMD(d.dutyDate);
      const filterYMD = normalizeDateToYMD(dateFilter);
      if (dutyDateYMD !== filterYMD && d.dutyDate !== dateFilter) {
        return false;
      }
    }
    if (examTypeFilter !== 'All') {
      const currentType = d.dutyType || d.exam?.type || 'Exam';
      if (currentType !== examTypeFilter) return false;
    }

    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    const examName = d.exam?.name?.toLowerCase() || '';
    const centerName = d.center?.centerName?.toLowerCase() || '';
    const centerCode = d.center?.centerCode?.toLowerCase() || '';
    const empName = d.employee?.name?.toLowerCase() || '';
    const empResId = d.employee?.resourceId?.toLowerCase() || '';
    return (
      examName.includes(term) ||
      centerName.includes(term) ||
      centerCode.includes(term) ||
      empName.includes(term) ||
      empResId.includes(term)
    );
  });

  // Admin Pagination calculations (15 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredDuties.length / adminPageSize));
  const displayedDuties = isAdmin
    ? filteredDuties.slice((currentPage - 1) * adminPageSize, currentPage * adminPageSize)
    : filteredDuties;

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

  // Attendance document preview URL helper
  const getProofUrl = (duty: DutyItem | null): string => {
    if (!duty) return '';
    const fileId = duty.attendanceFile?.id || duty.attendanceFileId;
    if (fileId) {
      return `${API_BASE_URL}/attendance/file/${encodeURIComponent(fileId)}`;
    }
    if (duty.attendanceFile?.filePath) {
      const fileName = duty.attendanceFile.filePath.replace(/^.*[\\\/]/, '');
      return `${API_BASE_URL}/attendance/view-by-name/${encodeURIComponent(fileName)}`;
    }
    return '';
  };

  // Edit duty handler - Populates ALL duty details entered
  const handleOpenEdit = (duty: DutyItem) => {
    setEditingDuty(duty);
    setEditDate(duty.dutyDate || '');
    setEditExamId(duty.examId || duty.exam?.id || '');
    setEditDutyType((duty.dutyType || duty.exam?.type || 'Exam') as 'Exam' | 'Mock');
    setEditCityId(duty.cityId || duty.city?.id || '');
    setEditCenterId(duty.centerId || duty.center?.id || '');
    setEditRoleId(duty.roleId || duty.role?.id || '');
    setEditShiftId(duty.shiftId || duty.shift?.id || '');
    setEditReportingTime(duty.reportingTime || duty.shift?.defaultReportingTime || '07:30 AM');
    setEditShiftEndTime(duty.shiftEndTime || duty.shift?.defaultEndTime || '01:30 PM');
    setEditError(null);
  };

  const handleEditShiftChange = (shiftId: string) => {
    setEditShiftId(shiftId);
    const s = shifts.find((sh) => sh.id === shiftId);
    if (s) {
      if (s.defaultReportingTime) setEditReportingTime(s.defaultReportingTime);
      if (s.defaultEndTime) setEditShiftEndTime(s.defaultEndTime);
    }
  };

  const handleEditCityChange = (cityId: string) => {
    setEditCityId(cityId);
    const available = centers.filter((c) => c.cityId === cityId);
    if (available.length > 0 && !available.some((c) => c.id === editCenterId)) {
      setEditCenterId(available[0].id);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDuty) return;

    setEditSaving(true);
    setEditError(null);

    try {
      await dutyService.updateDuty(editingDuty.id, {
        dutyDate: editDate,
        examId: editExamId || undefined,
        dutyType: editDutyType,
        cityId: editCityId || undefined,
        centerId: editCenterId || undefined,
        roleId: editRoleId || undefined,
        shiftId: editShiftId || undefined,
        reportingTime: editReportingTime || undefined,
        shiftEndTime: editShiftEndTime || undefined,
      });

      // Close modal and refresh list
      setEditingDuty(null);
      await fetchDuties();
    } catch (err: any) {
      setEditError(
        err.response?.data?.message || err.message || 'Failed to update duty assignment'
      );
    } finally {
      setEditSaving(false);
    }
  };

  // Delete duty handler
  const handleConfirmDelete = async () => {
    if (!deletingDuty) return;

    setDeleteLoading(true);
    try {
      await dutyService.deleteDuty(deletingDuty.id);
      setDeletingDuty(null);
      await fetchDuties();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete duty');
    } finally {
      setDeleteLoading(false);
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
            {/* Header row */}
            <div className="page-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="page-header-icon-box">
                  <ClipboardList size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">
                    {isAdmin ? 'Workforce Duties Management' : 'My Duties'}
                  </h1>
                  <p className="page-sub-heading">
                    {isAdmin
                      ? 'Monitor, verify, and track examination duties across all registered workforce members'
                      : 'View, search, and manage all your assigned examination duties'}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="duties-filter-toolbar">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Clean Date Filter */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '4px 12px',
                      height: '38px',
                    }}
                  >
                    <Calendar size={15} color="#2563EB" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Date:</span>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: '13.5px',
                        color: '#1E293B',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    />
                    {dateFilter && (
                      <button
                        type="button"
                        onClick={() => setDateFilter('')}
                        title="Clear date filter"
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748B',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Exam Type Filter: Only for Admin */}
                  {isAdmin && (
                    <div className="exam-type-filter-group">
                      <span className="filter-group-title">Exam Type:</span>
                      {(['All', 'Exam', 'Mock'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`type-filter-pill ${examTypeFilter === type ? 'active' : ''}`}
                          onClick={() => setExamTypeFilter(type)}
                        >
                          {type === 'All' ? 'All Types' : type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Search input */}
              <div className="search-input-wrapper">
                <Search size={16} className="search-leading-icon" />
                <input
                  type="text"
                  placeholder="Search exam, member, center..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-field"
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Main Duties Table */}
            <div className="duties-table-container-card">
              {loading ? (
                <div className="empty-state-card">
                  <Loader2 size={32} className="animate-spin text-blue" />
                  <p>Loading duties from database...</p>
                </div>
              ) : filteredDuties.length === 0 ? (
                <div className="empty-state-card">
                  <ClipboardList size={40} color="#94A3B8" />
                  <h3>No Duties Found</h3>
                  <p>No duty records match your selected filter or search keyword.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="duties-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Sl No</th>
                      <th style={{ minWidth: '110px' }}>Date</th>
                      <th style={{ minWidth: '180px' }}>Name</th>
                      <th style={{ minWidth: '170px' }}>Exam Name &amp; Type</th>
                      <th style={{ minWidth: '100px' }}>City</th>
                      <th style={{ minWidth: '190px' }}>Exam Center</th>
                      <th style={{ minWidth: '120px' }}>Role</th>
                      <th style={{ minWidth: '160px' }}>Shift &amp; Hours</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedDuties.map((duty, idx) => {
                      const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';
                      const rowNumber = isAdmin ? (currentPage - 1) * adminPageSize + idx + 1 : idx + 1;

                      return (
                        <tr key={duty.id}>
                          {/* 1. Sl No */}
                          <td className="col-num" style={{ textAlign: 'center' }}>{rowNumber}</td>

                          {/* 2. Date */}
                          <td className="col-date" style={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {duty.dutyDate}
                          </td>

                          {/* 3. Name */}
                          <td className="col-member">
                            <div>
                              <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '15px' }}>
                                {duty.employee?.name || user?.name || 'Assigned Staff'}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setDetailsModalResourceId(duty.employee?.resourceId || user?.resourceId || null)
                                }
                                title="Click to view full personal details (Aadhaar, PAN, etc.)"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  fontSize: '13px',
                                  color: '#2563EB',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                              >
                                ID: {duty.employee?.resourceId || user?.resourceId || '---'}
                              </button>
                            </div>
                          </td>

                          {/* 4. Exam Name & Type */}
                          <td className="col-exam">
                            <strong>{duty.exam?.name || duty.dutyType}</strong>
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '6px',
                                padding: '2px 8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '12px',
                                background: isMock ? '#FEF3C7' : '#EFF6FF',
                                color: isMock ? '#B45309' : '#1D4ED8',
                              }}
                            >
                              {duty.dutyType || duty.exam?.type || 'Exam'}
                            </span>
                          </td>

                          {/* 5. City */}
                          <td className="col-city" style={{ fontWeight: 600, color: '#0F766E' }}>
                            {duty.city?.name || duty.employee?.city || '---'}
                          </td>

                          {/* 6. Exam Center */}
                          <td className="col-center">
                            <div style={{ fontWeight: 600, color: '#1E293B' }}>
                              {duty.center?.centerName || 'Examination Center'}
                            </div>
                            <span className="center-code-tag">
                              Code: {duty.center?.centerCode || '---'}
                            </span>
                          </td>

                          {/* 7. Role */}
                          <td className="col-role" style={{ fontWeight: 600, color: '#475569' }}>
                            {duty.role?.code || duty.role?.name || 'Invigilator'}
                          </td>

                          {/* 8. Shift & Hours */}
                          <td className="col-shift">
                            <div style={{ fontWeight: 600, color: '#1E293B' }}>{duty.shift?.name || 'Shift 1'}</div>
                            <span style={{ fontSize: '13px', color: '#64748B', whiteSpace: 'nowrap' }}>
                              {duty.reportingTime || '07:30 AM'} - {duty.shiftEndTime || '01:30 PM'}
                            </span>
                          </td>

                          {/* 9. Actions (View, Edit, Delete) */}
                          <td className="col-action" style={{ textAlign: 'center' }}>
                            <div className="action-button-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              {/* View Details */}
                              <button
                                className="action-icon-btn view"
                                title="View details"
                                onClick={() => setViewingDuty(duty)}
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit (Admin only) */}
                              {isAdmin && (
                                <button
                                  className="action-icon-btn edit"
                                  title="Edit duty assignment"
                                  onClick={() => handleOpenEdit(duty)}
                                >
                                  <Edit2 size={15} />
                                </button>
                              )}

                              {/* Delete (Admin only) */}
                              {isAdmin && (
                                <button
                                  className="action-icon-btn delete"
                                  title="Delete duty"
                                  onClick={() => setDeletingDuty(duty)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Horizontal Numbered Pagination Bar (Admin Portal Only) */}
            {isAdmin && filteredDuties.length > 0 && (
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
                    *Showing {(currentPage - 1) * adminPageSize + 1} -{' '}
                    {Math.min(currentPage * adminPageSize, filteredDuties.length)} of{' '}
                    {filteredDuties.length} records (15 per page)
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

            {/* TrackClock HR Style Export Card */}
            {isAdmin && (
              <ExportJobsCard
                duties={duties}
                employees={employees}
              />
            )}
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />

        <main className="mobile-content-body">
          <div className="mobile-page-title-row">
            <h2 className="mobile-page-heading">{isAdmin ? 'Workforce Duties' : 'My Duties'}</h2>
          </div>

          {/* Date Filter (Mobile) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '10px',
            }}
          >
            <Calendar size={16} color="#2563EB" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: '#1E293B',
                fontWeight: 600,
              }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Exam Type Pills in Mobile */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {(['All', 'Exam', 'Mock'] as const).map((type) => (
              <button
                key={type}
                type="button"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid ' + (examTypeFilter === type ? '#2563EB' : '#E2E8F0'),
                  background: examTypeFilter === type ? '#EFF6FF' : '#FFFFFF',
                  color: examTypeFilter === type ? '#1D4ED8' : '#64748B',
                }}
                onClick={() => setExamTypeFilter(type)}
              >
                {type === 'All' ? 'All Types' : type}
              </button>
            ))}
          </div>



          {/* Search box in Mobile */}
          <div className="mobile-search-box">
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search exam, member, center..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Cards List in Mobile */}
          <div className="mobile-duties-list">
            {(isAdmin ? displayedDuties : filteredDuties).map((duty) => {
              const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';

              return (
                <div key={duty.id} className="mobile-duty-card-elevated">
                  {/* Member Badge Header (Admin Only) */}
                  {isAdmin && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} color="#2563EB" />
                        <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#1E293B' }}>
                          {duty.employee?.name || user?.name || 'Assigned Staff'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailsModalResourceId(duty.employee?.resourceId || user?.resourceId || null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '13px',
                          color: '#2563EB',
                          textDecoration: 'underline',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Click to view personal details"
                      >
                        ID: {duty.employee?.resourceId || user?.resourceId || '---'}
                      </button>
                    </div>
                  )}

                  <div className="mobile-card-head">
                    <div>
                      <span className="card-exam-title">{duty.exam?.name || duty.dutyType}</span>
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: '6px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          background: isMock ? '#FEF3C7' : '#EFF6FF',
                          color: isMock ? '#B45309' : '#1D4ED8',
                        }}
                      >
                        {duty.dutyType || duty.exam?.type || 'Exam'}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-card-meta-list">
                    <div className="meta-line">
                      <Calendar size={13} />
                      <span>{duty.dutyDate}</span>
                    </div>
                    <div className="meta-line">
                      <MapPin size={13} />
                      <span>
                        {duty.center?.centerName} (Code: {duty.center?.centerCode})
                      </span>
                    </div>
                    <div className="meta-line">
                      <Clock size={13} />
                      <span>
                        {duty.shift?.name} ({duty.reportingTime || '07:30 AM'} -{' '}
                        {duty.shiftEndTime || '01:30 PM'})
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mobile-card-actions">
                    <button
                      className="mobile-card-btn view"
                      onClick={() => setViewingDuty(duty)}
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                    {isAdmin && (
                      <button
                        className="mobile-card-btn edit"
                        onClick={() => handleOpenEdit(duty)}
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="mobile-card-btn delete"
                        onClick={() => setDeletingDuty(duty)}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Horizontal Numbered Pagination Bar (Admin Portal Only) */}
          {isAdmin && filteredDuties.length > 0 && (
            <div
              className="trackclock-pagination-wrap"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 14px',
                borderRadius: '8px',
                marginTop: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <button
                type="button"
                className="trackclock-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                &larr;
              </button>

              {getPageNumbers().map((item, i) =>
                item === '...' ? (
                  <span key={`m-ellipsis-${i}`} className="trackclock-page-ellipsis">
                    ...
                  </span>
                ) : (
                  <button
                    key={`m-page-${item}`}
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
              >
                &rarr;
              </button>
            </div>
          )}

          {/* TrackClock HR Style Export Card (Mobile) */}
          {isAdmin && (
            <div style={{ marginTop: '16px' }}>
              <ExportJobsCard
                duties={duties}
                employees={employees}
              />
            </div>
          )}
        </main>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingDuty && (
        <div className="modal-overlay" onClick={() => setViewingDuty(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Duty Assignment Details</h3>
              <button className="modal-close-btn" onClick={() => setViewingDuty(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-details">
              {/* Assigned Member Card */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '15px',
                  }}
                >
                  {viewingDuty.employee?.name ? viewingDuty.employee.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '17px' }}>
                    {viewingDuty.employee?.name || user?.name || 'Assigned Staff Member'}
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#475569', marginTop: '2px' }}>
                    Staff / Resource ID:{' '}
                    <button
                      type="button"
                      onClick={() =>
                        setDetailsModalResourceId(viewingDuty.employee?.resourceId || user?.resourceId || null)
                      }
                      title="Click to view & update personal details (Aadhaar, PAN, etc.)"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#2563EB',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                      }}
                    >
                      {viewingDuty.employee?.resourceId || user?.resourceId || '---'} (View Details)
                    </button>
                    {viewingDuty.employee?.mobile && (
                      <span> &bull; Mobile: {viewingDuty.employee.mobile}</span>
                    )}
                    {viewingDuty.employee?.email && (
                      <span> &bull; Email: {viewingDuty.employee.email}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-field">
                <span className="detail-label">Exam Name</span>
                <span className="detail-value bold">{viewingDuty.exam?.name}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Exam Type</span>
                <span className="detail-value">{viewingDuty.dutyType || viewingDuty.exam?.type || 'Exam'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Date of Duty</span>
                <span className="detail-value">{viewingDuty.dutyDate}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Center Name</span>
                <span className="detail-value">{viewingDuty.center?.centerName}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Center Code</span>
                <span className="detail-value">{viewingDuty.center?.centerCode}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">City</span>
                <span className="detail-value">{viewingDuty.city?.name}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Assigned Role</span>
                <span className="detail-value">{viewingDuty.role?.code || viewingDuty.role?.name}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Shift &amp; Hours</span>
                <span className="detail-value">
                  {viewingDuty.shift?.name} ({viewingDuty.reportingTime || '07:30 AM'} to{' '}
                  {viewingDuty.shiftEndTime || '01:30 PM'})
                </span>
              </div>
              {viewingDuty.attendanceFile && (
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Attendance Proof Document</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDocDuty(viewingDuty)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        background: '#EFF6FF',
                        border: '1.5px solid #3B82F6',
                        borderRadius: '8px',
                        color: '#1D4ED8',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(37,99,235,0.1)',
                        transition: 'all 0.15s ease',
                      }}
                      title="Click to view uploaded attendance document / image"
                    >
                      <FileText size={16} color="#2563EB" />
                      <span>✓ {viewingDuty.attendanceFile.originalName || 'attendance_document.pdf'}</span>
                      {viewingDuty.attendanceFile.size && (
                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                          ({(viewingDuty.attendanceFile.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                      <Eye size={15} style={{ marginLeft: '4px' }} />
                    </button>
                    <a
                      href={getProofUrl(viewingDuty)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '13px',
                        color: '#2563EB',
                        textDecoration: 'underline',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>Open in New Tab</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-row">
              <button className="btn-secondary" onClick={() => setViewingDuty(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE PROOF DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewDocDuty && (
        <div className="modal-overlay" onClick={() => setPreviewDocDuty(null)} style={{ zIndex: 120000 }}>
          <div
            className="modal-content-card animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>
                  Attendance Proof Document
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                  {previewDocDuty.attendanceFile?.originalName || 'attendance_proof.pdf'} &bull; Assigned to{' '}
                  <strong>{previewDocDuty.employee?.name || user?.name}</strong>
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewDocDuty(null)}>
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: '380px',
                maxHeight: '68vh',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0F172A',
                borderRadius: '8px',
                padding: '12px',
                margin: '12px 0',
              }}
            >
              <img
                src={getProofUrl(previewDocDuty)}
                alt="Uploaded Attendance Proof"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('iframe')) {
                    const iframe = document.createElement('iframe');
                    iframe.src = getProofUrl(previewDocDuty);
                    iframe.style.width = '100%';
                    iframe.style.height = '500px';
                    iframe.style.border = 'none';
                    iframe.style.borderRadius = '6px';
                    iframe.style.background = '#FFFFFF';
                    parent.appendChild(iframe);
                  }
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              />
            </div>

            <div className="modal-footer-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={getProofUrl(previewDocDuty)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink size={15} />
                <span>Open in New Tab</span>
              </a>
              <button className="btn-primary" onClick={() => setPreviewDocDuty(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DUTY MODAL (All duty details display & edit) */}
      {editingDuty && (
        <div className="modal-overlay" onClick={() => setEditingDuty(null)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: '650px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Edit Workforce Duty</h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Update examination duty details for this staff member
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingDuty(null)}>
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="alert-banner alert-error" style={{ margin: '14px 20px 0' }}>
                <AlertTriangle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', padding: '16px 20px' }}>
                {/* 1. Employee Info Header Card (Full Width) */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: '#EFF6FF',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {editingDuty.employee?.name ? editingDuty.employee.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '16.5px' }}>
                      {editingDuty.employee?.name || user?.name || 'Assigned Staff Member'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                      Resource ID: <strong>{editingDuty.employee?.resourceId || user?.resourceId || '---'}</strong>
                      {editingDuty.employee?.mobile && <span> &bull; Mobile: {editingDuty.employee.mobile}</span>}
                      {editingDuty.employee?.email && <span> &bull; {editingDuty.employee.email}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Exam Name */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Exam Name *</label>
                  <select
                    className="form-select-control"
                    value={editExamId}
                    onChange={(e) => setEditExamId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="" disabled>-- Select Exam --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Duty Type (Exam / Mock) */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Duty Type *</label>
                  <div style={{ display: 'flex', gap: '8px', height: '38px', alignItems: 'center' }}>
                    {(['Exam', 'Mock'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditDutyType(type)}
                        style={{
                          flex: 1,
                          height: '36px',
                          border: `1.5px solid ${editDutyType === type ? '#2563EB' : '#CBD5E1'}`,
                          background: editDutyType === type ? '#EFF6FF' : '#FFFFFF',
                          color: editDutyType === type ? '#1D4ED8' : '#64748B',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Duty Date */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Duty Date *</label>
                  <input
                    type="date"
                    className="form-input-control"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 5. City */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>City *</label>
                  <select
                    className="form-select-control"
                    value={editCityId}
                    onChange={(e) => handleEditCityChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="" disabled>-- Select City --</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Center */}
                <div className="form-field-wrapper" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Examination Center *</label>
                  <select
                    className="form-select-control"
                    value={editCenterId}
                    onChange={(e) => setEditCenterId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="" disabled>-- Select Center --</option>
                    {centers
                      .filter((c) => !editCityId || c.cityId === editCityId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.centerName} (Code: {c.centerCode})
                        </option>
                      ))}
                  </select>
                </div>

                {/* 7. Assigned Role */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Assigned Role *</label>
                  <select
                    className="form-select-control"
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="" disabled>-- Select Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Shift */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Shift &amp; Timings *</label>
                  <select
                    className="form-select-control"
                    value={editShiftId}
                    onChange={(e) => handleEditShiftChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="" disabled>-- Select Shift --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.defaultReportingTime || '07:30 AM'} - {s.defaultEndTime || '01:30 PM'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9. Reporting Time & Shift End Time */}
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Reporting Time</label>
                  <input
                    type="text"
                    className="form-input-control"
                    value={editReportingTime}
                    onChange={(e) => setEditReportingTime(e.target.value)}
                    placeholder="e.g. 07:30 AM"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div className="form-field-wrapper" style={{ gridColumn: 'span 1' }}>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Shift End Time</label>
                  <input
                    type="text"
                    className="form-input-control"
                    value={editShiftEndTime}
                    onChange={(e) => setEditShiftEndTime(e.target.value)}
                    placeholder="e.g. 01:30 PM"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 10. Attendance File Proof Info */}
                {editingDuty.attendanceFile && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                      <FileText size={16} color="#2563EB" />
                      <span>
                        Attendance Proof: <strong>{editingDuty.attendanceFile.originalName || 'Document'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDocDuty(editingDuty)}
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={13} />
                      <span>View File</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer-row" style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingDuty(null)}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {editSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDuty && (
        <div className="modal-overlay" onClick={() => setDeletingDuty(null)}>
          <div className="modal-content-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Confirm Delete Duty</h3>
              <button className="modal-close-btn" onClick={() => setDeletingDuty(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ color: '#475569', fontSize: '15.5px', lineHeight: '1.5' }}>
                Are you sure you want to delete the duty for{' '}
                <strong>{deletingDuty.exam?.name}</strong> on{' '}
                <strong>{deletingDuty.dutyDate}</strong>?
              </p>
              <p style={{ color: '#DC2626', fontSize: '14.5px', marginTop: '8px' }}>
                This action will remove the record from Microsoft SQL Server.
              </p>
            </div>

            <div className="modal-footer-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingDuty(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Duty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE PERSONAL DETAILS MODAL */}
      <EmployeeDetailsModal
        resourceId={detailsModalResourceId}
        isOpen={Boolean(detailsModalResourceId)}
        onClose={() => setDetailsModalResourceId(null)}
      />
    </div>
  );
};

export default MyDutiesScreen;
