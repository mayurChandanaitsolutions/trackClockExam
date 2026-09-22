import * as XLSX from 'xlsx-js-style';
import { DutyItem } from '../services/duty.service';
import { EmployeeItem } from '../services/master.service';

export interface ExportFilters {
  fromDate?: string;
  toDate?: string;
  workPlace?: string;
}

/**
 * Normalizes city/workplace names to match variations like Mangalore/Mangaluru, Bangalore/Bengaluru.
 * If city is not explicitly specified, defaults to 'Mysore' (system default).
 */
export const matchesWorkPlace = (itemCity: string | undefined, filterPlace: string): boolean => {
  if (!filterPlace || filterPlace === 'All Places' || filterPlace === 'ALL') return true;
  const effectiveCity = (itemCity && itemCity.trim()) ? itemCity.trim() : 'Mysore';
  const c = effectiveCity.toLowerCase();
  const f = filterPlace.toLowerCase().trim();
  if (f === 'mangaluru' || f === 'mangalore') return c.includes('mangal');
  if (f === 'bangalore' || f === 'bengaluru') return c.includes('bangal') || c.includes('bengal');
  if (f === 'shivamogga' || f === 'shimoga') return c.includes('shiva') || c.includes('shimo');
  if (f === 'mysore' || f === 'mysuru') return c.includes('myso');
  return c.includes(f);
};

/**
 * Exports assigned employee duty and master workforce details to a real, styled .xlsx file
 * with dark colored highlighted main headings, custom column widths, and proper cell types.
 */
