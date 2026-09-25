import React, { useState } from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { EmployeeItem } from '../services/master.service';
import { exportEmployeesToExcel } from '../utils/excelExport';

interface ExportEmployeesCardProps {
  employees: EmployeeItem[];
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  className?: string;
}

export const ExportEmployeesCard: React.FC<ExportEmployeesCardProps> = ({
  employees,
  selectedCity: propSelectedCity,
  onCityChange,
  className = '',
}) => {
  const [internalCity, setInternalCity] = useState<string>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // If a controlled value and handler are provided, use them; otherwise use local state
  const activeCity = (propSelectedCity !== undefined && onCityChange) ? propSelectedCity : internalCity;

  const handleCityChange = (city: string) => {
    setInternalCity(city);
    if (onCityChange) {
      onCityChange(city);
    }
  };

  const handleExport = () => {
    const result = exportEmployeesToExcel(employees, activeCity);
    const placeName = (!activeCity || activeCity === 'ALL' || activeCity === 'All Places') 
      ? 'All Places' 
      : activeCity;
    if (result.count === 0) {
      setExportNotice(
        `No workforce members found for ${placeName}. An empty spreadsheet template was downloaded.`
      );
    } else {
      setExportNotice(
        `Successfully exported ${result.count} workforce record(s) for ${placeName} into ${result.filename}! Opening in Excel...`
      );
    }
    setTimeout(() => {
      setExportNotice(null);
    }, 6000);
  };

  return (
    <div className={`export-jobs-card ${className}`}>
      <div className="export-jobs-title">
        Export Workforce Members Details:
      </div>

      {exportNotice && (
        <div className="export-success-notice">
          <CheckCircle size={16} />
          <span>{exportNotice}</span>
        </div>
      )}

      <div className="export-jobs-controls-row">
        {/* Option 1: Work Place Dropdown */}
        <div className="export-input-col" style={{ maxWidth: '320px' }}>
          <label className="export-input-label">Work Place</label>
          <div className="export-input-wrapper">
            <select
              className="export-native-select"
              value={activeCity}
              onChange={(e) => handleCityChange(e.target.value)}
              title="Filter workforce by workplace city for Excel export"
            >
              <option value="ALL">All Places</option>
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

        {/* Option 2: Export Button */}
        <div className="export-btn-col">
          <button
            type="button"
            className="trackclock-export-btn"
            onClick={handleExport}
            title="Download Excel spreadsheet with full employee details"
          >
            <ExternalLink size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportEmployeesCard;
