import React from 'react';
import { Duty } from '../types/duty.types';
import { MapPin, Clock, Briefcase, Calendar } from 'lucide-react';

interface DutyCardProps {
  duty: Duty;
}

export const DutyCard: React.FC<DutyCardProps> = ({ duty }) => {
  return (
    <div className="duty-card">
      {/* Primary Column: Exam & Date */}
      <div className="duty-primary-info">
        <div className="duty-exam-name">
          <span>{duty.exam}</span>
        </div>
        <div className="duty-date-tag">
          <Calendar size={13} />
          <span>{duty.date}</span>
        </div>
      </div>

      {/* Details Grid / Row across available width */}
      <div className="duty-details-grid">
        <div className="duty-detail-row center-col">
          <MapPin size={15} className="duty-icon" />
          <div className="detail-text-wrap">
            <span className="detail-label">Center &amp; City</span>
            <span className="duty-detail-value">{duty.center}, {duty.city}</span>
          </div>
        </div>
        <div className="duty-detail-row role-col">
          <Briefcase size={15} className="duty-icon" />
          <div className="detail-text-wrap">
            <span className="detail-label">Assigned Role</span>
            <span className="duty-detail-value">{duty.role}</span>
          </div>
        </div>
        <div className="duty-detail-row shift-col">
          <Clock size={15} className="duty-icon" />
          <div className="detail-text-wrap">
            <span className="detail-label">Shift Timing</span>
            <span className="duty-detail-value">{duty.shift}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DutyCard;
