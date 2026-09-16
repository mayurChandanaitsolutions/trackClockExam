import React from 'react';
import { BarChart3, Calendar, Filter } from 'lucide-react';

export interface MonthStat {
  month: string;
  exams: number;
  mocks: number;
  total: number;
  isCurrent?: boolean;
}

interface MonthlyChartProps {
  data?: MonthStat[];
}

const defaultData: MonthStat[] = [
  { month: 'Apr', exams: 2, mocks: 1, total: 3 },
  { month: 'May', exams: 4, mocks: 2, total: 6 },
  { month: 'Jun', exams: 3, mocks: 1, total: 4 },
  { month: 'Jul', exams: 6, mocks: 2, total: 8 },
  { month: 'Aug', exams: 12, mocks: 4, total: 16 },
  { month: 'Sep', exams: 8, mocks: 2, total: 10, isCurrent: true },
  { month: 'Oct', exams: 0, mocks: 0, total: 0 },
];

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data = defaultData }) => {
  const chartData = data && data.length > 0 ? data : defaultData;
  const maxVal = Math.max(...chartData.map((d) => d.total || d.exams || 0), 10);
  const maxY = Math.max(25, Math.ceil(maxVal / 5) * 5);

  return (
    <div className="overview-chart-card">
      {/* Header with Title and Dropdowns/Legend */}
      <div className="chart-header-row">
        <div className="chart-title-box">
          <div className="chart-icon-wrap">
            <BarChart3 size={18} color="#2563EB" />
          </div>
          <h2 className="chart-main-title">Monthly Duty Overview</h2>
        </div>

        <div className="chart-controls-box">
          <div className="chart-dropdown">
            <Calendar size={13} />
            <span>2026</span>
            <span className="dropdown-caret">▾</span>
          </div>

          <div className="chart-dropdown desktop-only-dropdown">
            <Filter size={13} />
            <span>All Types</span>
            <span className="dropdown-caret">▾</span>
          </div>

          <div className="chart-legend-row desktop-only-legend">
            <span className="legend-item">
              <span className="dot dot-blue" /> Exams
            </span>
            <span className="legend-item">
              <span className="dot dot-orange" /> Mocks
            </span>
            <span className="legend-item">
              <span className="dot dot-lightblue" /> Total
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="chart-canvas-wrapper">
        {/* Y Axis */}
        <div className="chart-y-axis">
          <span>{maxY}</span>
          <span>{Math.round(maxY * 0.8)}</span>
          <span>{Math.round(maxY * 0.6)}</span>
          <span>{Math.round(maxY * 0.4)}</span>
          <span>{Math.round(maxY * 0.2)}</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="chart-bars-area">
          {/* Horizontal Gridlines */}
          <div className="gridline" style={{ top: '0%' }} />
          <div className="gridline" style={{ top: '20%' }} />
          <div className="gridline" style={{ top: '40%' }} />
          <div className="gridline" style={{ top: '60%' }} />
          <div className="gridline" style={{ top: '80%' }} />
          <div className="gridline gridline-bottom" style={{ bottom: '26px' }} />

          {/* Desktop Grouped Bars */}
          <div className="desktop-bars-container">
            {chartData.map((item) => (
              <div key={item.month} className="month-group">
                <div className="grouped-bars">
                  {/* Exams Bar */}
                  <div className="single-bar-col">
                    {item.exams > 0 && <span className="bar-num">{item.exams}</span>}
                    <div
                      className="bar-rect bar-exams"
                      style={{ height: `${(item.exams / maxY) * 100}%` }}
                    />
                  </div>

                  {/* Mocks Bar */}
                  <div className="single-bar-col">
                    {item.mocks > 0 && <span className="bar-num">{item.mocks}</span>}
                    <div
                      className="bar-rect bar-mocks"
                      style={{ height: `${(item.mocks / maxY) * 100}%` }}
                    />
                  </div>

                  {/* Total Bar */}
                  <div className="single-bar-col">
                    {item.total > 0 && <span className="bar-num">{item.total}</span>}
                    <div
                      className="bar-rect bar-total"
                      style={{ height: `${(item.total / maxY) * 100}%` }}
                    />
                  </div>
                </div>

                <span className={`month-label ${item.isCurrent ? 'current-month-label' : ''}`}>
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          {/* Mobile Single/Grouped Bars */}
          <div className="mobile-bars-container">
            {chartData.slice(0, 6).map((item) => (
              <div key={item.month} className="mobile-bar-col">
                <div className="mobile-bar-wrapper">
                  <span className="bar-num">
                    {item.isCurrent ? item.exams : item.total || item.exams}
                  </span>
                  <div
                    className={`bar-rect ${
                      item.isCurrent
                        ? 'bar-mobile-current'
                        : item.total >= 10
                        ? 'bar-mobile-tall'
                        : 'bar-mobile-normal'
                    }`}
                    style={{
                      height: `${((item.isCurrent ? item.exams : item.total || 2) / maxY) * 100}%`,
                    }}
                  />
                </div>
                <span className={`month-label ${item.isCurrent ? 'current-month-label' : ''}`}>
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Legend Footer */}
      <div className="mobile-only-legend">
        <span className="legend-item">
          <span className="dot dot-blue" /> Exams
        </span>
        <span className="legend-item">
          <span className="dot dot-orange" /> Mocks
        </span>
        <span className="legend-item">
          <span className="dot dot-lightblue" /> Total
        </span>
      </div>
    </div>
  );
};

export default MonthlyChart;
