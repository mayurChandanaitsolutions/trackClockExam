import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DesktopTopNav } from '../../components/DesktopTopNav';
import { SweetAlertToast } from '../../components/SweetAlertToast';
import { DesktopSidebar } from '../../components/DesktopSidebar';
import { MobileHeader } from '../../components/MobileHeader';
import {
  ClipboardList,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import dutyService, { DutyItem } from '../../services/duty.service';
import masterService, { Center, Exam, Role, Shift, EmployeeItem, City } from '../../services/master.service';
import authService from '../../services/auth.service';
import EmployeeDetailsModal from '../../components/EmployeeDetailsModal';
import { ExportJobsCard } from '../../components/ExportJobsCard';
import { normalizeDateToYMD } from '../../utils/excelExport';

export const AdminWorkforceDutiesScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).toastMessage) {
      setToastMessage((location.state as any).toastMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  // Employee details modal state
  const [detailsModalResourceId, setDetailsModalResourceId] = useState<string | null>(null);

  // Selected duty for Edit Modal
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master options for edit modal
  const [roles, setRoles] = useState<Role[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);

  // Load duties from backend & synchronized local cache
  const fetchDuties = async () => {
    setLoading(true);
    try {
      const backendItems = await dutyService.getMyDuties(
        undefined,
        searchQuery,
        'ALL',
        examTypeFilter === 'All' ? undefined : examTypeFilter
      );

      let localItems: DutyItem[] = [];
      try {
        const raw = localStorage.getItem('cached_assigned_duties');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localItems = parsed;
        }
      } catch (e) {
        console.error('Failed to read local cached duties', e);
      }

      const combined = [...(backendItems || [])];
      for (const loc of localItems) {
        const exists = combined.some(
          (b) =>
            b.id === loc.id ||
            (b.dutyDate === loc.dutyDate &&
              (b.centerId === loc.centerId || b.center?.centerName === loc.center?.centerName) &&
              (b.shiftId === loc.shiftId || b.shift?.name === loc.shift?.name) &&
              (b.employee?.resourceId === loc.employee?.resourceId || b.employeeId === loc.employeeId))
        );
        if (!exists) {
          combined.push(loc);
        }
      }

      setDuties(combined);
    } catch (err) {
      console.error('Failed to load duties from backend:', err);
      try {
        const raw = localStorage.getItem('cached_assigned_duties');
        if (raw) {
          const parsed = JSON.parse(raw);
          setDuties(Array.isArray(parsed) ? parsed : []);
          return;
        }
      } catch {}
      setDuties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, [examTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchQuery, examTypeFilter]);

  useEffect(() => {
    masterService.getRoles().then(setRoles).catch(() => {});
    masterService.getShifts().then(setShifts).catch(() => {});
    masterService.getExams().then(setExams).catch(() => {});
    masterService.getCities().then(setCities).catch(() => {});
    masterService.getCenters().then(setCenters).catch(() => {});
    masterService.getEmployees().then(setEmployees).catch(() => {});
  }, []);

  const filteredDuties = duties.filter((d) => {
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

  const totalPages = Math.max(1, Math.ceil(filteredDuties.length / adminPageSize));
  const displayedDuties = filteredDuties.slice((currentPage - 1) * adminPageSize, currentPage * adminPageSize);

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
        reportingTime: editReportingTime,
        shiftEndTime: editShiftEndTime,
      });

      const chosenExam = exams.find((x) => x.id === editExamId);
      const chosenCity = cities.find((c) => c.id === editCityId);
      const chosenCenter = centers.find((c) => c.id === editCenterId);
      const chosenRole = roles.find((r) => r.id === editRoleId);
      const chosenShift = shifts.find((s) => s.id === editShiftId);

      setDuties((prev) =>
        prev.map((d) => {
          if (d.id !== editingDuty.id) return d;
          return {
            ...d,
            dutyDate: editDate,
            dutyType: editDutyType,
            examId: editExamId,
            exam: chosenExam ? { ...d.exam, id: chosenExam.id, name: chosenExam.name, type: editDutyType } : d.exam,
            cityId: editCityId,
            city: chosenCity ? { id: chosenCity.id, name: chosenCity.name } : d.city,
            centerId: editCenterId,
            center: chosenCenter
              ? { id: chosenCenter.id, centerCode: chosenCenter.centerCode, centerName: chosenCenter.centerName }
              : d.center,
            roleId: editRoleId,
            role: chosenRole ? { id: chosenRole.id, name: chosenRole.name, code: chosenRole.code || '' } : d.role,
            shiftId: editShiftId,
            shift: chosenShift ? { id: chosenShift.id, name: chosenShift.name } : d.shift,
            reportingTime: editReportingTime,
            shiftEndTime: editShiftEndTime,
          };
        })
      );

      try {
        const raw = localStorage.getItem('cached_assigned_duties');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map((item: any) =>
            item.id === editingDuty.id
              ? {
                  ...item,
                  dutyDate: editDate,
                  dutyType: editDutyType,
                  cityId: editCityId,
                  centerId: editCenterId,
                  examId: editExamId,
                  roleId: editRoleId,
                  shiftId: editShiftId,
                  reportingTime: editReportingTime,
                  shiftEndTime: editShiftEndTime,
                }
              : item
          );
          localStorage.setItem('cached_assigned_duties', JSON.stringify(updated));
        }
      } catch (cacheErr) {
        console.error('Failed to update local cached duty', cacheErr);
      }

      setEditingDuty(null);
      setToastMessage('Duty details updated successfully.');
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update duty. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDuty) return;
    setDeleteLoading(true);

    try {
      await dutyService.deleteDuty(deletingDuty.id);

      setDuties((prev) => prev.filter((d) => d.id !== deletingDuty.id));

      try {
        const raw = localStorage.getItem('cached_assigned_duties');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.filter((item: any) => item.id !== deletingDuty.id);
          localStorage.setItem('cached_assigned_duties', JSON.stringify(updated));
        }
      } catch (cacheErr) {
        console.error('Failed to delete from local cache', cacheErr);
      }

      setDeletingDuty(null);
      setToastMessage('Duty record deleted successfully.');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete duty. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="unified-dashboard-root animate-fade-in">
      <SweetAlertToast
        show={Boolean(toastMessage)}
        message={toastMessage || ''}
        onClose={() => setToastMessage(null)}
      />

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
                  <h1 className="page-main-heading">Workforce Duties Management</h1>
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

                  {/* Exam Type Filter */}
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
                        const rowNumber = (currentPage - 1) * adminPageSize + idx + 1;

                        return (
                          <tr key={duty.id}>
                            <td className="col-num" style={{ textAlign: 'center' }}>{rowNumber}</td>
                            <td className="col-date" style={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                              {duty.dutyDate}
                            </td>
                            <td className="col-member">
                              <div>
                                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '15px' }}>
                                  {duty.employee?.name || 'Assigned Staff'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDetailsModalResourceId(duty.employee?.resourceId || null)
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
                                  ID: {duty.employee?.resourceId || '---'}
                                </button>
                              </div>
                            </td>
                            <td className="col-exam">
                              <div style={{ fontWeight: 600, color: '#1E293B' }}>
                                {duty.exam?.name || 'Standard Exam'}
                              </div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  marginTop: '3px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  background: isMock ? '#FEF3C7' : '#EFF6FF',
                                  color: isMock ? '#B45309' : '#1D4ED8',
                                  border: `1px solid ${isMock ? '#FDE68A' : '#BFDBFE'}`,
                                }}
                              >
                                {isMock ? 'Mock Duty' : 'Official Exam'}
                              </span>
                            </td>
                            <td className="col-city" style={{ fontWeight: 500, color: '#334155' }}>
                              {duty.city?.name || duty.employee?.city || 'Mysore'}
                            </td>
                            <td className="col-center">
                              <div style={{ fontWeight: 600, color: '#1E293B' }}>
                                {duty.center?.centerName || 'Examination Center'}
                              </div>
                              {duty.center?.centerCode && (
                                <div style={{ fontSize: '12px', color: '#64748B' }}>
                                  Code: {duty.center.centerCode}
                                </div>
                              )}
                            </td>
                            <td className="col-role">
                              <span className="badge-role">{duty.role?.name || 'Supervisor'}</span>
                            </td>
                            <td className="col-shift">
                              <div style={{ fontWeight: 600, color: '#1E293B' }}>
                                {duty.shift?.name || 'Shift 1'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748B' }}>
                                {duty.reportingTime || duty.shift?.defaultReportingTime || '07:30 AM'} -{' '}
                                {duty.shiftEndTime || duty.shift?.defaultEndTime || '01:30 PM'}
                              </div>
                            </td>
                            <td className="col-action" style={{ textAlign: 'center' }}>
                              <div className="action-button-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <button
                                  className="action-icon-btn view"
                                  title="View details"
                                  onClick={() => setViewingDuty(duty)}
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  className="action-icon-btn edit"
                                  title="Edit duty assignment"
                                  onClick={() => handleOpenEdit(duty)}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  className="action-icon-btn delete"
                                  title="Delete duty"
                                  onClick={() => setDeletingDuty(duty)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Numbered Pagination Bar */}
              {filteredDuties.length > 0 && (
                <div
                  className="trackclock-pagination-wrap"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderTop: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
                    Showing{' '}
                    <strong style={{ color: '#1E293B' }}>
                      {(currentPage - 1) * adminPageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong style={{ color: '#1E293B' }}>
                      {Math.min(currentPage * adminPageSize, filteredDuties.length)}
                    </strong>{' '}
                    of <strong style={{ color: '#1E293B' }}>{filteredDuties.length}</strong> records
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                        color: currentPage === 1 ? '#94A3B8' : '#1E293B',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      &larr; Back
                    </button>

                    {getPageNumbers().map((num, i) =>
                      num === '...' ? (
                        <span key={`ellipsis-${i}`} style={{ padding: '0 6px', color: '#94A3B8' }}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${num}`}
                          type="button"
                          onClick={() => setCurrentPage(num as number)}
                          style={{
                            minWidth: '32px',
                            height: '32px',
                            padding: '0 8px',
                            borderRadius: '6px',
                            border: currentPage === num ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                            background: currentPage === num ? '#2563EB' : '#FFFFFF',
                            color: currentPage === num ? '#FFFFFF' : '#1E293B',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {num}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                        color: currentPage === totalPages ? '#94A3B8' : '#1E293B',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TrackClock HR Style Export Card */}
            <ExportJobsCard
              duties={duties}
              employees={employees}
            />
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />

        <main className="mobile-content-body">
          <div className="mobile-page-title-row">
            <h2 className="mobile-page-heading">Workforce Duties</h2>
          </div>

          {/* Date Filter */}
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
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: '#1E293B',
                cursor: 'pointer',
                fontWeight: 600,
                flex: 1,
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
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="mobile-search-bar" style={{ marginBottom: '12px' }}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search exam, member, center..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="mobile-clear-btn">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Exam Type Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto' }}>
            {(['All', 'Exam', 'Mock'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setExamTypeFilter(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: examTypeFilter === type ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                  background: examTypeFilter === type ? '#EFF6FF' : '#FFFFFF',
                  color: examTypeFilter === type ? '#1D4ED8' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {type === 'All' ? 'All Duties' : type}
              </button>
            ))}
          </div>

          {/* Mobile Duty Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Loader2 size={30} className="animate-spin text-blue" />
              <p style={{ marginTop: '10px', color: '#64748B' }}>Loading duties...</p>
            </div>
          ) : filteredDuties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: '12px' }}>
              <ClipboardList size={36} color="#94A3B8" />
              <p style={{ marginTop: '10px', color: '#64748B', fontWeight: 600 }}>No duties match your filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedDuties.map((duty) => {
                const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';
                return (
                  <div
                    key={duty.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      padding: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>
                          {duty.employee?.name || 'Assigned Staff'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetailsModalResourceId(duty.employee?.resourceId || null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: '12.5px',
                            color: '#2563EB',
                            fontWeight: 600,
                            textDecoration: 'underline',
                          }}
                        >
                          ID: {duty.employee?.resourceId}
                        </button>
                      </div>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isMock ? '#FEF3C7' : '#EFF6FF',
                          color: isMock ? '#B45309' : '#1D4ED8',
                        }}
                      >
                        {isMock ? 'Mock' : 'Exam'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                      <strong>{duty.exam?.name || 'Exam'}</strong> &bull; {duty.dutyDate}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '10px' }}>
                      {duty.center?.centerName} ({duty.city?.name || 'Mysore'}) &bull; {duty.shift?.name}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setViewingDuty(duty)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(duty)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: '#F0FDF4',
                          color: '#166534',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingDuty(duty)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile Export Card */}
          <div style={{ marginTop: '20px' }}>
            <ExportJobsCard duties={duties} employees={employees} />
          </div>
        </main>
      </div>

      {/* Viewing Duty Details Modal */}
      {viewingDuty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100050,
            padding: '20px',
          }}
          onClick={() => setViewingDuty(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Duty Assignment Details</h3>
              <button
                type="button"
                onClick={() => setViewingDuty(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Staff Name</span>
                <strong>{viewingDuty.employee?.name || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Resource ID</span>
                <strong>{viewingDuty.employee?.resourceId || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Duty Date</span>
                <strong>{viewingDuty.dutyDate}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Duty Type</span>
                <strong>{viewingDuty.dutyType || viewingDuty.exam?.type || 'Exam'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Exam Name</span>
                <strong>{viewingDuty.exam?.name || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Duty Role</span>
                <strong>{viewingDuty.role?.name || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Center</span>
                <strong>{viewingDuty.center?.centerName || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>City</span>
                <strong>{viewingDuty.city?.name || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Shift</span>
                <strong>{viewingDuty.shift?.name || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Timings</span>
                <strong>{viewingDuty.reportingTime || '07:30 AM'} - {viewingDuty.shiftEndTime || '01:30 PM'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setViewingDuty(null)}
                className="btn-primary"
                style={{ padding: '8px 20px', borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Duty Modal */}
      {editingDuty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100050,
            padding: '20px',
          }}
          onClick={() => setEditingDuty(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '580px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Edit Duty Assignment</h3>
              <button
                type="button"
                onClick={() => setEditingDuty(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="alert-banner alert-error" style={{ marginBottom: '14px' }}>
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Duty Date</label>
                  <input
                    type="date"
                    className="form-input-control"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Type of Duty</label>
                  <div style={{ display: 'flex', gap: '10px', height: '40px' }}>
                    <button
                      type="button"
                      onClick={() => setEditDutyType('Exam')}
                      style={{
                        flex: 1,
                        borderRadius: '6px',
                        border: '2px solid ' + (editDutyType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                        background: editDutyType === 'Exam' ? '#EFF6FF' : '#FFFFFF',
                        color: editDutyType === 'Exam' ? '#1D4ED8' : '#64748B',
                        fontWeight: 700,
                      }}
                    >
                      Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDutyType('Mock')}
                      style={{
                        flex: 1,
                        borderRadius: '6px',
                        border: '2px solid ' + (editDutyType === 'Mock' ? '#D97706' : '#CBD5E1'),
                        background: editDutyType === 'Mock' ? '#FEF3C7' : '#FFFFFF',
                        color: editDutyType === 'Mock' ? '#B45309' : '#64748B',
                        fontWeight: 700,
                      }}
                    >
                      Mock
                    </button>
                  </div>
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Exam Name</label>
                  <select
                    className="form-select-control"
                    value={editExamId}
                    onChange={(e) => setEditExamId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Exam --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>City</label>
                  <select
                    className="form-select-control"
                    value={editCityId}
                    onChange={(e) => handleEditCityChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select City --</option>
                    {cities.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Center</label>
                  <select
                    className="form-select-control"
                    value={editCenterId}
                    onChange={(e) => setEditCenterId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Center --</option>
                    {centers
                      .filter((c) => !editCityId || c.cityId === editCityId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.centerName} ({c.centerCode})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Duty Role</label>
                  <select
                    className="form-select-control"
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Shift</label>
                  <select
                    className="form-select-control"
                    value={editShiftId}
                    onChange={(e) => handleEditShiftChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Shift --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>Reporting Time</label>
                    <input
                      type="text"
                      className="form-input-control"
                      value={editReportingTime}
                      onChange={(e) => setEditReportingTime(e.target.value)}
                      placeholder="07:30 AM"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: '13px', fontWeight: 600 }}>End Time</label>
                    <input
                      type="text"
                      className="form-input-control"
                      value={editShiftEndTime}
                      onChange={(e) => setEditShiftEndTime(e.target.value)}
                      placeholder="01:30 PM"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingDuty(null)}
                    style={{ padding: '8px 18px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={editSaving}
                    style={{ padding: '8px 24px', borderRadius: '6px' }}
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDuty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100060,
            padding: '20px',
          }}
          onClick={() => setDeletingDuty(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Delete Duty Assignment</h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748B' }}>
              Are you sure you want to delete this duty record for{' '}
              <strong>{deletingDuty.employee?.name || 'Staff'}</strong> on <strong>{deletingDuty.dutyDate}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeletingDuty(null)}
                style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 600, color: '#475569' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '10px', background: '#DC2626', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#FFFFFF' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {detailsModalResourceId && (
        <EmployeeDetailsModal
          isOpen={Boolean(detailsModalResourceId)}
          resourceId={detailsModalResourceId}
          onClose={() => setDetailsModalResourceId(null)}
          onDeleted={() => {
            setDetailsModalResourceId(null);
            fetchDuties();
          }}
        />
      )}
    </div>
  );
};

export default AdminWorkforceDutiesScreen;
