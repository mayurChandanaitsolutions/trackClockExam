-- =================================================================================
-- Exam Duty Management System - Human-Readable Duties Query & View
-- Script: 06_view_all_duties_human_readable.sql
-- Description: Run this script in SQL Server Management Studio (SSMS) to see
--              clean details (Resource ID, Name, Contact, Date, Center, Exam, Role)
--              without any raw Duty ID or GUIDs!
-- =================================================================================

USE [ExamDutyDB2];
GO

-- 1. Create or Update the Human-Readable VIEW (Duty ID removed, starts with Resource ID)
CREATE OR ALTER VIEW dbo.vw_duties AS
SELECT 
    e.resourceId AS [Resource ID],
    e.name AS [Employee Name],
    e.mobile AS [Contact Number],
    d.dutyDate AS [Duty Date],
    d.dutyType AS [Duty Type],
    ex.name AS [Exam Name],
    ex.code AS [Exam Code],
    c.centerName AS [Exam Center],
    c.centerCode AS [Center Code],
    ci.name AS [City],
    r.name AS [Duty Role],
    s.name AS [Shift],
    d.reportingTime AS [Reporting Time],
    d.shiftEndTime AS [Shift End Time],
    d.status AS [Status],
    d.createdAt AS [Created At]
FROM dbo.duties d
LEFT JOIN dbo.employees e ON d.employeeId = e.id
LEFT JOIN dbo.exams ex ON d.examId = ex.id
LEFT JOIN dbo.centers c ON d.centerId = c.id
LEFT JOIN dbo.cities ci ON d.cityId = ci.id
LEFT JOIN dbo.roles r ON d.roleId = r.id
LEFT JOIN dbo.shifts s ON d.shiftId = s.id;
GO

-- 2. QUERY TO RUN ANYTIME IN SQL SERVER MANAGEMENT STUDIO (SSMS):
-- Simply run this single line to view all duties cleanly:
SELECT * FROM dbo.vw_duties ORDER BY [Created At] DESC;
GO

-- 3. OR RUN THIS DIRECT QUERY (No Duty ID):
SELECT 
    e.resourceId AS [Resource ID],
    e.name AS [Employee Name],
    e.mobile AS [Contact Number],
    d.dutyDate AS [Duty Date],
    d.dutyType AS [Duty Type],
    ex.name AS [Exam Name],
    ex.code AS [Exam Code],
    c.centerName AS [Exam Center],
    c.centerCode AS [Center Code],
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
