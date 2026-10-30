import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DesktopTopNav } from '../../components/DesktopTopNav';
import { SweetAlertToast } from '../../components/SweetAlertToast';
import { DesktopSidebar } from '../../components/DesktopSidebar';
import { MobileHeader } from '../../components/MobileHeader';
import {
  ClipboardList,
  Search,
  Eye,
  Calendar,
  Clock,
  X,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import dutyService, { DutyItem } from '../../services/duty.service';
import authService from '../../services/auth.service';
import { normalizeDateToYMD } from '../../utils/excelExport';
import { API_BASE_URL } from '../../config/api.config';

export const EmployeeMyDutiesScreen: React.FC = () => {
  const location = useLocation();
  const user = authService.getStoredUser();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (location.state && (location.state as any).toastMessage) {
      setToastMessage((location.state as any).toastMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [duties, setDuties] = useState<DutyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [examTypeFilter, setExamTypeFilter] = useState<'All' | 'Exam' | 'Mock'>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected duty for Details Modal
  const [viewingDuty, setViewingDuty] = useState<DutyItem | null>(null);

  // Attendance document preview lightbox modal
  const [previewDocDuty, setPreviewDocDuty] = useState<DutyItem | null>(null);

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const resId = user?.resourceId || '';
      const backendItems = await dutyService.getMyDuties(
        undefined,
        searchQuery,
        resId,
        examTypeFilter === 'All' ? undefined : examTypeFilter
      );

      let localItems: DutyItem[] = [];
      try {
        const raw = localStorage.getItem('cached_assigned_duties');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localItems = parsed.filter(
              (d: any) =>
                d.employee?.resourceId === resId ||
                d.employeeResourceId === resId ||
                d.employeeId === user?.id ||
                d.resourceId === resId
            );
          }
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
              (b.shiftId === loc.shiftId || b.shift?.name === loc.shift?.name))
        );
        if (!exists) combined.push(loc);
      }

      setDuties(combined);
    } catch (err) {
      console.error('Failed to load duties:', err);
      try {
        const raw = localStorage.getItem('cached_assigned_duties');
        if (raw) {
          const parsed = JSON.parse(raw);
          const filtered = parsed.filter(
            (d: any) =>
              d.employee?.resourceId === user?.resourceId ||
              d.employeeResourceId === user?.resourceId ||
              d.employeeId === user?.id
          );
          setDuties(filtered);
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
    return examName.includes(term) || centerName.includes(term) || centerCode.includes(term);
  });

  const getProofUrl = (duty: DutyItem | null): string => {
    if (!duty) return '';
    const fileId = duty.attendanceFile?.id || duty.attendanceFileId;
    if (fileId) {
      return `${API_BASE_URL}/attendance/file/${encodeURIComponent(fileId)}`;
    }
    if (duty.attendanceFile?.filePath) {
      if (duty.attendanceFile.filePath.startsWith('blob:') || duty.attendanceFile.filePath.startsWith('data:')) {
        return duty.attendanceFile.filePath;
      }
      const fileName = duty.attendanceFile.filePath.replace(/^.*[\\\/]/, '');
      return `${API_BASE_URL}/attendance/view-by-name/${encodeURIComponent(fileName)}`;
    }
    return '';
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
            <div className="page-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="page-header-icon-box">
                  <ClipboardList size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">My Duties</h1>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="duties-filter-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
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

                <div className="exam-type-filter-group">
                  <span className="filter-group-title">Type:</span>
                  {(['All', 'Exam', 'Mock'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`type-filter-pill ${examTypeFilter === type ? 'active' : ''}`}
                      onClick={() => setExamTypeFilter(type)}
                    >
                      {type === 'All' ? 'All' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="search-input-wrapper">
                <Search size={16} className="search-leading-icon" />
                <input
                  type="text"
                  placeholder="Search exam or center..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-field"
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Duties Table */}
            <div className="duties-table-container-card">
              {loading ? (
                <div className="empty-state-card">
                  <Loader2 size={32} className="animate-spin text-blue" />
                  <p>Loading your assigned duties...</p>
                </div>
              ) : filteredDuties.length === 0 ? (
                <div className="empty-state-card">
                  <ClipboardList size={40} color="#94A3B8" />
                  <h3>No Duties Assigned</h3>
                  <p>You do not have any assigned exam or mock duties matching this filter.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="duties-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Sl No</th>
                        <th style={{ minWidth: '110px' }}>Date</th>
                        <th style={{ minWidth: '180px' }}>Exam Name &amp; Type</th>
                        <th style={{ minWidth: '110px' }}>City</th>
                        <th style={{ minWidth: '200px' }}>Examination Center</th>
                        <th style={{ minWidth: '130px' }}>Role</th>
                        <th style={{ minWidth: '160px' }}>Shift &amp; Timings</th>
                        <th style={{ minWidth: '130px', textAlign: 'center' }}>Attendance Proof</th>
                        <th style={{ textAlign: 'center', width: '100px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDuties.map((duty, idx) => {
                        const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';
                        const hasProof = Boolean(duty.attendanceFileId || duty.attendanceFile);

                        return (
                          <tr key={duty.id}>
                            <td className="col-num" style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td className="col-date" style={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                              {duty.dutyDate}
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
                              {duty.city?.name || user?.city || 'Mysore'}
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
                                {duty.reportingTime || '07:30 AM'} - {duty.shiftEndTime || '01:30 PM'}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasProof ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocDuty(duty)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    color: '#1D4ED8',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FileText size={14} />
                                  <span>View Proof</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Pending</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="action-icon-btn view"
                                title="View full details"
                                onClick={() => setViewingDuty(duty)}
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
            <h2 className="mobile-page-heading">My Duties</h2>
          </div>

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

          <div className="mobile-search-bar" style={{ marginBottom: '12px' }}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search exam or center..."
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Loader2 size={30} className="animate-spin text-blue" />
              <p style={{ marginTop: '10px', color: '#64748B' }}>Loading duties...</p>
            </div>
          ) : filteredDuties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: '12px' }}>
              <ClipboardList size={36} color="#94A3B8" />
              <p style={{ marginTop: '10px', color: '#64748B', fontWeight: 600 }}>No duties assigned yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredDuties.map((duty) => {
                const isMock = (duty.dutyType || duty.exam?.type) === 'Mock';
                const hasProof = Boolean(duty.attendanceFileId || duty.attendanceFile);

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
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>
                        {duty.exam?.name || 'Exam'}
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

                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                      <strong>Date:</strong> {duty.dutyDate} &bull; <strong>Role:</strong> {duty.role?.name || 'Supervisor'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '8px' }}>
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
                        <Eye size={14} /> View Details
                      </button>
                      {hasProof && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocDuty(duty)}
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
                          <FileText size={14} /> Attendance Proof
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Details Modal */}
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
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Assigned Duty Details</h3>
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
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Duty Date</span>
                <strong>{viewingDuty.dutyDate}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Type</span>
                <strong>{viewingDuty.dutyType || viewingDuty.exam?.type || 'Exam'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Exam</span>
                <strong>{viewingDuty.exam?.name || '---'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Role</span>
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
                <span style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Reporting Time</span>
                <strong>{viewingDuty.reportingTime || '07:30 AM'}</strong>
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

      {/* Attendance Proof Lightbox Modal */}
      {previewDocDuty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100060,
            padding: '20px',
          }}
          onClick={() => setPreviewDocDuty(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={getProofUrl(previewDocDuty)}
              alt="Attendance Proof"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
              onError={(e) => {
                (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="14">Image not found on server</text></svg>';
              }}
            />
            <button
              type="button"
              onClick={() => setPreviewDocDuty(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMyDutiesScreen;

