-- =================================================================================
-- Exam Duty Management System - ALL-IN-ONE MASTER SETUP SCRIPT
-- Script: 04_all_in_one_run_me.sql
-- Description: Run this single script in SQL Server Management Studio (SSMS)
--              to create the database, all 8 tables, master data, employees, and duties.
-- Target RDBMS: Microsoft SQL Server (SQLEXPRESS)
-- =================================================================================

-- STEP 1: CREATE DATABASE IF NOT EXISTS
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ExamDutyDB2')
BEGIN
    CREATE DATABASE [ExamDutyDB2];
    PRINT '>>> Database [ExamDutyDB2] created.';
END
GO

USE [ExamDutyDB2];
GO

-- STEP 2: CREATE TABLES WITH CONSTRAINTS
IF OBJECT_ID('dbo.employees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employees (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        resourceId NVARCHAR(50) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        mobile NVARCHAR(20) NOT NULL,
        email NVARCHAR(150) NULL,
        city NVARCHAR(100) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'Active',
        passwordHash NVARCHAR(255) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_employees PRIMARY KEY (id),
        CONSTRAINT UQ_employees_resourceId UNIQUE (resourceId),
        CONSTRAINT UQ_employees_mobile UNIQUE (mobile)
    );
    PRINT '>>> Table [employees] created.';
END
GO

IF OBJECT_ID('dbo.cities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.cities (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        state NVARCHAR(100) NOT NULL DEFAULT 'Karnataka',
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_cities PRIMARY KEY (id),
        CONSTRAINT UQ_cities_name UNIQUE (name)
    );
    PRINT '>>> Table [cities] created.';
END
GO

IF OBJECT_ID('dbo.centers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.centers (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        centerCode NVARCHAR(50) NOT NULL,
        centerName NVARCHAR(200) NOT NULL,
        cityId UNIQUEIDENTIFIER NOT NULL,
        address NVARCHAR(255) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_centers PRIMARY KEY (id),
        CONSTRAINT UQ_centers_code UNIQUE (centerCode),
        CONSTRAINT FK_centers_cities FOREIGN KEY (cityId) REFERENCES dbo.cities(id) ON DELETE CASCADE
    );
    PRINT '>>> Table [centers] created.';
END
GO

IF OBJECT_ID('dbo.exams', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.exams (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) NULL,
        type NVARCHAR(20) NOT NULL DEFAULT 'Exam',
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_exams PRIMARY KEY (id),
        CONSTRAINT UQ_exams_name UNIQUE (name)
    );
    PRINT '>>> Table [exams] created.';
END
GO

IF OBJECT_ID('dbo.roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.roles (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_roles PRIMARY KEY (id),
        CONSTRAINT UQ_roles_name UNIQUE (name)
    );
    PRINT '>>> Table [roles] created.';
END
GO

IF OBJECT_ID('dbo.shifts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.shifts (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(50) NOT NULL,
        defaultReportingTime NVARCHAR(20) NOT NULL DEFAULT '07:30 AM',
        defaultEndTime NVARCHAR(20) NOT NULL DEFAULT '01:30 PM',
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_shifts PRIMARY KEY (id),
        CONSTRAINT UQ_shifts_name UNIQUE (name)
    );
    PRINT '>>> Table [shifts] created.';
END
GO

