import React, { useState } from 'react';
import { ExternalLink, CheckCircle, Calendar, MapPin } from 'lucide-react';
import { DutyItem } from '../services/duty.service';
import { EmployeeItem } from '../services/master.service';
import { exportDutiesToExcel, ExportFilters } from '../utils/excelExport';

interface ExportJobsCardProps {
  duties: DutyItem[];
  employees: EmployeeItem[];
  onFilterChange?: (filters: ExportFilters) => void;
  className?: string;
}

export const ExportJobsCard: React.FC<ExportJobsCardProps> = ({
  duties,
  employees,
  onFilterChange,
  className = '',
}) => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [workPlace, setWorkPlace] = useState<string>('All Places');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    if (onFilterChange) onFilterChange({ fromDate: val, toDate, workPlace });
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    if (onFilterChange) onFilterChange({ fromDate, toDate: val, workPlace });
  };

  const handleWorkPlaceChange = (val: string) => {
    setWorkPlace(val);
    if (onFilterChange) onFilterChange({ fromDate, toDate, workPlace: val });
  };

  const handleExport = () => {
    const result = exportDutiesToExcel(duties, employees, {
      fromDate,
      toDate,
      workPlace,
    });
    const placeName = (!workPlace || workPlace === 'ALL' || workPlace === 'All Places') 
      ? 'All Places' 
      : workPlace;
    const dateDesc = fromDate || toDate
      ? ` (${[fromDate ? `from ${fromDate}` : '', toDate ? `to ${toDate}` : ''].filter(Boolean).join(' ')})`
      : '';
    if (result.count === 0) {
      setExportNotice(
        `No assigned duty record(s) found for ${placeName}${dateDesc}. An empty spreadsheet template was downloaded.`
      );
    } else {
      setExportNotice(
        `Successfully exported ${result.count} assigned duty record(s) for ${placeName}${dateDesc} into ${result.filename}! Opening in Excel...`
      );
    }
    setTimeout(() => {
      setExportNotice(null);
    }, 6000);
  };

  return (
    <div className={`export-jobs-card ${className}`}>
      <div className="export-jobs-title">
        Export the Employee Assigned Jobs Details:
      </div>

      {exportNotice && (
        <div className="export-success-notice">
          <CheckCircle size={16} />
          <span>{exportNotice}</span>
        </div>
      )}

      <div className="export-jobs-controls-row">
        {/* From Date */}
        <div className="export-input-col">
          <label className="export-input-label">From Date</label>
          <div className="export-input-wrapper">
            <input
              type="date"
              className="export-native-input"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
              placeholder="dd-mm-yyyy"
            />
          </div>
        </div>

        {/* To Date */}
        <div className="export-input-col">
          <label className="export-input-label">To Date</label>
          <div className="export-input-wrapper">
            <input
              type="date"
              className="export-native-input"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* Work Place */}
        <div className="export-input-col">
          <label className="export-input-label">Work Place</label>
          <div className="export-input-wrapper">
            <select
              className="export-native-select"
              value={workPlace}
              onChange={(e) => handleWorkPlaceChange(e.target.value)}
              title="Filter duties by workplace city for Excel export"
            >
              <option value="All Places">All Places</option>
              <option value="Mysore">Mysore</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mangalore">Mangalore</option>
              <option value="Shivamogga">Shivamogga</option>
              <option value="Mandya">Mandya</option>
              <option value="Davanagere">Davanagere</option>
              <option value="Dharwad">Dharwad</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="export-btn-col">
          <button
            type="button"
            className="trackclock-export-btn"
            onClick={handleExport}
            title="Download Excel spreadsheet with full employee and assigned job details"
          >
            <ExternalLink size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportJobsCard;
