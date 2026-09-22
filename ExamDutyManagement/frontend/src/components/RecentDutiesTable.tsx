import React from 'react';
import { Calendar, Eye, User, ArrowRight } from 'lucide-react';
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
          <p style={{ margin: '4px 0 0', fontSize: '14.5px' }}>
            No duty records exist in the database yet. Click "+ Add Duty" to create your first assignment.
          </p>
        </div>
      ) : (
        <div className="desktop-table-container recent-table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="recent-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Sl No</th>
                <th>Exam Name</th>
                <th>Assigned Member</th>
                <th>Duty Date</th>
                <th>Center Name</th>
                <th>City</th>
                <th>Role</th>
                <th>Shift</th>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14.5px' }}>
                      <User size={15} color="#2563EB" />
                      <span style={{ fontWeight: 600 }}>{duty.employeeName || 'Staff Member'}</span>
                    </div>
                  </td>
                  <td className="col-date">{duty.date}</td>
                  <td className="col-center">{duty.center}</td>
                  <td className="col-city">{duty.city}</td>
                  <td className="col-role">{duty.role}</td>
                  <td className="col-shift">{duty.shift}</td>
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
      )}
    </div>
  );
};

export default RecentDutiesTable;
