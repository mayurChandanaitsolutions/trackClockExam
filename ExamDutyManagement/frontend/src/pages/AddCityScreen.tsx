import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopTopNav } from '../components/DesktopTopNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileHeader } from '../components/MobileHeader';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  X,
  Save,
} from 'lucide-react';
import masterService, { City } from '../services/master.service';
import authService, { isUserAdmin } from '../services/auth.service';

export const AddCityScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isAdmin = isUserAdmin(user);

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [cityName, setCityName] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Karnataka');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editCityName, setEditCityName] = useState<string>('');
  const [editStateName, setEditStateName] = useState<string>('Karnataka');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadCities();
  }, [isAdmin, navigate]);

  const loadCities = async () => {
    setLoading(true);
    try {
      const data = await masterService.getCities();
      setCities(data || []);
    } catch (err) {
      console.error('Failed to load cities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!cityName.trim()) {
      setSubmitError('Please enter a City Name.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await masterService.createCity({
        name: cityName.trim(),
        state: stateName.trim() || 'Karnataka',
      });
      // Immediately reflect newly created city in local table state
      setCities((prev) => {
        const withoutOld = prev.filter((c) => c.id !== created.id && c.name.toLowerCase() !== created.name.toLowerCase());
        return [...withoutOld, created];
      });
      setSubmitSuccess(`City "${created.name}" added successfully!`);
      setCityName('');
      setStateName('Karnataka');
      loadCities();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to add city.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (city: City) => {
    setEditingCity(city);
    setEditCityName(city.name);
    setEditStateName(city.state || 'Karnataka');
    setSubmitError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;
    if (!editCityName.trim()) {
      setSubmitError('City name is required.');
      return;
    }

    setUpdating(true);
    setSubmitError(null);
    try {
      const updated = await masterService.updateCity(editingCity.id, {
        name: editCityName.trim(),
        state: editStateName.trim() || 'Karnataka',
      });
      setCities((prev) => prev.map((c) => (c.id === editingCity.id ? { ...c, ...updated } : c)));
      setSubmitSuccess(`City "${updated.name}" updated successfully!`);
      setEditingCity(null);
      loadCities();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to update city.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete city "${name}"?`)) return;
    setDeletingId(id);
    try {
      await masterService.deleteCity(id);
      setCities((prev) => prev.filter((c) => c.id !== id));
      setSubmitSuccess(`City "${name}" deleted successfully.`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to delete city.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.state && c.state.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCities.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const displayedCities = filteredCities.slice(
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
            <div className="page-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="page-header-icon-box">
                  <MapPin size={24} color="#2563EB" />
                </div>
                <div>
                  <h1 className="page-main-heading">Add City</h1>
                  <p className="page-sub-heading">Manage examination operational cities</p>
                </div>
              </div>
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
                  <Building size={20} color="#2563EB" />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>
                    Enter City Information
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <MapPin size={15} color="#2563EB" />
                      <span>CITY NAME *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. Mysuru, Bengaluru, Hubballi"
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-field-wrapper">
                    <label className="field-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Building size={15} color="#2563EB" />
                      <span>STATE *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. Karnataka"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      disabled={submitting}
                      required
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
                    <span>{submitting ? 'Adding City...' : 'Add City'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Registered Cities Table Card */}
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
                    Available Cities ({filteredCities.length})
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                    All configured examination duty operational cities
                  </p>
                </div>

                <div className="search-input-wrapper" style={{ width: '260px' }}>
                  <Search size={16} className="search-leading-icon" />
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-field"
                  />
                </div>
              </div>

              {loading ? (
                <div className="empty-state-card">
                  <Loader2 size={30} className="animate-spin text-blue" />
                  <p>Loading cities...</p>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="empty-state-card">
                  <MapPin size={36} color="#94A3B8" />
                  <h3>No Cities Found</h3>
                  <p>Add your first examination city above</p>
                </div>
              ) : (
                <>
                <table className="duties-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Sl No</th>
                      <th>City Name</th>
                      <th>State</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCities.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#1E293B' }}>{c.name}</td>
                        <td style={{ color: '#475569' }}>{c.state || 'Karnataka'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              title="Delete city"
                              onClick={() => handleDelete(c.id, c.name)}
                              disabled={deletingId === c.id}
                            >
                              {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn edit"
                              title="Edit city"
                              onClick={() => handleOpenEdit(c)}
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
                    {Math.min(currentPage * pageSize, filteredCities.length)} of{' '}
                    {filteredCities.length} records ({pageSize} per page)
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

      {/* Edit City Modal */}
      {editingCity && (
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
          onClick={() => setEditingCity(null)}
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
                  <Building size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Edit City</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Update operational examination city</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCity(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ padding: '20px' }}>
              <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MapPin size={15} color="#2563EB" />
                  <span>CITY NAME *</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editCityName}
                  onChange={(e) => setEditCityName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field-wrapper" style={{ marginBottom: '24px' }}>
                <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Building size={15} color="#2563EB" />
                  <span>STATE *</span>
                </label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editStateName}
                  onChange={(e) => setEditStateName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCity(null)}
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

      {/* Mobile Header for responsive mobile view */}
      <div className="mobile-layout-wrapper">
        <MobileHeader />
        <main className="mobile-content-body" style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>Add City</h2>
          <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
            <div className="form-field-wrapper" style={{ marginBottom: '14px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={15} color="#2563EB" />
                <span>CITY NAME *</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. Mysuru"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                required
              />
            </div>
            <div className="form-field-wrapper" style={{ marginBottom: '16px' }}>
              <label className="field-label" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Building size={15} color="#2563EB" />
                <span>STATE *</span>
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="Karnataka"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ width: '100%', height: '48px', background: '#2563EB', color: '#FFF', borderRadius: '10px', border: 'none', fontWeight: 600, fontSize: '15px' }}
            >
              {submitting ? 'Adding...' : '+ Add City'}
            </button>
          </form>

          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Cities ({filteredCities.length})</h3>
            {displayedCities.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{c.state || 'Karnataka'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleDelete(c.id, c.name)} style={{ background: 'none', border: 'none', color: '#EF4444', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => handleOpenEdit(c)} style={{ background: 'none', border: 'none', color: '#2563EB', padding: '4px' }}>
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filteredCities.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCities.length)} of {filteredCities.length}
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
    </div>
  );
};

export default AddCityScreen;