IF OBJECT_ID('dbo.attendance_files', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.attendance_files (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        originalName NVARCHAR(255) NOT NULL,
        fileName NVARCHAR(255) NOT NULL,
        mimeType NVARCHAR(100) NOT NULL,
        size BIGINT NOT NULL,
        filePath NVARCHAR(500) NOT NULL,
        uploadedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_attendance_files PRIMARY KEY (id)
    );
    PRINT '>>> Table [attendance_files] created.';
END
GO

IF OBJECT_ID('dbo.duties', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.duties (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        employeeId UNIQUEIDENTIFIER NOT NULL,
        dutyDate NVARCHAR(30) NOT NULL,
        cityId UNIQUEIDENTIFIER NOT NULL,
        centerId UNIQUEIDENTIFIER NOT NULL,
        dutyType NVARCHAR(20) NOT NULL DEFAULT 'Exam',
        examId UNIQUEIDENTIFIER NOT NULL,
        roleId UNIQUEIDENTIFIER NOT NULL,
        shiftId UNIQUEIDENTIFIER NOT NULL,
        reportingTime NVARCHAR(30) NULL,
        shiftEndTime NVARCHAR(30) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        attendanceFileId UNIQUEIDENTIFIER NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_duties PRIMARY KEY (id),
        CONSTRAINT FK_duties_employees FOREIGN KEY (employeeId) REFERENCES dbo.employees(id) ON DELETE CASCADE,
        CONSTRAINT FK_duties_cities FOREIGN KEY (cityId) REFERENCES dbo.cities(id),
        CONSTRAINT FK_duties_centers FOREIGN KEY (centerId) REFERENCES dbo.centers(id),
        CONSTRAINT FK_duties_exams FOREIGN KEY (examId) REFERENCES dbo.exams(id),
        CONSTRAINT FK_duties_roles FOREIGN KEY (roleId) REFERENCES dbo.roles(id),
        CONSTRAINT FK_duties_shifts FOREIGN KEY (shiftId) REFERENCES dbo.shifts(id),
        CONSTRAINT FK_duties_attendance FOREIGN KEY (attendanceFileId) REFERENCES dbo.attendance_files(id) ON DELETE SET NULL,
        CONSTRAINT UQ_duties_duplicate_check UNIQUE (employeeId, dutyDate, centerId, shiftId)
    );
    PRINT '>>> Table [duties] created with duplicate prevention constraint.';
END
GO

-- STEP 3: INSERT MASTER DATA
-- Cities
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Bengaluru')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Bengaluru', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mysuru')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Mysuru', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Hubballi')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Hubballi', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mangaluru')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Mangaluru', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Belagavi')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Belagavi', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Hyderabad')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Hyderabad', 'Telangana');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mumbai')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Mumbai', 'Maharashtra');

-- Centers
DECLARE @CityBengaluru UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Bengaluru');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8520')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8520', 'TCS iON Digital Zone iDZ Karmanghat', @CityBengaluru, 'Karmanghat Main Road, Ring Road');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '9142')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '9142', 'TCS iON Digital Zone Powai', @CityBengaluru, 'Technology Park, Powai');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8411')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8411', 'iDZ Electronics City Bengaluru', @CityBengaluru, 'Phase 1, Electronic City');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8412')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8412', 'iDZ Whitefield Bengaluru', @CityBengaluru, 'ITPL Main Road, Whitefield');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '7701')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '7701', 'PES University Campus Center', @CityBengaluru, '100 Feet Ring Road, BSK 3rd Stage');

-- Exams
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'SSC CGL Tier 1 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'SSC CGL Tier 1 2026', 'SSC-CGL-26', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'RRB NTPC Phase 1')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'RRB NTPC Phase 1', 'RRB-NTPC-01', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'IBPS PO Mains 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'IBPS PO Mains 2026', 'IBPS-PO-M', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'UPSC NDA 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'UPSC NDA 2026', 'UPSC-NDA', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'JEE Main 2026 Session 2')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'JEE Main 2026 Session 2', 'JEE-M-S2', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'Mock Drill 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'Mock Drill 2026', 'MOCK-DR-26', 'Mock');

-- Roles
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'Invigilator')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'Invigilator', 'Invigilator');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'Center Observer')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'Center Observer', 'Center Observer');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'SO')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'Station Officer', 'SO');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'MOT')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'Mobile Observer Team', 'MOT');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'LOT')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'Local Observer Team', 'LOT');

-- Shifts
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 1')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 1', '07:30 AM', '01:30 PM');
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 2')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 2', '12:30 PM', '06:30 PM');
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 3')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 3', '05:30 PM', '09:30 PM');

