-- =================================================================================
-- Exam Duty Management System - Add New Employee & Assign Duty Template
-- Script: 05_how_to_add_new_employee_and_duty.sql
-- Description: Run this script anytime you want to insert a brand new employee
--              and assign them duties directly in Microsoft SQL Server!
-- Target RDBMS: Microsoft SQL Server (ExamDutyDB2)
-- =================================================================================

USE [ExamDutyDB2];
GO

-- =================================================================================
-- 1. ADD A NEW EMPLOYEE
-- Change the Resource ID, Name, Mobile, Email, and City as needed
-- =================================================================================
DECLARE @NewResourceId NVARCHAR(50) = '18999';
DECLARE @NewName NVARCHAR(150) = 'Anil Kumar Sharma';
DECLARE @NewMobile NVARCHAR(20) = '9123456780';
DECLARE @NewEmail NVARCHAR(150) = 'anil.sharma@examduty.gov.in';
DECLARE @NewCity NVARCHAR(100) = 'Bengaluru';

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = @NewResourceId)
BEGIN
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), @NewResourceId, @NewName, @NewMobile, @NewEmail, @NewCity, 'Active');

    PRINT '>>> Successfully created new employee: ' + @NewName + ' (Resource ID: ' + @NewResourceId + ')';
END
ELSE
BEGIN
    PRINT '>>> Employee with Resource ID ' + @NewResourceId + ' already exists.';
END
GO

-- =================================================================================
-- 2. ASSIGN A DUTY TO THE NEW EMPLOYEE
-- =================================================================================
DECLARE @TargetEmpId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.employees WHERE resourceId = '18999');
DECLARE @TargetCityId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Bengaluru');
DECLARE @TargetCenterId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8520');
DECLARE @TargetExamId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'UPSC NDA 2026');
DECLARE @TargetRoleId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'Center Observer');
DECLARE @TargetShiftId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.shifts WHERE name = 'Shift 1');

DECLARE @DutyDate NVARCHAR(30) = '18 Sep 2026';
DECLARE @DutyType NVARCHAR(20) = 'Exam'; -- 'Exam' or 'Mock'

IF @TargetEmpId IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.duties 
        WHERE employeeId = @TargetEmpId 
          AND dutyDate = @DutyDate 
          AND centerId = @TargetCenterId 
          AND shiftId = @TargetShiftId
    )
    BEGIN
        INSERT INTO dbo.duties (
            id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId,
            reportingTime, shiftEndTime, status
        )
        VALUES (
            NEWID(), @TargetEmpId, @DutyDate, @TargetCityId, @TargetCenterId, @DutyType,
            @TargetExamId, @TargetRoleId, @TargetShiftId,
            '07:30 AM', '01:30 PM', 'Pending'
        );

        PRINT '>>> Successfully assigned duty on ' + @DutyDate + ' to employee (Resource ID: 18999)';
    END
    ELSE
    BEGIN
        PRINT '>>> Duty already exists for this date, center, and shift (duplicate prevented).';
    END
END
ELSE
BEGIN
    PRINT '>>> Employee not found. Please insert employee first.';
END
GO

-- =================================================================================
-- 3. CHECK THE NEW EMPLOYEE AND THEIR DUTIES (WITH FULL NAMES & DETAILS)
-- =================================================================================
-- View specific employee by Resource ID:
SELECT 
    e.resourceId AS [Resource ID],
    e.name AS [Employee Name],
    e.mobile AS [Contact Number],
    d.dutyDate AS [Duty Date],
    d.dutyType AS [Duty Type],
    ex.name AS [Exam Name],
    c.centerName AS [Exam Center],
    c.centerCode AS [Center Code],
    ci.name AS [City],
    r.name AS [Role],
    s.name AS [Shift],
    d.status AS [Status]
FROM dbo.employees e
LEFT JOIN dbo.duties d ON e.id = d.employeeId
LEFT JOIN dbo.exams ex ON d.examId = ex.id
LEFT JOIN dbo.centers c ON d.centerId = c.id
LEFT JOIN dbo.cities ci ON d.cityId = ci.id
LEFT JOIN dbo.roles r ON d.roleId = r.id
LEFT JOIN dbo.shifts s ON d.shiftId = s.id
WHERE e.resourceId = '18999';
GO

-- Or view ALL duties for all employees with human-readable names:
SELECT 
    e.resourceId AS [Resource ID],
    e.name AS [Employee Name],
    e.mobile AS [Contact Number],
    d.dutyDate AS [Duty Date],
    d.dutyType AS [Duty Type],
    ex.name AS [Exam Name],
    c.centerName AS [Exam Center],
    ci.name AS [City],
    r.name AS [Duty Role],
    s.name AS [Shift],
    d.reportingTime AS [Reporting Time],
    d.shiftEndTime AS [Shift End Time],
    d.status AS [Status]
FROM dbo.duties d
LEFT JOIN dbo.employees e ON d.employeeId = e.id
LEFT JOIN dbo.exams ex ON d.examId = ex.id
LEFT JOIN dbo.centers c ON d.centerId = c.id
LEFT JOIN dbo.cities ci ON d.cityId = ci.id
LEFT JOIN dbo.roles r ON d.roleId = r.id
LEFT JOIN dbo.shifts s ON d.shiftId = s.id
ORDER BY d.createdAt DESC;
GO
