import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  X,
  Save,
  Upload,
} from 'lucide-react';
import masterService, { Exam } from '../services/master.service';
import authService, { isUserAdmin } from '../services/auth.service';
import { BulkUploadExamModal } from '../components/BulkUploadExamModal';

export const AddExamScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [examName, setExamName] = useState<string>('');
  const [examCode, setExamCode] = useState<string>('');
  const [examType, setExamType] = useState<'Exam' | 'Mock'>('Exam');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Exam' | 'Mock'>('All');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Edit Modal State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editExamName, setEditExamName] = useState<string>('');
  const [editExamCode, setEditExamCode] = useState<string>('');
  const [editExamType, setEditExamType] = useState<'Exam' | 'Mock'>('Exam');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadExams();

    const handleMasterUpdate = () => {
      loadExams();
    };
    window.addEventListener('exam_duty_master_updated', handleMasterUpdate);
    return () => {
      window.removeEventListener('exam_duty_master_updated', handleMasterUpdate);
    };
  }, [isAdmin, navigate]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await masterService.getExams();
      setExams(data || []);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!examName.trim()) {
      setSubmitError('Please enter Exam Name.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await masterService.createExam({
        name: examName.trim(),
        code: examCode.trim() || undefined,
        type: examType,
      });

      // Immediately display in the table below
      setExams((prev) => {
        const withoutOld = prev.filter(
          (x) => x.id !== created.id && x.name.toLowerCase() !== created.name.toLowerCase(),
        );
        return [...withoutOld, created];
      });

      setSubmitSuccess(`Exam "${created.name}" added successfully!`);
      setExamName('');
      setExamCode('');
      setExamType('Exam');
      loadExams();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to add exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setEditExamName(exam.name);
    setEditExamCode(exam.code || '');
    setEditExamType(exam.type === 'Mock' ? 'Mock' : 'Exam');
    setSubmitError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    if (!editExamName.trim()) {
      setSubmitError('Exam Name is required.');
      return;
    }

    setUpdating(true);
    setSubmitError(null);
    try {
      const updated = await masterService.updateExam(editingExam.id, {
        name: editExamName.trim(),
        code: editExamCode.trim() || undefined,
        type: editExamType,
      });

      setExams((prev) => prev.map((x) => (x.id === editingExam.id ? { ...x, ...updated } : x)));
      setSubmitSuccess(`Exam "${updated.name}" updated successfully!`);
      setEditingExam(null);
      loadExams();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to update exam.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete exam "${name}"?`)) return;
    setDeletingId(id);
    try {
      await masterService.deleteExam(id);
      setExams((prev) => prev.filter((x) => x.id !== id));
      setSubmitSuccess(`Exam "${name}" deleted successfully.`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to delete exam.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExams = exams.filter((x) => {
    if (typeFilter !== 'All' && x.type !== typeFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      x.name.toLowerCase().includes(q) ||
      (x.code && x.code.toLowerCase().includes(q)) ||
      x.type.toLowerCase().includes(q)
    );
  });

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  const displayedExams = filteredExams.slice(
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
      <div className="desktop-layout-wrapper">
        <DesktopTopNav />
        <div className="desktop-main-row">
          <DesktopSidebar />

          <main className="desktop-content-panel">
            {/* Page Header */}
            <div className="page-section-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="page-header-icon-box">
                  <GraduationCap size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">Add Exam Name</h1>
                  <p className="page-sub-heading">Configure examinations and test programs</p>
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
                  borderRadius: '8px',
                }}
              >
                <Upload size={16} />
                <span>Bulk Upload Exam</span>
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

            {/* Form Card */}
            <div className="duty-form-card" style={{ marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#2563EB" />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>
                    Enter Examination Information
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <FileText size={15} color="#2563EB" />
                      <span>EXAM NAME *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. JEE Advanced 2026, NEET UG, UGC NET"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <FileText size={15} color="#2563EB" />
                      <span>EXAM CODE</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. JEE-ADV-26, NEET"
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <FileText size={15} color="#2563EB" />
                      <span>TYPE *</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', height: '48px' }}>
                      <button
                        type="button"
                        onClick={() => setExamType('Exam')}
                        style={{
                          flex: 1,
                          height: '100%',
                          borderRadius: '8px',
                          border: '2px solid ' + (examType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                          background: examType === 'Exam' ? '#EFF6FF' : '#FFF',
                          color: examType === 'Exam' ? '#1D4ED8' : '#64748B',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Exam
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamType('Mock')}
                        style={{
                          flex: 1,
                          height: '100%',
                          borderRadius: '8px',
                          border: '2px solid ' + (examType === 'Mock' ? '#D97706' : '#CBD5E1'),
                          background: examType === 'Mock' ? '#FEF3C7' : '#FFF',
                          color: examType === 'Mock' ? '#B45309' : '#64748B',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Mock
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      border: 'none',
                    }}
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    <span>{submitting ? 'Adding Exam...' : 'Add Exam Name'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Registered Exams Table */}
            <div className="duties-table-container-card">
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                    Registered Examinations ({filteredExams.length})
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                    All examination schedules and test names
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['All', 'Exam', 'Mock'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid ' + (typeFilter === t ? '#2563EB' : '#CBD5E1'),
                          background: typeFilter === t ? '#EFF6FF' : '#FFF',
                          color: typeFilter === t ? '#1D4ED8' : '#475569',
                        }}
                      >
                        {t === 'All' ? 'All Types' : t}
                      </button>
                    ))}
                  </div>

                  <div className="search-input-wrapper" style={{ width: '240px' }}>
                    <Search size={16} className="search-leading-icon" />
                    <input
                      type="text"
                      placeholder="Search exam..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input-field"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="empty-state-card">
                  <Loader2 size={30} className="animate-spin text-blue" />
                  <p>Loading examinations...</p>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="empty-state-card">
                  <GraduationCap size={36} color="#94A3B8" />
                  <h3>No Examinations Found</h3>
                  <p>Add your first exam name above</p>
                </div>
              ) : (
                <>
                <table className="duties-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Sl No</th>
                      <th>Exam Name</th>
                      <th style={{ width: '140px' }}>Code</th>
                      <th style={{ width: '120px' }}>Type</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedExams.map((x, idx) => (
                      <tr key={x.id}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#1E293B' }}>{x.name}</td>
                        <td>
                          <span
                            style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                            }}
                          >
                            {x.code || '---'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: x.type === 'Mock' ? '#FEF3C7' : '#EFF6FF',
                              color: x.type === 'Mock' ? '#B45309' : '#1D4ED8',
                            }}
                          >
                            {x.type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              title="Delete exam"
                              onClick={() => handleDelete(x.id, x.name)}
                              disabled={deletingId === x.id}
                            >
                              {deletingId === x.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn edit"
                              title="Edit exam"
                              onClick={() => handleOpenEdit(x)}
                              style={{
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#2563EB',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
                    *Showing {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, filteredExams.length)} of{' '}
                    {filteredExams.length} records ({pageSize} per page)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="trackclock-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '0 12px' }}
                    >
                      ← Back
                    </button>
                    {getPageNumbers().map((item, index) =>
                      item === '...' ? (
                        <span key={'ellipsis-' + index} className="trackclock-page-ellipsis">...</span>
                      ) : (
                        <button
                          key={'page-' + item}
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
                      Next →
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Exam Modal */}
      {editingExam && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setEditingExam(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <GraduationCap size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Edit Exam</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Update examination name and properties</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ padding: '20px' }}>
              <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <FileText size={15} color="#2563EB" />
                  <span>EXAM NAME *</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editExamName}
                  onChange={(e) => setEditExamName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <FileText size={15} color="#2563EB" />
                  <span>EXAM CODE</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editExamCode}
                  onChange={(e) => setEditExamCode(e.target.value)}
                />
              </div>

              <div className="form-field-wrapper" style={{ marginBottom: '22px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <FileText size={15} color="#2563EB" />
                  <span>TYPE *</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', height: '48px' }}>
                  <button
                    type="button"
                    onClick={() => setEditExamType('Exam')}
                    style={{
                      flex: 1,
                      height: '100%',
                      borderRadius: '8px',
                      border: '2px solid ' + (editExamType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                      background: editExamType === 'Exam' ? '#EFF6FF' : '#FFF',
                      color: editExamType === 'Exam' ? '#1D4ED8' : '#64748B',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExamType('Mock')}
                    style={{
                      flex: 1,
                      height: '100%',
                      borderRadius: '8px',
                      border: '2px solid ' + (editExamType === 'Mock' ? '#D97706' : '#CBD5E1'),
                      background: editExamType === 'Mock' ? '#FEF3C7' : '#FFF',
                      color: editExamType === 'Mock' ? '#B45309' : '#64748B',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Mock
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F1F5F9',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: updating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{updating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile responsive */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />
        <main className="mobile-content-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Add Exam Name</h2>
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
                borderRadius: '6px',
              }}
            >
              <Upload size={14} />
              <span>Bulk Upload</span>
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
            <div className="form-field-wrapper" style={{ marginBottom: '12px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FileText size={15} color="#2563EB" />
                <span>EXAM NAME *</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. JEE Main"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                required
              />
            </div>
            <div className="form-field-wrapper" style={{ marginBottom: '12px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FileText size={15} color="#2563EB" />
                <span>CODE</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. JEE"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
              />
            </div>
            <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FileText size={15} color="#2563EB" />
                <span>TYPE *</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', height: '44px' }}>
                <button
                  type="button"
                  onClick={() => setExamType('Exam')}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: '8px',
                    border: '2px solid ' + (examType === 'Exam' ? '#2563EB' : '#CBD5E1'),
                    background: examType === 'Exam' ? '#EFF6FF' : '#FFF',
                    color: examType === 'Exam' ? '#1D4ED8' : '#64748B',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Exam
                </button>
                <button
                  type="button"
                  onClick={() => setExamType('Mock')}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: '8px',
                    border: '2px solid ' + (examType === 'Mock' ? '#D97706' : '#CBD5E1'),
                    background: examType === 'Mock' ? '#FEF3C7' : '#FFF',
                    color: examType === 'Mock' ? '#B45309' : '#64748B',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Mock
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ width: '100%', height: '48px', background: '#2563EB', color: '#FFF', borderRadius: '10px', border: 'none', fontWeight: 600, fontSize: '15px' }}
            >
              {submitting ? 'Adding...' : '+ Add Exam'}
            </button>
          </form>

          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Exams ({filteredExams.length})</h3>
            {displayedExams.map((x) => (
              <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{x.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Code: {x.code || '---'} &bull; {x.type}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleDelete(x.id, x.name)} style={{ background: 'none', border: 'none', color: '#EF4444', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => handleOpenEdit(x)} style={{ background: 'none', border: 'none', color: '#2563EB', padding: '4px' }}>
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filteredExams.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredExams.length)} of {filteredExams.length}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="trackclock-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ←
                  </button>
                  <span style={{ padding: '4px 8px', fontSize: '13px', fontWeight: 600 }}>{currentPage}/{totalPages}</span>
                  <button
                    type="button"
                    className="trackclock-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadExamModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          loadExams();
          setSubmitSuccess('Exams registered successfully via bulk upload!');
        }}
        existingExams={exams}
      />
    </div>
  );
};

export default AddExamScreen;
