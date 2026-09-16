-- =================================================================================
-- Exam Duty Management System - Employees & Initial Duties Seed Script
-- Script: 03_insert_employees_and_duties.sql
-- Description: Seeds test employees and sample duties linked to real relational entities
-- Target RDBMS: Microsoft SQL Server (ExamDutyDB2)
-- =================================================================================

USE [ExamDutyDB2];
GO

-- 1. Insert Employees
-- Primary Reference Employee: Sanjeev Kumar N (Resource ID: 17655, Mobile: 9876543210)
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17655')
BEGIN
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (
        NEWID(),
        '17655',
        'Sanjeev Kumar N',
        '9876543210',
        'sanjeev.kumar@examduty.gov.in',
        'Bengaluru',
        'Active'
    );
    PRINT '>>> Employee Sanjeev Kumar N (Resource ID 17655) created.';
END
ELSE
BEGIN
    PRINT '>>> Employee 17655 already exists.';
END

-- Additional Employee 2: Rajesh Sharma
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17656')
BEGIN
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (
        NEWID(),
        '17656',
        'Rajesh Sharma',
        '9876543211',
        'rajesh.sharma@examduty.gov.in',
        'Bengaluru',
        'Active'
    );
    PRINT '>>> Employee Rajesh Sharma (Resource ID 17656) created.';
END

-- Additional Employee 3: Priya Patel
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17657')
BEGIN
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (
        NEWID(),
        '17657',
        'Priya Patel',
        '9876543212',
        'priya.patel@examduty.gov.in',
        'Bengaluru',
        'Active'
    );
    PRINT '>>> Employee Priya Patel (Resource ID 17657) created.';
END
GO

-- =================================================================================
-- 2. Insert Sample Duties for Employee 17655 (Sanjeev Kumar N)
-- =================================================================================
DECLARE @EmpId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.employees WHERE resourceId = '17655');
DECLARE @CityBlr UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Bengaluru');

DECLARE @Center1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8520');
DECLARE @Center2 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '9142');
DECLARE @Center3 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8411');
DECLARE @Center4 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8412');

DECLARE @ExamSSC UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'SSC CGL Tier 1 2026');
DECLARE @ExamRRB UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'RRB NTPC Phase 1');
DECLARE @ExamMock UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'Mock Drill 2026');
DECLARE @ExamIBPS UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'IBPS PO Mains 2026');

DECLARE @RoleInv UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'Invigilator');
DECLARE @RoleObs UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'Center Observer');
DECLARE @RoleSO UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'SO');

DECLARE @Shift1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.shifts WHERE name = 'Shift 1');
DECLARE @Shift2 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.shifts WHERE name = 'Shift 2');

-- Duty 1: SSC CGL Tier 1 2026 - Approved
IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '30 Aug 2026' AND centerId = @Center1 AND shiftId = @Shift1)
BEGIN
    INSERT INTO dbo.duties (
        id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId,
        reportingTime, shiftEndTime, status
    )
    VALUES (
        NEWID(), @EmpId, '30 Aug 2026', @CityBlr, @Center1, 'Exam', @ExamSSC, @RoleInv, @Shift1,
        '07:30 AM', '01:30 PM', 'Approved'
    );
END

-- Duty 2: RRB NTPC Phase 1 - Pending
IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '28 Aug 2026' AND centerId = @Center2 AND shiftId = @Shift2)
BEGIN
    INSERT INTO dbo.duties (
        id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId,
        reportingTime, shiftEndTime, status
    )
    VALUES (
        NEWID(), @EmpId, '28 Aug 2026', @CityBlr, @Center2, 'Exam', @ExamRRB, @RoleObs, @Shift2,
        '12:30 PM', '06:30 PM', 'Pending'
    );
END

-- Duty 3: Mock Drill 2026 - Pending
IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '25 Aug 2026' AND centerId = @Center3 AND shiftId = @Shift1)
BEGIN
    INSERT INTO dbo.duties (
        id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId,
        reportingTime, shiftEndTime, status
    )
    VALUES (
        NEWID(), @EmpId, '25 Aug 2026', @CityBlr, @Center3, 'Mock', @ExamMock, @RoleSO, @Shift1,
        '07:30 AM', '01:30 PM', 'Pending'
    );
END

-- Duty 4: IBPS PO Mains 2026 - Rejected
IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '20 Aug 2026' AND centerId = @Center4 AND shiftId = @Shift2)
BEGIN
    INSERT INTO dbo.duties (
        id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId,
        reportingTime, shiftEndTime, status
    )
    VALUES (
        NEWID(), @EmpId, '20 Aug 2026', @CityBlr, @Center4, 'Exam', @ExamIBPS, @RoleInv, @Shift2,
        '12:30 PM', '06:30 PM', 'Rejected'
    );
END

PRINT '>>> Baseline duties seeded successfully.';
GO
