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
  CheckCircle,
  Clock3,
  XCircle,
  X,
  AlertTriangle,
  Loader2,
  Plus,
  Users,
} from 'lucide-react';
import dutyService, { DutyItem } from '../services/duty.service';
import masterService, { Center, Exam, Role, Shift } from '../services/master.service';
import authService from '../services/auth.service';

export const MyDutiesScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.resourceId === '17655');

  const [duties, setDuties] = useState<DutyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [examTypeFilter, setExamTypeFilter] = useState<'All' | 'Exam' | 'Mock'>('All');
  const [scope, setScope] = useState<'all' | 'my'>(isAdmin ? 'all' : 'my');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected duty for Details Modal
  const [viewingDuty, setViewingDuty] = useState<DutyItem | null>(null);

  // Selected duty for Edit Modal
  const [editingDuty, setEditingDuty] = useState<DutyItem | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [editShiftId, setEditShiftId] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm modal
  const [deletingDuty, setDeletingDuty] = useState<DutyItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Master options for edit modal
  const [roles, setRoles] = useState<Role[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Load duties from backend
  const fetchDuties = async () => {
    setLoading(true);
    try {
      const resourceParam = scope === 'my' && user?.resourceId ? user.resourceId : 'ALL';
      const items = await dutyService.getMyDuties(
        activeTab === 'All' ? undefined : activeTab,
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
  }, [activeTab, examTypeFilter, scope]);

  useEffect(() => {
    // Load master roles & shifts for edit dropdowns
    masterService.getRoles().then(setRoles).catch(() => {});
    masterService.getShifts().then(setShifts).catch(() => {});
  }, []);

  // Filter duties locally when search query typed or exam type toggled
  const filteredDuties = duties.filter((d) => {
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

  // Edit duty handler
  const handleOpenEdit = (duty: DutyItem) => {
    if (duty.status === 'Approved') {
      alert('Approved duties cannot be edited.');
      return;
    }
    setEditingDuty(duty);
    setEditDate(duty.dutyDate);
    setEditRoleId(duty.roleId || duty.role?.id || '');
    setEditShiftId(duty.shiftId || duty.shift?.id || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDuty) return;

    setEditSaving(true);
    setEditError(null);

    try {
      await dutyService.updateDuty(editingDuty.id, {
        dutyDate: editDate,
        roleId: editRoleId || undefined,
        shiftId: editShiftId || undefined,
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

    if (deletingDuty.status === 'Approved') {
      alert('Approved duties cannot be deleted.');
      setDeletingDuty(null);
      return;
    }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="status-badge-chip approved">
            <CheckCircle size={12} /> Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="status-badge-chip pending">
            <Clock3 size={12} /> Pending
          </span>
        );
      case 'Rejected':
        return (
          <span className="status-badge-chip rejected">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return <span className="status-badge-chip">{status}</span>;
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
            <div className="page-section-header" style={{ justifyContent: 'space-between' }}>
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
                      : 'View, search, and track the status of all your assigned examination duties'}
                  </p>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => navigate('/add-duty')}
                style={{ padding: '10px 18px' }}
              >
                <Plus size={16} />
                <span>{isAdmin ? 'Add Employee / Duty' : 'Add Duty'}</span>
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="duties-filter-toolbar">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Scope Selector: All Workforce Duties vs My Duties */}
                  <div className="scope-toggle-group">
                    <button
                      type="button"
                      className={`scope-toggle-btn ${scope === 'all' ? 'active' : ''}`}
                      onClick={() => setScope('all')}
                    >
                      <Users size={14} />
                      <span>All Workforce Duties</span>
                    </button>
                    <button
                      type="button"
                      className={`scope-toggle-btn ${scope === 'my' ? 'active' : ''}`}
                      onClick={() => setScope('my')}
                    >
                      <User size={14} />
                      <span>My Assigned Duties</span>
                    </button>
                  </div>

                  {/* Exam Type Filter: All Types / Exam / Mock */}
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

                {/* Status Tabs */}
                <div className="filter-tabs-group">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`tab-filter-btn ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
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
                <table className="duties-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>Assigned Member</th>
                      <th>Exam Name &amp; Type</th>
                      <th>Duty Date</th>
                      <th>Examination Center</th>
                      <th>City</th>
                      <th>Role</th>
                      <th>Shift &amp; Hours</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDuties.map((duty, idx) => {
                      const isApproved = duty.status === 'Approved';
                      const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';

                      return (
                        <tr key={duty.id}>
                          <td className="col-num">{idx + 1}</td>
                          <td className="col-member">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#EFF6FF',
                                  color: '#2563EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {duty.employee?.name ? duty.employee.name.charAt(0).toUpperCase() : 'M'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
                                  {duty.employee?.name || user?.name || 'Assigned Staff'}
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748B' }}>
                                  ID: {duty.employee?.resourceId || user?.resourceId || '---'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="col-exam">
                            <strong>{duty.exam?.name || duty.dutyType}</strong>
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '6px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '12px',
                                background: isMock ? '#FEF3C7' : '#EFF6FF',
                                color: isMock ? '#B45309' : '#1D4ED8',
                              }}
                            >
                              {duty.dutyType || duty.exam?.type || 'Exam'}
                            </span>
                          </td>
                          <td className="col-date">{duty.dutyDate}</td>
                          <td className="col-center">
                            <div>{duty.center?.centerName || 'Examination Center'}</div>
                            <span className="center-code-tag">
                              Code: {duty.center?.centerCode || '---'}
                            </span>
                          </td>
                          <td className="col-city">{duty.city?.name || '---'}</td>
                          <td className="col-role">{duty.role?.code || duty.role?.name || 'Invigilator'}</td>
                          <td className="col-shift">
                            <div>{duty.shift?.name || 'Shift 1'}</div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                              {duty.reportingTime || '07:30 AM'} - {duty.shiftEndTime || '01:30 PM'}
                            </span>
                          </td>
                          <td className="col-status">{getStatusBadge(duty.status)}</td>
                          <td className="col-action" style={{ textAlign: 'center' }}>
                            <div className="action-button-group">
                              {/* View Details */}
                              <button
                                className="action-icon-btn view"
                                title="View details"
                                onClick={() => setViewingDuty(duty)}
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit (Pending or Rejected only) */}
                              <button
                                className={`action-icon-btn edit ${isApproved ? 'disabled' : ''}`}
                                title={
                                  isApproved
                                    ? 'Approved duties cannot be edited'
                                    : 'Edit duty assignment'
                                }
                                disabled={isApproved}
                                onClick={() => handleOpenEdit(duty)}
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Delete (Pending or Rejected only) */}
                              <button
                                className={`action-icon-btn delete ${isApproved ? 'disabled' : ''}`}
                                title={
                                  isApproved
                                    ? 'Approved duties cannot be deleted'
                                    : 'Delete duty'
                                }
                                disabled={isApproved}
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
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 2. MOBILE VIEW */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />

        <main className="mobile-content-body">
          <div className="mobile-page-title-row">
            <h2 className="mobile-page-heading">{isAdmin ? 'Workforce Duties' : 'My Duties'}</h2>
            <button
              className="mobile-add-btn"
              onClick={() => navigate('/add-duty')}
            >
              <Plus size={15} />
              <span>{isAdmin ? 'Add Staff' : 'Add'}</span>
            </button>
          </div>

          {/* Scope Selector in Mobile */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1.5px solid ' + (scope === 'all' ? '#2563EB' : '#CBD5E1'),
                background: scope === 'all' ? '#2563EB' : '#FFFFFF',
                color: scope === 'all' ? '#FFFFFF' : '#475569',
              }}
              onClick={() => setScope('all')}
            >
              All Workforce
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1.5px solid ' + (scope === 'my' ? '#2563EB' : '#CBD5E1'),
                background: scope === 'my' ? '#2563EB' : '#FFFFFF',
                color: scope === 'my' ? '#FFFFFF' : '#475569',
              }}
              onClick={() => setScope('my')}
            >
              My Duties
            </button>
          </div>

          {/* Exam Type Pills in Mobile */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {(['All', 'Exam', 'Mock'] as const).map((type) => (
              <button
                key={type}
                type="button"
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: '11px',
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

          {/* Status filter tabs in Mobile */}
          <div className="mobile-filter-pills">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                className={`mobile-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
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
            {filteredDuties.map((duty) => {
              const isApproved = duty.status === 'Approved';
              const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';

              return (
                <div key={duty.id} className="mobile-duty-card-elevated">
                  {/* Member Badge Header */}
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
                      <User size={13} color="#2563EB" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                        {duty.employee?.name || user?.name || 'Assigned Staff'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                      ID: {duty.employee?.resourceId || user?.resourceId || '---'}
                    </span>
                  </div>

                  <div className="mobile-card-head">
                    <div>
                      <span className="card-exam-title">{duty.exam?.name || duty.dutyType}</span>
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: '6px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          background: isMock ? '#FEF3C7' : '#EFF6FF',
                          color: isMock ? '#B45309' : '#1D4ED8',
                        }}
                      >
                        {duty.dutyType || duty.exam?.type || 'Exam'}
                      </span>
                    </div>
                    {getStatusBadge(duty.status)}
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
                    <button
                      className="mobile-card-btn edit"
                      disabled={isApproved}
                      onClick={() => handleOpenEdit(duty)}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="mobile-card-btn delete"
                      disabled={isApproved}
                      onClick={() => setDeletingDuty(duty)}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>
                    {viewingDuty.employee?.name || user?.name || 'Assigned Staff Member'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Staff / Resource ID: <strong>{viewingDuty.employee?.resourceId || user?.resourceId || '---'}</strong>
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
                <span className="detail-label">Status</span>
                <span>{getStatusBadge(viewingDuty.status)}</span>
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
                  <span className="detail-value text-blue" style={{ fontWeight: 600 }}>
                    ✓ {viewingDuty.attendanceFile.originalName || 'attendance_document.pdf'}
                    {viewingDuty.attendanceFile.size && (
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                        ({(viewingDuty.attendanceFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </span>
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

      {/* EDIT DUTY MODAL */}
      {editingDuty && (
        <div className="modal-overlay" onClick={() => setEditingDuty(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">
                Edit Duty ({editingDuty.exam?.name})
              </h3>
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

            {editingDuty.status === 'Rejected' && (
              <div className="alert-banner alert-warning" style={{ margin: '14px 20px 0' }}>
                <AlertTriangle size={16} />
                <span>Updating a rejected duty will reset its status to Pending for review.</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body-details">
                <div className="form-field-wrapper">
                  <label className="field-label">Duty Date *</label>
                  <input
                    type="text"
                    className="form-input-control"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field-wrapper">
                  <label className="field-label">Role</label>
                  <select
                    className="form-select-control"
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field-wrapper">
                  <label className="field-label">Shift</label>
                  <select
                    className="form-select-control"
                    value={editShiftId}
                    onChange={(e) => setEditShiftId(e.target.value)}
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer-row">
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
                >
                  {editSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure you want to delete the duty for{' '}
                <strong>{deletingDuty.exam?.name}</strong> on{' '}
                <strong>{deletingDuty.dutyDate}</strong>?
              </p>
              <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '8px' }}>
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
    </div>
  );
};

export default MyDutiesScreen;