-- Employees
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17655')
BEGIN
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '17655', 'Sanjeev Kumar N', '9876543210', 'sanjeev.kumar@examduty.gov.in', 'Bengaluru', 'Active');
END
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17656')
BEGIN
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '17656', 'Rajesh Sharma', '9876543211', 'rajesh.sharma@examduty.gov.in', 'Bengaluru', 'Active');
END

-- Duties for Sanjeev Kumar N (17655)
DECLARE @EmpId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.employees WHERE resourceId = '17655');
DECLARE @CityBlr UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Bengaluru');
DECLARE @C1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8520');
DECLARE @C2 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '9142');
DECLARE @C3 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8411');
DECLARE @C4 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.centers WHERE centerCode = '8412');
DECLARE @Ex1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'SSC CGL Tier 1 2026');
DECLARE @Ex2 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'RRB NTPC Phase 1');
DECLARE @Ex3 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'Mock Drill 2026');
DECLARE @Ex4 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.exams WHERE name = 'IBPS PO Mains 2026');
DECLARE @R1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'Invigilator');
DECLARE @R2 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'Center Observer');
DECLARE @R3 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.roles WHERE code = 'SO');
DECLARE @S1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.shifts WHERE name = 'Shift 1');
DECLARE @S2 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.shifts WHERE name = 'Shift 2');

IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '30 Aug 2026' AND centerId = @C1 AND shiftId = @S1)
BEGIN
    INSERT INTO dbo.duties (id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId, reportingTime, shiftEndTime, status)
    VALUES (NEWID(), @EmpId, '30 Aug 2026', @CityBlr, @C1, 'Exam', @Ex1, @R1, @S1, '07:30 AM', '01:30 PM', 'Approved');
END

IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '28 Aug 2026' AND centerId = @C2 AND shiftId = @S2)
BEGIN
    INSERT INTO dbo.duties (id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId, reportingTime, shiftEndTime, status)
    VALUES (NEWID(), @EmpId, '28 Aug 2026', @CityBlr, @C2, 'Exam', @Ex2, @R2, @S2, '12:30 PM', '06:30 PM', 'Pending');
END

IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '25 Aug 2026' AND centerId = @C3 AND shiftId = @S1)
BEGIN
    INSERT INTO dbo.duties (id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId, reportingTime, shiftEndTime, status)
    VALUES (NEWID(), @EmpId, '25 Aug 2026', @CityBlr, @C3, 'Mock', @Ex3, @R3, @S1, '07:30 AM', '01:30 PM', 'Pending');
END

IF NOT EXISTS (SELECT 1 FROM dbo.duties WHERE employeeId = @EmpId AND dutyDate = '20 Aug 2026' AND centerId = @C4 AND shiftId = @S2)
BEGIN
    INSERT INTO dbo.duties (id, employeeId, dutyDate, cityId, centerId, dutyType, examId, roleId, shiftId, reportingTime, shiftEndTime, status)
    VALUES (NEWID(), @EmpId, '20 Aug 2026', @CityBlr, @C4, 'Exam', @Ex4, @R1, @S2, '12:30 PM', '06:30 PM', 'Rejected');
END
GO

PRINT '========================================================================';
PRINT '  Exam Duty Management System - Database & Seed Setup Completed!';
PRINT '========================================================================';
GO

-- Verification Queries
SELECT 'Employees Count' AS [Metric], COUNT(*) AS [Total] FROM dbo.employees
UNION ALL
SELECT 'Cities Count', COUNT(*) FROM dbo.cities
UNION ALL
SELECT 'Centers Count', COUNT(*) FROM dbo.centers
UNION ALL
SELECT 'Exams Count', COUNT(*) FROM dbo.exams
UNION ALL
SELECT 'Roles Count', COUNT(*) FROM dbo.roles
UNION ALL
SELECT 'Shifts Count', COUNT(*) FROM dbo.shifts
UNION ALL
SELECT 'Duties Count', COUNT(*) FROM dbo.duties;
GO
