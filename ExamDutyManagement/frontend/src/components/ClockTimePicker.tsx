import React, { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface ClockTimePickerProps {
  value: string; // e.g. "07:30 AM"
  onChange: (newTime: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const ClockTimePicker: React.FC<ClockTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select Time',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Parse incoming value "HH:MM AM/PM"
  const parseTime = (timeStr: string) => {
    const match = (timeStr || '07:30 AM').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      if (h < 1) h = 12;
      if (h > 12) h = 12;
      const m = parseInt(match[2], 10);
      const p = match[3].toUpperCase() as 'AM' | 'PM';
      return { hour: h, minute: m, period: p };
    }
    return { hour: 7, minute: 30, period: 'AM' as 'AM' | 'PM' };
  };

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState<number>(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(parsed.period);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');

  // Sync state when incoming value changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const p = parseTime(value);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
      setMode('hours');
    }
  }, [isOpen, value]);

  // Formatted string
  const formatTime = (h: number, m: number, p: 'AM' | 'PM') => {
    const hh = h < 10 ? `0${h}` : `${h}`;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${hh}:${mm} ${p}`;
  };

  const handleApply = () => {
    const formatted = formatTime(selectedHour, selectedMinute, selectedPeriod);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectPreset = (preset: string) => {
    const p = parseTime(preset);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
    onChange(preset);
    setIsOpen(false);
  };

  // Clock Dial Math (220px diameter, center 110, 110, radius 80)
  const dialRadius = 80;
  const centerX = 110;
  const centerY = 110;

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Calculate current hand angle
  const currentAngle =
    mode === 'hours'
      ? (selectedHour % 12) * 30 // 30 deg per hour
      : (selectedMinute % 60) * 6; // 6 deg per min

  // Common exam slot presets (6:00 AM to 5:30 PM as requested by user)
  const examPresets = [
    '06:00 AM',
    '07:00 AM',
    '07:30 AM',
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '12:00 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '05:30 PM',
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button / Input Display */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: '#FFFFFF',
          border: '1.5px solid #CBD5E1',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '4px',
          userSelect: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#2563EB" />
          <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#1E293B' }}>
            {value || placeholder}
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '4px',
            background: '#EFF6FF',
            color: '#2563EB',
          }}
        >
          12-HR CLOCK
        </span>
      </div>

      {/* Clock Popup Modal / Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              width: '100%',
              maxWidth: '340px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Header: Digital Display & Mode Toggle */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  {label || 'Select Time'}
                </span>
                {/* Time Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('hours')}
                    style={{
                      background: mode === 'hours' ? '#EFF6FF' : 'transparent',
                      color: mode === 'hours' ? '#2563EB' : '#1E293B',
                      border: mode === 'hours' ? '1px solid #BFDBFE' : '1px solid transparent',
                      borderRadius: '8px',
                      fontSize: '28px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedHour < 10 ? `0${selectedHour}` : selectedHour}
                  </button>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#64748B' }}>:</span>
                  <button
                    type="button"
                    onClick={() => setMode('minutes')}
                    style={{
                      background: mode === 'minutes' ? '#EFF6FF' : 'transparent',
                      color: mode === 'minutes' ? '#2563EB' : '#1E293B',
                      border: mode === 'minutes' ? '1px solid #BFDBFE' : '1px solid transparent',
                      borderRadius: '8px',
                      fontSize: '28px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute}
                  </button>
                </div>
              </div>

              {/* AM / PM Toggle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: '#F1F5F9',
                  padding: '4px',
                  borderRadius: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedPeriod === 'AM' ? '#2563EB' : 'transparent',
                    color: selectedPeriod === 'AM' ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedPeriod === 'PM' ? '#2563EB' : 'transparent',
                    color: selectedPeriod === 'PM' ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Mode Indicator Banner */}
            <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              {mode === 'hours' ? 'Select Hour (1 - 12)' : 'Select Minute (00 - 55)'}
            </div>

            {/* Circular 12-Hour Analog Clock Face */}
            <div
              style={{
                position: 'relative',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                backgroundColor: '#F8FAFC',
                border: '2px solid #E2E8F0',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                margin: '0 auto',
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              {/* SVG Clock Hand & Center Pivot */}
              <svg
                width="220"
                height="220"
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              >
                {/* Center Pivot */}
                <circle cx={centerX} cy={centerY} r="5" fill="#2563EB" />
                {/* Clock Hand Line */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + dialRadius * Math.sin((currentAngle * Math.PI) / 180)}
                  y2={centerY - dialRadius * Math.cos((currentAngle * Math.PI) / 180)}
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Outer Selection Highlight Circle behind active number */}
                <circle
                  cx={centerX + dialRadius * Math.sin((currentAngle * Math.PI) / 180)}
                  cy={centerY - dialRadius * Math.cos((currentAngle * Math.PI) / 180)}
                  r="17"
                  fill="#2563EB"
                />
              </svg>

              {/* Dial Numbers */}
              {mode === 'hours'
                ? hoursList.map((h) => {
                    const angle = (h % 12) * 30; // degrees from 12
                    const rad = (angle * Math.PI) / 180;
                    const x = centerX + dialRadius * Math.sin(rad);
                    const y = centerY - dialRadius * Math.cos(rad);
                    const isSelected = selectedHour === h;

                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setSelectedHour(h);
                          // Auto advance to minutes for convenience
                          setMode('minutes');
                        }}
                        style={{
                          position: 'absolute',
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'transparent',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          fontSize: '14.5px',
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {h}
                      </button>
                    );
                  })
                : minutesList.map((m) => {
                    const angle = (m % 60) * 6;
                    const rad = (angle * Math.PI) / 180;
                    const x = centerX + dialRadius * Math.sin(rad);
                    const y = centerY - dialRadius * Math.cos(rad);
                    const isSelected = selectedMinute === m;

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMinute(m)}
                        style={{
                          position: 'absolute',
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'transparent',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          fontSize: '13.5px',
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                        }}
                      >
                        {m < 10 ? `0${m}` : m}
                      </button>
                    );
                  })}
            </div>

            {/* Quick Exam Timing Presets (6:00 AM - 5:30 PM) */}
            <div style={{ width: '100%', marginTop: '16px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                STANDARD EXAM SHIFT TIMINGS:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  maxHeight: '74px',
                  overflowY: 'auto',
                  padding: '2px 0',
                }}
              >
                {examPresets.map((preset) => {
                  const isCurrent = formatTime(selectedHour, selectedMinute, selectedPeriod) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        border: isCurrent ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        background: isCurrent ? '#EFF6FF' : '#F8FAFC',
                        color: isCurrent ? '#2563EB' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApply}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  border: 'none',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                <Check size={16} />
                <span>Apply Time</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockTimePicker;
