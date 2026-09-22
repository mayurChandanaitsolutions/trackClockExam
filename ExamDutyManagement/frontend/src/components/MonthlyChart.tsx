import React, { useState } from 'react';
import { ChartLine, Calendar, Filter } from 'lucide-react';

export interface MonthStat {
  month: string;
  exams: number;
  mocks: number;
  total: number;
  isCurrent?: boolean;
}

interface MonthlyChartProps {
  data?: MonthStat[];
  selectedYear?: number;
  availableYears?: number[];
  onYearChange?: (year: number) => void;
}

const defaultData: MonthStat[] = [
  { month: 'Apr', exams: 0, mocks: 0, total: 0 },
  { month: 'May', exams: 0, mocks: 0, total: 0 },
  { month: 'Jun', exams: 0, mocks: 0, total: 0 },
  { month: 'Jul', exams: 0, mocks: 0, total: 0 },
  { month: 'Aug', exams: 0, mocks: 0, total: 0 },
  { month: 'Sep', exams: 0, mocks: 0, total: 0, isCurrent: true },
  { month: 'Oct', exams: 0, mocks: 0, total: 0 },
];

// Helper to generate smooth SVG cubic bezier curves
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({
  data = defaultData,
  selectedYear = 2026,
  availableYears = [2026, 2025, 2024, 2027],
  onYearChange,
}) => {
  // Live duty data computed directly by backend for the selected year
  const chartData = data && data.length > 0 ? data : defaultData;

  const [activeFilter, setActiveFilter] = useState<'all' | 'exams' | 'mocks' | 'total'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG ViewBox Dimensions
  const svgWidth = 800;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 32;
  const padBottom = 38;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;
  const bottomY = padTop + plotHeight;

  // Dynamic Y-axis scale based on values
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.total || 0, d.exams || 0, d.mocks || 0)),
    5
  );
  const maxY = Math.max(10, Math.ceil(maxVal / 5) * 5);
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

  // Coordinates
  const getX = (idx: number) => padLeft + (idx / Math.max(1, chartData.length - 1)) * plotWidth;
  const getY = (val: number) => padTop + plotHeight - (Math.min(val, maxY) / maxY) * plotHeight;

  // Series points
  const totalPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.total || 0), val: d.total || 0, item: d }));
  const examsPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.exams || 0), val: d.exams || 0, item: d }));
  const mocksPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.mocks || 0), val: d.mocks || 0, item: d }));

  // Smooth line paths
  const totalPath = createSmoothPath(totalPoints);
  const examsPath = createSmoothPath(examsPoints);
  const mocksPath = createSmoothPath(mocksPoints);

  // Closed area paths for gradient fills
  const totalArea = totalPoints.length > 0
    ? `${totalPath} L ${totalPoints[totalPoints.length - 1].x.toFixed(1)} ${bottomY} L ${totalPoints[0].x.toFixed(1)} ${bottomY} Z`
    : '';
  const examsArea = examsPoints.length > 0
    ? `${examsPath} L ${examsPoints[examsPoints.length - 1].x.toFixed(1)} ${bottomY} L ${examsPoints[0].x.toFixed(1)} ${bottomY} Z`
    : '';
  const mocksArea = mocksPoints.length > 0
    ? `${mocksPath} L ${mocksPoints[mocksPoints.length - 1].x.toFixed(1)} ${bottomY} L ${mocksPoints[0].x.toFixed(1)} ${bottomY} Z`
    : '';

  const showTotal = activeFilter === 'all' || activeFilter === 'total';
  const showExams = activeFilter === 'all' || activeFilter === 'exams';
  const showMocks = activeFilter === 'all' || activeFilter === 'mocks';

  const hoveredItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="overview-chart-card">
      {/* Header with Title and Dropdowns/Legend */}
      <div className="chart-header-row">
        <div className="chart-title-box">
          <div className="chart-icon-wrap">
            <ChartLine size={18} color="#2563EB" />
          </div>
          <h2 className="chart-main-title">Monthly Duty Overview</h2>
        </div>

        <div className="chart-controls-box">
          <div className="chart-dropdown" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} color="#2563EB" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange?.(Number(e.target.value))}
              aria-label="Select duty overview year"
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '13.5px',
                color: '#1E293B',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="chart-dropdown desktop-only-dropdown" style={{ padding: '4px 8px' }}>
            <Filter size={13} />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '13.5px',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Series</option>
              <option value="total">Total Only</option>
              <option value="exams">Exams Only</option>
              <option value="mocks">Mocks Only</option>
            </select>
          </div>

          <div className="chart-legend-row desktop-only-legend">
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'exams' ? 'all' : 'exams')}
              className={`legend-item ${activeFilter === 'exams' ? 'legend-active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span className="dot dot-blue" />
              <span style={{ fontWeight: showExams ? 700 : 500, color: showExams ? '#1E293B' : '#94A3B8' }}>
                Exams
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'mocks' ? 'all' : 'mocks')}
              className={`legend-item ${activeFilter === 'mocks' ? 'legend-active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span className="dot dot-orange" />
              <span style={{ fontWeight: showMocks ? 700 : 500, color: showMocks ? '#1E293B' : '#94A3B8' }}>
                Mocks
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'total' ? 'all' : 'total')}
              className={`legend-item ${activeFilter === 'total' ? 'legend-active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span className="dot dot-lightblue" />
              <span style={{ fontWeight: showTotal ? 700 : 500, color: showTotal ? '#1E293B' : '#94A3B8' }}>
                Total
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Line Graph Area */}
      <div className="line-chart-svg-container" style={{ position: 'relative', width: '100%', minHeight: '230px' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="line-chart-svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Gradients for smooth area glow beneath lines */}
            <linearGradient id="totalLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="examsLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="mocksLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Scale Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={`ytick-${tick}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={tick === 0 ? '#CBD5E1' : '#F1F5F9'}
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="12px"
                  fontWeight="600"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Vertical Accent Column for Current Month */}
          {chartData.map((d, i) => {
            if (!d.isCurrent) return null;
            const x = getX(i);
            return (
              <g key="current-month-highlight">
                <rect
                  x={x - 24}
                  y={padTop}
                  width="48"
                  height={plotHeight}
                  fill="rgba(37, 99, 235, 0.04)"
                  rx="6"
                />
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={bottomY}
                  stroke="#93C5FD"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Area Fills under lines */}
          {showTotal && (
            <path d={totalArea} fill="url(#totalLineGrad)" style={{ transition: 'all 0.3s ease' }} />
          )}
          {showExams && (
            <path d={examsArea} fill="url(#examsLineGrad)" style={{ transition: 'all 0.3s ease' }} />
          )}
          {showMocks && (
            <path d={mocksArea} fill="url(#mocksLineGrad)" style={{ transition: 'all 0.3s ease' }} />
          )}

          {/* Series 1: Total Line */}
          {showTotal && (
            <path
              d={totalPath}
              fill="none"
              stroke="#0284C7"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'all 0.3s ease' }}
            />
          )}

          {/* Series 2: Exams Line */}
          {showExams && (
            <path
              d={examsPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'all 0.3s ease' }}
            />
          )}

          {/* Series 3: Mocks Line */}
          {showMocks && (
            <path
              d={mocksPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'all 0.3s ease' }}
            />
          )}

          {/* Interactive Hover Columns */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={`col-hover-${d.month}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible wide transparent hit target */}
                <rect
                  x={x - plotWidth / (chartData.length * 2)}
                  y={padTop}
                  width={plotWidth / chartData.length}
                  height={plotHeight}
                  fill="transparent"
                />

                {/* Vertical hover line indicator */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={bottomY}
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Total Point */}
                {showTotal && (
                  <circle
                    cx={x}
                    cy={getY(d.total || 0)}
                    r={isHovered ? 6.5 : 4.5}
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="2.5"
                    style={{ transition: 'r 0.15s ease' }}
                  />
                )}

                {/* Exams Point */}
                {showExams && (
                  <circle
                    cx={x}
                    cy={getY(d.exams || 0)}
                    r={isHovered ? 6.5 : 4.5}
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    style={{ transition: 'r 0.15s ease' }}
                  />
                )}

                {/* Mocks Point */}
                {showMocks && (
                  <circle
                    cx={x}
                    cy={getY(d.mocks || 0)}
                    r={isHovered ? 6 : 4}
                    fill="#FFFFFF"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    style={{ transition: 'r 0.15s ease' }}
                  />
                )}

                {/* Number Badges for active data points (Sep or non-zero) */}
                {((d.total || 0) > 0 || isHovered) && (
                  <g>
                    {showTotal && (d.total || 0) > 0 && (
                      <g>
                        <rect
                          x={x - 11}
                          y={getY(d.total || 0) - 22}
                          width="22"
                          height="16"
                          rx="4"
                          fill="#0284C7"
                        />
                        <text
                          x={x}
                          y={getY(d.total || 0) - 10}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="11px"
                          fontWeight="800"
                        >
                          {d.total}
                        </text>
                      </g>
                    )}

                    {showExams && (d.exams || 0) > 0 && (d.exams !== d.total) && (
                      <g>
                        <rect
                          x={x - 28}
                          y={getY(d.exams || 0) - 10}
                          width="18"
                          height="15"
                          rx="4"
                          fill="#2563EB"
                        />
                        <text
                          x={x - 19}
                          y={getY(d.exams || 0) + 1}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10px"
                          fontWeight="800"
                        >
                          {d.exams}
                        </text>
                      </g>
                    )}

                    {showMocks && (d.mocks || 0) > 0 && (
                      <g>
                        <rect
                          x={x + 10}
                          y={getY(d.mocks || 0) - 10}
                          width="18"
                          height="15"
                          rx="4"
                          fill="#F59E0B"
                        />
                        <text
                          x={x + 19}
                          y={getY(d.mocks || 0) + 1}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10px"
                          fontWeight="800"
                        >
                          {d.mocks}
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Month label on X-axis */}
                <text
                  x={x}
                  y={bottomY + 20}
                  textAnchor="middle"
                  fill={d.isCurrent ? '#1D4ED8' : isHovered ? '#0F172A' : '#64748B'}
                  fontSize={d.isCurrent ? '13.5px' : '13px'}
                  fontWeight={d.isCurrent ? '800' : isHovered ? '700' : '600'}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip card when hovering over a month */}
        {hoveredItem && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '16px',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12.5px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: '#93C5FD' }}>
              {hoveredItem.month} {selectedYear}:
            </span>
            <span>
              <strong>Total:</strong> {hoveredItem.total || 0}
            </span>
            <span style={{ color: '#60A5FA' }}>
              <strong>Exams:</strong> {hoveredItem.exams || 0}
            </span>
            <span style={{ color: '#FCD34D' }}>
              <strong>Mocks:</strong> {hoveredItem.mocks || 0}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Legend Footer */}
      <div className="mobile-only-legend" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px' }}>
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'exams' ? 'all' : 'exams')}
          className="legend-item"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span className="dot dot-blue" />
          <span style={{ fontWeight: showExams ? 700 : 500, fontSize: '12px', color: showExams ? '#1E293B' : '#94A3B8' }}>
            Exams
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'mocks' ? 'all' : 'mocks')}
          className="legend-item"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span className="dot dot-orange" />
          <span style={{ fontWeight: showMocks ? 700 : 500, fontSize: '12px', color: showMocks ? '#1E293B' : '#94A3B8' }}>
            Mocks
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'total' ? 'all' : 'total')}
          className="legend-item"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span className="dot dot-lightblue" />
          <span style={{ fontWeight: showTotal ? 700 : 500, fontSize: '12px', color: showTotal ? '#1E293B' : '#94A3B8' }}>
            Total
          </span>
        </button>
      </div>
    </div>
  );
};

export default MonthlyChart;

