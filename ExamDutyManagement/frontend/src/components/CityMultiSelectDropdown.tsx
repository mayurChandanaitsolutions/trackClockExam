import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

export const AVAILABLE_CITIES = [
  'Mysore',
  'Bengaluru',
  'Mangalore',
  'Shivamogga',
  'Mandya',
  'Davanagere',
  'Dharwad',
];

interface CityMultiSelectDropdownProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export const CityMultiSelectDropdown: React.FC<CityMultiSelectDropdownProps> = ({
  selectedCities,
  onChange,
  disabled = false,
  className = '',
  style = {},
  placeholder = 'Select assigned cities...',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      onChange(selectedCities.filter((c) => c !== city));
    } else {
      onChange([...selectedCities, city]);
    }
  };

  const displayText =
    selectedCities.length > 0 ? selectedCities.join(', ') : placeholder;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: '100%',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={className}
        style={{
          width: '100%',
          minHeight: '42px',
          padding: '8px 12px',
          background: '#FFFFFF',
          border: isOpen ? '1.5px solid #2563EB' : '1.5px solid #CBD5E1',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          textAlign: 'left',
          marginTop: '6px',
        }}
        title="Click to select one or multiple cities"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          <MapPin size={15} color="#2563EB" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '14.5px',
              fontWeight: selectedCities.length > 0 ? 600 : 400,
              color: selectedCities.length > 0 ? '#1E293B' : '#94A3B8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayText}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={16} color="#64748B" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={16} color="#64748B" style={{ flexShrink: 0 }} />
        )}
      </button>

      {/* Popover Dropdown Menu with Checkboxes */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #F1F5F9',
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Assigned Cities ({selectedCities.length} selected)</span>
            {selectedCities.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {AVAILABLE_CITIES.map((cityName) => {
            const isChecked = selectedCities.includes(cityName);
            return (
              <div
                key={cityName}
                onClick={() => toggleCity(cityName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isChecked ? '#EFF6FF' : 'transparent',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Custom Checkbox Box with Tick Mark */}
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: isChecked ? '1.5px solid #2563EB' : '1.5px solid #94A3B8',
                    background: isChecked ? '#2563EB' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isChecked && <Check size={13} color="#FFFFFF" strokeWidth={3.5} />}
                </div>

                {/* City Name Label */}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isChecked ? 700 : 500,
                    color: isChecked ? '#1D4ED8' : '#334155',
                    userSelect: 'none',
                  }}
                >
                  {cityName}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CityMultiSelectDropdown;