export const exportDutiesToExcel = (
  duties: DutyItem[],
  employees: EmployeeItem[],
  filters: ExportFilters = {}
): { count: number; filename: string } => {
  // Map of employees for complete demographic data (Aadhaar, PAN, etc.)
  const empMap = new Map<string, EmployeeItem>();
  employees.forEach((e) => {
    if (e.resourceId) empMap.set(e.resourceId.toLowerCase().trim(), e);
    if (e.id) empMap.set(e.id.toLowerCase().trim(), e);
  });

  // Filter duties according to From Date, To Date, and Work Place
  const filteredDuties = duties.filter((d) => {
    // Work place filter
    const dutyCity = d.city?.name || d.employee?.city || '';
    if (!matchesWorkPlace(dutyCity, filters.workPlace || 'All Places')) {
      return false;
    }

    // From Date filter
    if (filters.fromDate && d.dutyDate) {
      if (d.dutyDate < filters.fromDate) return false;
    }

    // To Date filter
    if (filters.toDate && d.dutyDate) {
      if (d.dutyDate > filters.toDate) return false;
    }

    return true;
  });

  const headers = [
    'SL NO',
    'DATE',
    'EMPLOYEE ID',
    'NAME',
    'MOBILE NUMBER',
    'EMAIL ID',
    'WORK PLACE',
    'AADHAAR NUMBER',
    'PAN NUMBER',
    'EXAM NAME',
    'EXAM TYPE',
    'EXAMINATION CENTER',
    'CENTER CODE',
    'ROLE',
    'SHIFT',
    'REPORTING TIME',
    'SHIFT END TIME',
  ];

  const rows: (string | number)[][] = [headers];

  if (filteredDuties.length > 0) {
    filteredDuties.forEach((d, idx) => {
      const resId = d.employee?.resourceId || '';
      const fullEmp = empMap.get(resId.toLowerCase().trim()) || empMap.get((d.employeeId || '').toLowerCase().trim());

      const mobileStr = String(fullEmp?.mobile || d.employee?.mobile || '—');
      const aadhaarStr = String(fullEmp?.aadhaarNumber || '—');
      const panStr = String(fullEmp?.panNumber || '—');
      const dateStr = String(d.dutyDate || '—');

      rows.push([
        idx + 1,
        dateStr,
        String(resId || '—'),
        String(d.employee?.name || fullEmp?.name || '—'),
        mobileStr,
        String(fullEmp?.email || d.employee?.email || '—'),
        String(d.city?.name || fullEmp?.city || d.employee?.city || '—'),
        aadhaarStr,
        panStr,
        String(d.exam?.name || '—'),
        String(d.dutyType || d.exam?.type || 'Exam'),
        String(d.center?.centerName || '—'),
        String(d.center?.centerCode || '—'),
        String(d.role?.name || d.role?.code || '—'),
        String(d.shift?.name || '—'),
        String(d.reportingTime || '—'),
        String(d.shiftEndTime || '—'),
      ]);
    });
  } else {
    // If no duty records match the date filter, export the registered employees
    const matchingEmployees = employees.filter((e) =>
      matchesWorkPlace(e.city, filters.workPlace || 'All Places')
    );

    matchingEmployees.forEach((emp, idx) => {
      rows.push([
        idx + 1,
        'Not Assigned',
        String(emp.resourceId || '—'),
        String(emp.name || '—'),
        String(emp.mobile || '—'),
        String(emp.email || '—'),
        String(emp.city || '—'),
        String(emp.aadhaarNumber || '—'),
        String(emp.panNumber || '—'),
        '—',
        '—',
        '—',
        '—',
        String(emp.role || 'Invigilator'),
        '—',
        '—',
        '—',
      ]);
    });
  }

  // Create worksheet from Array of Arrays
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set generous column widths so Excel never truncates text or displays ########
  ws['!cols'] = [
    { wch: 8 },  // 1. SL NO
    { wch: 16 }, // 2. DATE (width 16 prevents ########)
    { wch: 16 }, // 3. EMPLOYEE ID
    { wch: 24 }, // 4. NAME
    { wch: 18 }, // 5. MOBILE NUMBER (prevents scientific notation 8.05E+09)
    { wch: 28 }, // 6. EMAIL ID
    { wch: 16 }, // 7. WORK PLACE
    { wch: 20 }, // 8. AADHAAR NUMBER
    { wch: 16 }, // 9. PAN NUMBER
    { wch: 22 }, // 10. EXAM NAME
    { wch: 14 }, // 11. EXAM TYPE
    { wch: 32 }, // 12. EXAMINATION CENTER
    { wch: 16 }, // 13. CENTER CODE
    { wch: 22 }, // 14. ROLE
    { wch: 14 }, // 15. SHIFT
    { wch: 18 }, // 16. REPORTING TIME
    { wch: 18 }, // 17. SHIFT END TIME
  ];

  // Set header row height
  ws['!rows'] = [{ hpt: 28 }];

  // DARK COLOR HIGHLIGHT FOR MAIN HEADING
  // Rich corporate dark navy blue (#1E3A8A) with bold white text (#FFFFFF)
  const headerStyle = {
    fill: {
      patternType: 'solid',
      fgColor: { rgb: '1E3A8A' }, // Deep Royal Navy Blue
    },
    font: {
      name: 'Calibri',
      sz: 11,
      bold: true,
      color: { rgb: 'FFFFFF' }, // Pure White
    },
    alignment: {
      vertical: 'center',
      horizontal: 'center',
      wrapText: false,
    },
    border: {
      top: { style: 'thin', color: { rgb: '0F172A' } },
      bottom: { style: 'medium', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: '3B82F6' } },
      right: { style: 'thin', color: { rgb: '3B82F6' } },
    },
  };

  // Standard clean data cell styles
  const baseDataStyle = {
    font: {
      name: 'Calibri',
      sz: 10,
      color: { rgb: '1E293B' },
    },
    alignment: {
      vertical: 'center',
      horizontal: 'left',
    },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } },
    },
  };

  const centerDataStyle = {
    ...baseDataStyle,
    alignment: {
      vertical: 'center',
      horizontal: 'center',
    },
  };

  // Apply styles across all cells
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Q1');

  // 1. Style Header Row (Row 0) with Dark Navy and White Text
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const headerRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[headerRef]) {
      ws[headerRef].s = headerStyle;
    }
  }

  // 2. Style Data Rows (Row 1 onwards)
  const centerCols = [0, 1, 2, 10, 12, 14, 15, 16]; // SL NO, DATE, ID, TYPE, CODE, SHIFT, TIMES
  const textCols = [1, 2, 4, 7, 8, 12]; // Force string type to prevent scientific notation & date overflow

  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef];
      if (cell && cell.v !== undefined && cell.v !== null) {
        // Enforce string formatting on sensitive columns
        if (textCols.includes(C)) {
          cell.t = 's';
          cell.z = '@';
          cell.v = String(cell.v);
        }

        // Apply visual cell styles
        if (centerCols.includes(C)) {
          cell.s = centerDataStyle;
        } else {
          cell.s = baseDataStyle;
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Assigned Jobs');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `TrackClock_Employee_Assigned_Jobs_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { count: rows.length - 1, filename };
};

/**
 * Exports workforce employee details to a real, styled .xlsx file
 * with dark colored highlighted main headings, custom column widths, and proper cell types.
 */
export const exportEmployeesToExcel = (
  employees: EmployeeItem[],
  workPlace: string = 'All Places'
): { count: number; filename: string } => {
  // If employees are already filtered or we filter from the given list
  const filteredEmployees = employees.filter((emp) => {
    if (!workPlace || workPlace === 'All Places' || workPlace === 'ALL') return true;
    return matchesWorkPlace(emp.city, workPlace);
  });

  // Ensure target list is not empty if the incoming employees array already contains matching items
  const targetEmployees = filteredEmployees.length > 0 ? filteredEmployees : employees;

  const headers = [
    'SL NO',
    'RESOURCE ID',
    'FULL NAME',
    'CONTACT NUMBER',
    'EMAIL ADDRESS',
    'CITY',
    'AADHAAR NUMBER',
    'PAN NUMBER',
    'ROLE',
    'STATUS',
  ];

  const rows: (string | number)[][] = [headers];

  targetEmployees.forEach((emp, idx) => {
    rows.push([
      idx + 1,
      String(emp.resourceId || '—'),
      String(emp.name || '—'),
      String(emp.mobile || '—'),
      String(emp.email || '—'),
      String(emp.city || 'Mysore'),
      String(emp.aadhaarNumber || '—'),
      String(emp.panNumber || '—'),
      String(emp.role || 'Staff'),
      String(emp.status || 'Active'),
    ]);
  });

  // Create worksheet from Array of Arrays
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths so text is never truncated
  ws['!cols'] = [
    { wch: 8 },  // 1. SL NO
    { wch: 16 }, // 2. RESOURCE ID
    { wch: 26 }, // 3. FULL NAME
    { wch: 18 }, // 4. CONTACT NUMBER
    { wch: 30 }, // 5. EMAIL ADDRESS
    { wch: 16 }, // 6. CITY
    { wch: 22 }, // 7. AADHAAR NUMBER
    { wch: 18 }, // 8. PAN NUMBER
    { wch: 18 }, // 9. ROLE
    { wch: 14 }, // 10. STATUS
  ];

  // Set header row height
  ws['!rows'] = [{ hpt: 28 }];

  // DARK COLOR HIGHLIGHT FOR MAIN HEADING
  // Rich corporate dark navy blue (#1E3A8A) with bold white text (#FFFFFF)
  const headerStyle = {
    fill: {
      patternType: 'solid',
      fgColor: { rgb: '1E3A8A' }, // Deep Royal Navy Blue
    },
    font: {
      name: 'Calibri',
      sz: 11,
      bold: true,
      color: { rgb: 'FFFFFF' }, // Pure White
    },
    alignment: {
      vertical: 'center',
      horizontal: 'center',
      wrapText: false,
    },
    border: {
      top: { style: 'thin', color: { rgb: '0F172A' } },
      bottom: { style: 'medium', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: '3B82F6' } },
      right: { style: 'thin', color: { rgb: '3B82F6' } },
    },
  };

  const baseDataStyle = {
    font: {
      name: 'Calibri',
      sz: 10,
      color: { rgb: '1E293B' },
    },
    alignment: {
      vertical: 'center',
      horizontal: 'left',
    },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } },
    },
  };

  const centerDataStyle = {
    ...baseDataStyle,
    alignment: {
      vertical: 'center',
      horizontal: 'center',
    },
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');

  // 1. Style Header Row
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const headerRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[headerRef]) {
      ws[headerRef].s = headerStyle;
    }
  }

  // 2. Style Data Rows
  const centerCols = [0, 1, 5, 8, 9]; // SL NO, RESOURCE ID, CITY, ROLE, STATUS
  const textCols = [1, 3, 6, 7]; // RESOURCE ID, MOBILE, AADHAAR, PAN (force string format)

  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef];
      if (cell && cell.v !== undefined && cell.v !== null) {
        if (textCols.includes(C)) {
          cell.t = 's';
          cell.z = '@';
          cell.v = String(cell.v);
        }

        if (centerCols.includes(C)) {
          cell.s = centerDataStyle;
        } else {
          cell.s = baseDataStyle;
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Workforce Members');

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanPlace = (!workPlace || workPlace === 'All Places' || workPlace === 'ALL') ? 'All' : workPlace.replace(/\s+/g, '_');
  const filename = `TrackClock_Workforce_Members_${cleanPlace}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { count: targetEmployees.length, filename };
};
