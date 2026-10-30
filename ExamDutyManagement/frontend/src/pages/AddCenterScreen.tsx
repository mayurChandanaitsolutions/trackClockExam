import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  School,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  X,
  Save,
  Upload,
} from 'lucide-react';
import masterService, { Center, City } from '../services/master.service';
import authService, { isUserAdmin } from '../services/auth.service';
import { BulkUploadCenterModal } from '../components/BulkUploadCenterModal';

export const AddCenterScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);

  const [centers, setCenters] = useState<Center[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [centerCode, setCenterCode] = useState<string>('');
  const [centerName, setCenterName] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Edit Modal State
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [editCenterCode, setEditCenterCode] = useState<string>('');
  const [editCenterName, setEditCenterName] = useState<string>('');
  const [editCityId, setEditCityId] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadData();

    // Listen to live updates from master additions
    const handleMasterUpdate = () => {
      loadData();
    };
    window.addEventListener('exam_duty_master_updated', handleMasterUpdate);
    return () => {
      window.removeEventListener('exam_duty_master_updated', handleMasterUpdate);
    };
  }, [isAdmin, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCenters, allCities] = await Promise.all([
        masterService.getCenters(),
        masterService.getCities(),
      ]);
      setCenters(allCenters || []);
      setCities(allCities || []);
      if (allCities && allCities.length > 0 && !selectedCityId) {
        setSelectedCityId(allCities[0].id);
      }
    } catch (err) {
      console.error('Failed to load centers/cities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!centerCode.trim()) {
      setSubmitError('Please enter Center Code.');
      return;
    }
    if (!centerName.trim()) {
      setSubmitError('Please enter Center Name.');
      return;
    }
    if (!selectedCityId) {
      setSubmitError('Please select a City.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await masterService.createCenter({
        centerCode: centerCode.trim(),
        centerName: centerName.trim(),
        cityId: selectedCityId,
        address: address.trim() || undefined,
      });

      // Immediately display in the table below
      setCenters((prev) => {
        const withoutOld = prev.filter(
          (c) => c.id !== created.id && c.centerCode.toLowerCase() !== created.centerCode.toLowerCase(),
        );
        return [...withoutOld, created];
      });

      setSubmitSuccess(`Exam center "${created.centerName}" (${created.centerCode}) added successfully!`);
      setCenterCode('');
      setCenterName('');
      setAddress('');
      loadData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to add exam center.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (center: Center) => {
    setEditingCenter(center);
    setEditCenterCode(center.centerCode);
    setEditCenterName(center.centerName);
    setEditCityId(center.cityId || center.city?.id || (cities[0]?.id || ''));
    setEditAddress(center.address || '');
    setSubmitError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter) return;
    if (!editCenterCode.trim() || !editCenterName.trim()) {
      setSubmitError('Center Code and Center Name are required.');
      return;
    }

    setUpdating(true);
    setSubmitError(null);
    try {
      const updated = await masterService.updateCenter(editingCenter.id, {
        centerCode: editCenterCode.trim(),
        centerName: editCenterName.trim(),
        cityId: editCityId,
        address: editAddress.trim() || undefined,
      });

      setCenters((prev) => prev.map((c) => (c.id === editingCenter.id ? { ...c, ...updated } : c)));
      setSubmitSuccess(`Center "${updated.centerName}" updated successfully!`);
      setEditingCenter(null);
      loadData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to update exam center.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete exam center "${name}"?`)) return;
    setDeletingId(id);
    try {
      await masterService.deleteCenter(id);
      setCenters((prev) => prev.filter((c) => c.id !== id));
      setSubmitSuccess(`Exam center "${name}" deleted successfully.`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to delete exam center.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCenters = centers.filter((c) => {
    if (cityFilter !== 'All' && c.cityId !== cityFilter && c.city?.id !== cityFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.centerName.toLowerCase().includes(q) ||
      c.centerCode.toLowerCase().includes(q) ||
      (c.city?.name && c.city.name.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCenters.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, cityFilter]);

  const displayedCenters = filteredCenters.slice(
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
                  <School size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">Add Exam Center</h1>
                  <p className="page-sub-heading">Configure examination centers across cities</p>
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
                <span>Bulk Upload Exam Center</span>
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
                  <School size={20} color="#2563EB" />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>
                    Enter Exam Center Details
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <School size={15} color="#2563EB" />
                      <span>CENTER CODE *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. 8412, IDZ-01, VVCE-03"
                      value={centerCode}
                      onChange={(e) => setCenterCode(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <School size={15} color="#2563EB" />
                      <span>CENTER NAME *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. iDZ Whitefield Bengaluru, SJB Institute"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <MapPin size={15} color="#2563EB" />
                      <span>CITY *</span>
                    </label>
                    <select
                      className="form-select-control"
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      disabled={submitting}
                      required
                    >
                      {cities.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <MapPin size={15} color="#2563EB" />
                      <span>CENTER ADDRESS / LOCATION</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. Campus Road, Electronic City, Bengaluru"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={submitting}
                    />
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
                    <span>{submitting ? 'Adding Center...' : 'Add Exam Center'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Registered Centers Table */}
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
                    Configured Centers ({filteredCenters.length})
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                    All examination venues and test center buildings
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      background: '#FFF',
                    }}
                  >
                    <option value="All">All Cities</option>
                    {cities.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>

                  <div className="search-input-wrapper" style={{ width: '240px' }}>
                    <Search size={16} className="search-leading-icon" />
                    <input
                      type="text"
                      placeholder="Search center..."
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
                  <p>Loading centers...</p>
                </div>
              ) : filteredCenters.length === 0 ? (
                <div className="empty-state-card">
                  <School size={36} color="#94A3B8" />
                  <h3>No Centers Found</h3>
                  <p>Add your first examination center above</p>
                </div>
              ) : (
                <>
                <table className="duties-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Sl No</th>
                      <th style={{ width: '130px' }}>Code</th>
                      <th>Center Name</th>
                      <th style={{ width: '150px' }}>City</th>
                      <th>Address</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCenters.map((ct, idx) => (
                      <tr key={ct.id}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td>
                          <span
                            style={{
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                            }}
                          >
                            {ct.centerCode}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#1E293B' }}>{ct.centerName}</td>
                        <td style={{ fontWeight: 600, color: '#0F766E' }}>
                          {ct.city?.name || cities.find((c) => c.id === ct.cityId)?.name || '---'}
                        </td>
                        <td style={{ color: '#64748B', fontSize: '13.5px' }}>{ct.address || '---'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              title="Delete center"
                              onClick={() => handleDelete(ct.id, ct.centerName)}
                              disabled={deletingId === ct.id}
                            >
                              {deletingId === ct.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn edit"
                              title="Edit center"
                              onClick={() => handleOpenEdit(ct)}
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
                    {Math.min(currentPage * pageSize, filteredCenters.length)} of{' '}
                    {filteredCenters.length} records ({pageSize} per page)
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

      {/* Edit Center Modal */}
      {editingCenter && (
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
          onClick={() => setEditingCenter(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '520px',
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
                  <School size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Edit Exam Center</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Update center code, name, and venue details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCenter(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-field-wrapper">
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <School size={15} color="#2563EB" />
                    <span>CODE *</span>
                  </label>
                  <input
                    type="text"
                    className="form-input-control"
                    value={editCenterCode}
                    onChange={(e) => setEditCenterCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field-wrapper">
                  <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <School size={15} color="#2563EB" />
                    <span>CENTER NAME *</span>
                  </label>
                  <input
                    type="text"
                    className="form-input-control"
                    value={editCenterName}
                    onChange={(e) => setEditCenterName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MapPin size={15} color="#2563EB" />
                  <span>CITY *</span>
                </label>
                <select
                  className="form-select-control"
                  value={editCityId}
                  onChange={(e) => setEditCityId(e.target.value)}
                  required
                >
                  {cities.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-wrapper" style={{ marginBottom: '22px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MapPin size={15} color="#2563EB" />
                  <span>ADDRESS / LOCATION</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCenter(null)}
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
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Add Exam Center</h2>
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
                <School size={15} color="#2563EB" />
                <span>CENTER CODE *</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. 8412"
                value={centerCode}
                onChange={(e) => setCenterCode(e.target.value)}
                required
              />
            </div>
            <div className="form-field-wrapper" style={{ marginBottom: '12px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <School size={15} color="#2563EB" />
                <span>CENTER NAME *</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. iDZ Whitefield"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                required
              />
            </div>
            <div className="form-field-wrapper" style={{ marginBottom: '12px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={15} color="#2563EB" />
                <span>CITY *</span>
              </label>
              <select
                className="form-select-control"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                required
              >
                {cities.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={15} color="#2563EB" />
                <span>CENTER ADDRESS / LOCATION</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. Campus Road, Bengaluru"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ width: '100%', height: '48px', background: '#2563EB', color: '#FFF', borderRadius: '10px', border: 'none', fontWeight: 600, fontSize: '15px' }}
            >
              {submitting ? 'Adding...' : '+ Add Exam Center'}
            </button>
          </form>

          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Centers ({filteredCenters.length})</h3>
            {displayedCenters.map((ct) => (
              <div key={ct.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{ct.centerName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Code: {ct.centerCode} &bull; {ct.city?.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleDelete(ct.id, ct.centerName)} style={{ background: 'none', border: 'none', color: '#EF4444', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => handleOpenEdit(ct)} style={{ background: 'none', border: 'none', color: '#2563EB', padding: '4px' }}>
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filteredCenters.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCenters.length)} of {filteredCenters.length}
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
      <BulkUploadCenterModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          loadData();
          setSubmitSuccess('Exam centers registered successfully via bulk upload!');
        }}
        existingCenters={centers}
        existingCities={cities}
      />
    </div>
  );
};

export default AddCenterScreen;
