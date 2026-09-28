import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import masterService, { EmployeeItem } from '../services/master.service';
import { hasContinuousSequence } from '../utils/validation';

interface ParsedEmployeeRow {
  resourceId: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  status: 'valid' | 'duplicate' | 'invalid';
  validationMessage?: string;
}

interface BulkUploadEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingEmployees: EmployeeItem[];
}

export const BulkUploadEmployeeModal: React.FC<BulkUploadEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingEmployees,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [removedDuplicatesCount, setRemovedDuplicatesCount] = useState<number>(0);
  const [removedDuplicateNames, setRemovedDuplicateNames] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Upload status state
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [uploadResult, setUploadResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  // 1. Download Sample Excel Template with dynamic non-colliding IDs
  const handleDownloadTemplate = () => {
    const numericIds = existingEmployees
      .map((e) => parseInt(e.resourceId, 10))
      .filter((n) => !isNaN(n) && n > 500000);
    const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 597330;

    const sampleData = [
      {
        'Resource ID': String(nextId),
        'Full Name': 'Rajesh Sharma',
        'Mobile Number': `9845${Math.floor(100000 + Math.random() * 900000)}`,
        'Email Address': 'rajesh@gmail.com',
        'Assigned City': 'Mysore',
        'Aadhaar Number': '489278985583',
        'PAN Number': 'ABCDE1234F',
      },
      {
        'Resource ID': String(nextId + 1),
        'Full Name': 'Priya Sharma',
        'Mobile Number': `9845${Math.floor(100000 + Math.random() * 900000)}`,
        'Email Address': 'priya@gmail.com',
        'Assigned City': 'Bangalore',
        'Aadhaar Number': '345678981234',
        'PAN Number': 'BCDEF2345G',
      },
      {
        'Resource ID': String(nextId + 2),
        'Full Name': 'Karthik Rao',
        'Mobile Number': `9845${Math.floor(100000 + Math.random() * 900000)}`,
        'Email Address': 'karthik@gmail.com',
        'Assigned City': 'Mangalore',
        'Aadhaar Number': '548291038472',
        'PAN Number': 'CDEFG3456H',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 15 }, // Resource ID
      { wch: 22 }, // Full Name
      { wch: 16 }, // Mobile Number
      { wch: 26 }, // Email Address
      { wch: 16 }, // Assigned City
      { wch: 18 }, // Aadhaar Number
      { wch: 14 }, // PAN Number
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee_Template');
    XLSX.writeFile(wb, 'Bulk_Employee_Upload_Template.xlsx');
  };

  // 2. Normalizer & Column Matching
  const getFieldValue = (row: Record<string, any>, possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
      // Also check case-insensitive match
      const lowerTarget = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundKey = Object.keys(row).find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerTarget
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  };

  // 3. Process Selected File
  const processFile = (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Unable to read the selected file.');
        }

        const wb = XLSX.read(buffer, { type: 'array' });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('The uploaded spreadsheet contains no sheets.');
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('The file appears to be empty. Please fill in employee rows before uploading.');
        }

        // Existing IDs and Mobiles for duplicate detection
        const existingIdSet = new Set(existingEmployees.map((e) => e.resourceId.toLowerCase().trim()));
        const existingMobileSet = new Set(existingEmployees.map((e) => e.mobile.replace(/\D/g, '')));

        const parsed: ParsedEmployeeRow[] = rawJson.map((row, index) => {
          const resourceId = getFieldValue(row, [
            'Resource ID',
            'Staff ID',
            'ResourceId',
            'StaffId',
            'Employee ID',
            'ID',
          ]);
          const name = getFieldValue(row, [
            'Full Name',
            'Member Full Name',
            'Name',
            'Member Name',
            'Employee Name',
          ]);
          const mobile = getFieldValue(row, [
            'Mobile Number',
            'Contact / Mobile Number',
            'Mobile',
            'Contact',
            'Phone',
            'Phone Number',
          ]);
          const email = getFieldValue(row, ['Email Address', 'Email', 'Mail']);
          let city = getFieldValue(row, ['Assigned City', 'City', 'Location', 'Place']);
          if (!city) city = 'Mysore';

          const aadhaarNumber = getFieldValue(row, [
            'Aadhaar Card Number',
            'Aadhaar Number',
            'Aadhaar',
            'Aadhar Number',
            'Aadhar',
          ]);
          const panNumber = getFieldValue(row, [
            'PAN Card Number',
            'PAN Number',
            'PAN',
            'Pan Number',
          ]).toUpperCase();

          // Validation
          let status: 'valid' | 'duplicate' | 'invalid' = 'valid';
          let validationMessage = '';

          if (!resourceId || !name || !mobile) {
            status = 'invalid';
            const missing = [];
            if (!resourceId) missing.push('Resource ID');
            if (!name) missing.push('Full Name');
            if (!mobile) missing.push('Mobile Number');
            validationMessage = `Missing: ${missing.join(', ')}`;
          } else if (existingIdSet.has(resourceId.toLowerCase())) {
            status = 'duplicate';
            validationMessage = `Resource ID ${resourceId} already exists in database.`;
          } else if (existingMobileSet.has(mobile.replace(/\D/g, ''))) {
            status = 'duplicate';
            validationMessage = `Mobile ${mobile} is already registered.`;
          } else if (hasContinuousSequence(mobile, 6)) {
            status = 'invalid';
            validationMessage = `Mobile number contains continuous sequence like 123456.`;
          } else if (aadhaarNumber && hasContinuousSequence(aadhaarNumber, 6)) {
            status = 'invalid';
            validationMessage = `Aadhaar number contains continuous sequence like 123456.`;
          }

          return {
            resourceId,
            name,
            mobile,
            email: email || undefined,
            city,
            aadhaarNumber: aadhaarNumber || undefined,
            panNumber: panNumber || undefined,
            status,
            validationMessage,
          };
        });

        // Also check duplicates within the uploaded file itself
        const seenInFile = new Set<string>();
        parsed.forEach((item) => {
          if (item.status === 'valid') {
            const key = item.resourceId.toLowerCase();
            if (seenInFile.has(key)) {
              item.status = 'duplicate';
              item.validationMessage = `Duplicate Resource ID ${item.resourceId} in uploaded file.`;
            } else {
              seenInFile.add(key);
            }
          }
        });

        // AUTOMATICALLY REMOVE DUPLICATE EMPLOYEES: Same employee cannot be registered twice!
        const duplicates = parsed.filter((r) => r.status === 'duplicate');
        const nonDuplicates = parsed.filter((r) => r.status !== 'duplicate');

        setRemovedDuplicatesCount(duplicates.length);
        setRemovedDuplicateNames(
          duplicates.map((d) => `${d.name || 'Staff'} (${d.resourceId || 'No ID'})`)
        );

        if (duplicates.length > 0 && nonDuplicates.length === 0) {
          setParseError(
            `All ${duplicates.length} employee record(s) in this file already exist in the database or are duplicates. They have been automatically removed.`
          );
        }

        setParsedRows(nonDuplicates);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setParseError(err.message || 'Failed to parse file. Please upload a valid .xlsx or .csv file.');
        setParsedRows([]);
        setRemovedDuplicatesCount(0);
        setRemovedDuplicateNames([]);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read file from local disk.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setRemovedDuplicatesCount(0);
    setRemovedDuplicateNames([]);
    setParseError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

  // 4. Submit Valid Rows
  const validRows = parsedRows.filter((r) => r.status === 'valid');

  const handleUploadSubmit = async () => {
    if (validRows.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: validRows.length });
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setUploadProgress({ current: i + 1, total: validRows.length });

      try {
        await masterService.createEmployee({
          resourceId: row.resourceId,
          name: row.name,
          mobile: row.mobile,
          email: row.email,
          city: row.city,
          aadhaarNumber: row.aadhaarNumber,
          panNumber: row.panNumber,
        });
        successCount++;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || err.message || `Failed to register ${row.name} (${row.resourceId})`;
        errors.push(`${row.name} (${row.resourceId}): ${errorMsg}`);
      }
    }

    setUploadResult({
      successCount,
      failureCount: errors.length,
      errors,
    });
    setUploading(false);

    if (successCount > 0) {
      onSuccess();
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-content-card animate-fade-in"
        style={{
          maxWidth: '820px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '28px 26px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            transition: 'background-color 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Upload size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
              Bulk Upload Employees
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748B' }}>
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file to register multiple workforce members at once.
            </p>
          </div>
        </div>

        {/* Download Template Action Bar */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={20} color="#2563EB" />
            <span style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>
              Need the official format? Download our pre-formatted spreadsheet template:
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              color: '#1E293B',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Download size={15} color="#2563EB" />
            <span>Download Sample Template (.xlsx)</span>
          </button>
        </div>

        {/* Upload Result Alert */}
        {uploadResult && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: uploadResult.failureCount === 0 ? '#F0FDF4' : '#FFFBEB',
              border: `1px solid ${uploadResult.failureCount === 0 ? '#BBF7D0' : '#FDE68A'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: uploadResult.errors.length ? '8px' : '0' }}>
              {uploadResult.failureCount === 0 ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : (
                <AlertTriangle size={18} color="#D97706" />
              )}
              <span style={{ fontWeight: 700, fontSize: '14.5px', color: uploadResult.failureCount === 0 ? '#166534' : '#92400E' }}>
                Bulk Upload Summary: {uploadResult.successCount} employee(s) registered successfully
                {uploadResult.failureCount > 0 ? `, ${uploadResult.failureCount} failed.` : '.'}
              </span>
            </div>
            {uploadResult.errors.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#B45309' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Errors encountered:</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {uploadResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {parseError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} />
            <span>{parseError}</span>
          </div>
        )}

        {/* Removed Duplicates Notification Alert */}
        {removedDuplicatesCount > 0 && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              color: '#92400E',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '2px' }}>
                {removedDuplicatesCount} Duplicate Employee{removedDuplicatesCount > 1 ? 's' : ''} Automatically Removed
              </div>
              <div style={{ color: '#78350F', lineHeight: 1.4 }}>
                The same employee cannot be registered twice. Removed duplicate entries:{' '}
                <strong>
                  {removedDuplicateNames.slice(0, 4).join(', ')}
                  {removedDuplicateNames.length > 4 ? ` and ${removedDuplicateNames.length - 4} more` : ''}
                </strong>
                . Only unique new employees are retained in the list below.
              </div>
            </div>
          </div>
        )}

        {/* Drag & Drop Zone */}
        {!selectedFile && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#2563EB' : '#CBD5E1'}`,
              backgroundColor: isDragging ? '#EFF6FF' : '#FAFAFA',
              borderRadius: '16px',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 14px',
                borderRadius: '50%',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              Click to browse or drag & drop file here
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B' }}>
              Supports Excel (.xlsx, .xls) and CSV (.csv) files with employee records
            </p>
          </div>
        )}

        {/* Selected File & Preview Table */}
        {selectedFile && parsedRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* File Info Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#F1F5F9',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#2563EB" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} unique row{parsedRows.length > 1 ? 's' : ''} to review &bull;{' '}
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>{validRows.length} valid to import</span>
                    {removedDuplicatesCount > 0 && (
                      <span style={{ color: '#D97706', fontWeight: 600, marginLeft: '6px' }}>
                        ({removedDuplicatesCount} duplicates removed)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={uploading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>Remove & Choose Another</span>
              </button>
            </div>

            {/* Table Preview */}
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 1, borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>#</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Resource ID</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Full Name</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Mobile</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>City</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Aadhaar</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>PAN</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: row.status === 'valid' ? '#FFFFFF' : '#FEF2F2',
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{index + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>
                        {row.resourceId || '—'}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#1E293B' }}>{row.name || '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{row.mobile || '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{row.city || 'Mysore'}</td>
                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{row.aadhaarNumber || '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{row.panNumber || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {row.status === 'valid' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: '#DCFCE7',
                              color: '#15803D',
                            }}
                          >
                            Ready
                          </span>
                        ) : (
                          <span
                            title={row.validationMessage}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: '#FEE2E2',
                              color: '#B91C1C',
                              cursor: 'help',
                            }}
                          >
                            Invalid
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          title="Remove this employee row from import list"
                          style={{
                            background: '#FEE2E2',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: '#DC2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                  <span>Registering employees in database...</span>
                  <span style={{ fontWeight: 600 }}>
                    {uploadProgress.current} / {uploadProgress.total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#2563EB',
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={uploading}
            style={{ padding: '10px 20px', fontSize: '14.5px' }}
          >
            {uploadResult ? 'Close' : 'Cancel'}
          </button>

          {selectedFile && validRows.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleUploadSubmit}
              disabled={uploading}
              style={{
                padding: '10px 22px',
                fontSize: '14.5px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading ({uploadProgress.current}/{uploadProgress.total})...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Register {validRows.length} Employee{validRows.length > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkUploadEmployeeModal;
