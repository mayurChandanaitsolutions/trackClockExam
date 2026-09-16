import React from 'react';
import { Calendar, Eye, MapPin, User, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Duty } from '../types/duty.types';

export interface RecentDutySummary {
  num: number;
  id: string;
  exam: string;
  date: string;
  center: string;
  city: string;
  role: string;
  shift: string;
  status: 'Approved' | 'Pending' | 'Rejected' | string;
  reportingTime?: string;
  shiftEndTime?: string;
  employeeName?: string;
  resourceId?: string;
}

interface RecentDutiesTableProps {
  duties?: RecentDutySummary[];
  onViewDetails?: (duty: RecentDutySummary) => void;
}

export const RecentDutiesTable: React.FC<RecentDutiesTableProps> = ({
  duties,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const list = duties || [];

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Pending':
        return 'status-pending';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  return (
    <div className="recent-duties-card">
      {/* Header */}
      <div className="recent-duties-header">
        <div className="recent-title-wrap">
          <div className="recent-icon-box">
            <Calendar size={18} color="#2563EB" />
          </div>
          <h2 className="recent-main-title">Recent Duties</h2>
        </div>

        <button
          className="view-all-link-btn"
          onClick={() => navigate('/my-duties')}
        >
          <span>View All</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
          <Calendar size={36} color="#94A3B8" style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#1E293B' }}>
            No Duties Found
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
            No duty records exist in the database yet. Click "+ Add Duty" to create your first assignment.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Shown on screens >= 768px) */}
          <div className="desktop-table-container">
            <table className="recent-table">
              <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Exam Name</th>
              <th>Assigned Member</th>
              <th>Duty Date</th>
              <th>Center Name</th>
              <th>City</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((duty, idx) => (
              <tr key={duty.id || idx}>
                <td className="col-num">{duty.num || idx + 1}</td>
                <td className="col-exam">
                  <strong>{duty.exam}</strong>
                </td>
                <td className="col-employee">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                    <User size={13} color="#2563EB" />
                    <span style={{ fontWeight: 500 }}>{duty.employeeName || 'Staff Member'}</span>
                  </div>
                </td>
                <td className="col-date">{duty.date}</td>
                <td className="col-center">{duty.center}</td>
                <td className="col-city">{duty.city}</td>
                <td className="col-role">{duty.role}</td>
                <td className="col-shift">{duty.shift}</td>
                <td className="col-status">
                  <span className={`table-status-pill ${getStatusClass(duty.status)}`}>
                    {duty.status}
                  </span>
                </td>
                <td className="col-action" style={{ textAlign: 'center' }}>
                  <button
                    className="action-eye-btn"
                    title="View details"
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails(duty);
                      } else {
                        navigate('/my-duties');
                      }
                    }}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View (Shown on screens < 768px) */}
      <div className="mobile-cards-container">
        {list.slice(0, 4).map((duty, idx) => (
          <div
            key={duty.id || idx}
            className="mobile-duty-item-card"
            onClick={() => {
              if (onViewDetails) {
                onViewDetails(duty);
              } else {
                navigate('/my-duties');
              }
            }}
          >
            {/* Top row: Exam name, Status, Date */}
            <div className="mobile-duty-top">
              <div className="mobile-exam-left">
                <span className="mobile-exam-title">{duty.exam}</span>
                {duty.employeeName && (
                  <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, display: 'block', margin: '2px 0' }}>
                    👤 {duty.employeeName}
                  </span>
                )}
                <span className={`mobile-status-badge ${getStatusClass(duty.status)}`}>
                  {duty.status.toUpperCase()}
                </span>
              </div>
              <div className="mobile-date-tag">
                <Calendar size={12} />
                <span>{duty.date}</span>
              </div>
            </div>

            {/* Details list */}
            <div className="mobile-duty-meta">
              <div className="meta-row">
                <MapPin size={13} className="meta-icon" />
                <span>
                  {duty.center}, {duty.city}
                </span>
              </div>
              <div className="meta-row">
                <User size={13} className="meta-icon" />
                <span>
                  Role: <strong>{duty.role}</strong>
                </span>
              </div>
              <div className="meta-row">
                <Clock size={13} className="meta-icon" />
                <span>
                  Shift: <strong>{duty.shift}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
    )}
    </div>
  );
};

export default RecentDutiesTable;
