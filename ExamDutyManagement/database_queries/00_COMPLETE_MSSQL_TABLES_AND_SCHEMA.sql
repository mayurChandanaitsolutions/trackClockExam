-- ====================================================================================================
-- PROJECT: EXAM DUTY MANAGEMENT SYSTEM
-- SCRIPT: 00_COMPLETE_MSSQL_TABLES_AND_SCHEMA.sql
-- DESCRIPTION: Complete SQL Server Database Schema, Table Definitions, Relationships, and Seed Data
-- TARGET RDBMS: Microsoft SQL Server 2016+ / SQL Server Express / Azure SQL
-- ====================================================================================================

/*
====================================================================================================
TABLE OF CONTENTS & SCHEMA ARCHITECTURE:
----------------------------------------------------------------------------------------------------
1. [ExamDutyDB2]          - Core Application Database
2. dbo.employees           - Staff & Admin Credentials (resourceId, mobile, name, city, status)
3. dbo.cities              - Operating Cities / Regions (Mysore, Bengaluru, Mangaluru, etc.)
4. dbo.centers             - Examination Venues & Digital Zones (linked to dbo.cities)
5. dbo.exams               - Supported Exams & Mock Tests (NEET, JEE, SSC, UPSC, AIIMS, etc.)
6. dbo.roles               - Duty Designations (M OT, SO, HOT(IT Manager), CCTV, Equity Lab Supervisior_ ssc)
7. dbo.shifts              - Standard Work Shifts (Shift 1, Shift 2, Shift 3 with timings)
8. dbo.attendance_files    - Uploaded Attendance Sheet Proofs (file metadata & local storage path)
9. dbo.duties              - Core Duty Assignment & Attendance Submission Ledger
====================================================================================================
RELATIONSHIP DIAGRAM (ENTITY RELATIONSHIP):
----------------------------------------------------------------------------------------------------
  [cities] ──< [centers]
                  │
                  ▼
  [employees] ───< [duties] >─── [attendance_files]
                     │  │  │
                     ▼  ▼  ▼
            [exams] [roles] [shifts]
====================================================================================================
*/

-- -------------------------------------------------------------------------------------------------
-- STEP 1: CREATE DATABASE IF NOT EXISTS
-- -------------------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ExamDutyDB2')
BEGIN
    CREATE DATABASE [ExamDutyDB2];
    PRINT '>>> Database [ExamDutyDB2] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Database [ExamDutyDB2] already exists.';
END
GO

USE [ExamDutyDB2];
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 2: TABLE DEFINITIONS
-- -------------------------------------------------------------------------------------------------

-- 1. EMPLOYEES TABLE (Staff and Administrators)
IF OBJECT_ID('dbo.employees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employees (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        resourceId NVARCHAR(50) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        mobile NVARCHAR(20) NOT NULL,
        email NVARCHAR(150) NULL,
        city NVARCHAR(100) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'Active',   -- 'Active' | 'Inactive'
        passwordHash NVARCHAR(255) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_employees PRIMARY KEY (id),
        CONSTRAINT UQ_employees_resourceId UNIQUE (resourceId),
        CONSTRAINT UQ_employees_mobile UNIQUE (mobile)
    );
    CREATE NONCLUSTERED INDEX IX_employees_resourceId ON dbo.employees(resourceId);
    CREATE NONCLUSTERED INDEX IX_employees_mobile ON dbo.employees(mobile);
    PRINT '>>> Table [dbo.employees] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.employees] already exists.';
END
GO

-- 2. CITIES TABLE
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
    PRINT '>>> Table [dbo.cities] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.cities] already exists.';
END
GO

-- 3. CENTERS TABLE (Exam Centers linked to Cities)
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
    CREATE NONCLUSTERED INDEX IX_centers_cityId ON dbo.centers(cityId);
    PRINT '>>> Table [dbo.centers] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.centers] already exists.';
END
GO

-- 4. EXAMS TABLE (Exams and Mock Drills)
IF OBJECT_ID('dbo.exams', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.exams (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) NULL,
        type NVARCHAR(20) NOT NULL DEFAULT 'Exam',       -- 'Exam' | 'Mock'
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_exams PRIMARY KEY (id),
        CONSTRAINT UQ_exams_name UNIQUE (name)
    );
    PRINT '>>> Table [dbo.exams] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.exams] already exists.';
END
GO

-- 5. ROLES TABLE (Duty Roles)
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
    PRINT '>>> Table [dbo.roles] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.roles] already exists.';
END
GO

-- 6. SHIFTS TABLE (Work Shifts)
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
    PRINT '>>> Table [dbo.shifts] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.shifts] already exists.';
END
GO

-- 7. ATTENDANCE_FILES TABLE (Uploaded Attendance Proofs)
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
    PRINT '>>> Table [dbo.attendance_files] created successfully.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.attendance_files] already exists.';
END
GO

-- 8. DUTIES TABLE (Primary Duty Assignment and Attendance Ledger)
IF OBJECT_ID('dbo.duties', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.duties (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        employeeId UNIQUEIDENTIFIER NOT NULL,
        dutyDate NVARCHAR(30) NOT NULL,
        cityId UNIQUEIDENTIFIER NOT NULL,
        centerId UNIQUEIDENTIFIER NOT NULL,
        dutyType NVARCHAR(20) NOT NULL DEFAULT 'Exam',   -- 'Exam' | 'Mock'
        examId UNIQUEIDENTIFIER NOT NULL,
        roleId UNIQUEIDENTIFIER NOT NULL,
        shiftId UNIQUEIDENTIFIER NOT NULL,
        reportingTime NVARCHAR(30) NULL,
        shiftEndTime NVARCHAR(30) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Approved' | 'Rejected'
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
        -- Prevent duplicate assignment for same employee on same date, center, and shift:
        CONSTRAINT UQ_duties_duplicate_check UNIQUE (employeeId, dutyDate, centerId, shiftId)
    );
    CREATE NONCLUSTERED INDEX IX_duties_employeeId ON dbo.duties(employeeId);
    CREATE NONCLUSTERED INDEX IX_duties_dutyDate ON dbo.duties(dutyDate);
    CREATE NONCLUSTERED INDEX IX_duties_status ON dbo.duties(status);
    PRINT '>>> Table [dbo.duties] created successfully with relational keys & indexes.';
END
ELSE
BEGIN
    PRINT '>>> Table [dbo.duties] already exists.';
END
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 3: INSERT COMPLETE MASTER SEED DATA
-- -------------------------------------------------------------------------------------------------

-- Seed Cities
DECLARE @CityMysore UNIQUEIDENTIFIER = 'BD4987E8-00C5-43FE-9736-6638C61D9A74';
DECLARE @CityBengaluru UNIQUEIDENTIFIER = '7AEF2C0B-EB85-48B4-8495-FBFBC8CE7055';
DECLARE @CityMangaluru UNIQUEIDENTIFIER = '4E6E1D45-7E93-4B9B-AE5B-3DDF41F8308B';
DECLARE @CityHubballi UNIQUEIDENTIFIER = '4A4D8D56-F549-4EF0-8FD6-34CDFE9C08AA';

IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mysore')
    INSERT INTO dbo.cities (id, name, state) VALUES (@CityMysore, 'Mysore', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Bengaluru')
    INSERT INTO dbo.cities (id, name, state) VALUES (@CityBengaluru, 'Bengaluru', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mangaluru')
    INSERT INTO dbo.cities (id, name, state) VALUES (@CityMangaluru, 'Mangaluru', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Hubballi')
    INSERT INTO dbo.cities (id, name, state) VALUES (@CityHubballi, 'Hubballi', 'Karnataka');

-- Resolve actual city IDs
SELECT @CityMysore = id FROM dbo.cities WHERE name = 'Mysore';
SELECT @CityBengaluru = id FROM dbo.cities WHERE name = 'Bengaluru';
SELECT @CityMangaluru = id FROM dbo.cities WHERE name = 'Mangaluru';

-- Seed Exam Centers
IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8414')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8414', 'iDZ 1 Hebbal Mysore', @CityMysore, 'Hebbal Industrial Area, Mysore');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8413')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8413', 'iDZ 2 Hebbal Mysore', @CityMysore, 'Hebbal Industrial Area, Phase 2, Mysore');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8411')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8411', 'iDZ Electronics City Bengaluru', @CityBengaluru, 'Phase 1, Electronic City, Bengaluru');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '8412')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '8412', 'iDZ Whitefield Bengaluru', @CityBengaluru, 'ITPL Main Road, Whitefield, Bengaluru');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '7701')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '7701', 'PES University Campus Center', @CityBengaluru, '100 Feet Ring Road, BSK 3rd Stage, Bengaluru');

IF NOT EXISTS (SELECT 1 FROM dbo.centers WHERE centerCode = '9142')
    INSERT INTO dbo.centers (id, centerCode, centerName, cityId, address)
    VALUES (NEWID(), '9142', 'TCS iON Digital Zone Mangaluru', @CityMangaluru, 'Kottara Chowki, Mangaluru');

-- Seed Exams & Mock Tests
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'NEET')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'NEET', 'NEET', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'JEE Main')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'JEE Main', 'JEE', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'JEE Main 2026 Session 2')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'JEE Main 2026 Session 2', 'JEE-M-S2', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'UGC NET')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'UGC NET', 'NET', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'TCS')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'TCS', 'TCS', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'IBPS PO Mains 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'IBPS PO Mains 2026', 'IBPS-PO-M', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'SSC CGL Tier 1 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'SSC CGL Tier 1 2026', 'SSC-CGL-26', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'RRB NTPC Phase 1')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'RRB NTPC Phase 1', 'RRB-NTPC-01', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'UPSC NDA 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'UPSC NDA 2026', 'UPSC-NDA', 'Exam');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'AIIMS Mock')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'AIIMS Mock', 'AIIMS', 'Mock');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'GATE Mock')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'GATE Mock', 'GATE', 'Mock');
IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'Mock Drill 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'Mock Drill 2026', 'MOCK-DR-26', 'Mock');

-- Seed Roles (Portal Duty Roles)
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'MOT')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'M OT', 'MOT');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'SO')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'SO', 'SO');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'HOT')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'HOT(IT Manager)', 'HOT');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'CCTV')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'CCTV', 'CCTV');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'ELS_SSC')
    INSERT INTO dbo.roles (id, name, code) VALUES (NEWID(), 'Equity Lab Supervisior_ ssc', 'ELS_SSC');

-- Seed Shifts
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 1')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 1', '07:30 AM', '01:30 PM');
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 2')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 2', '01:00 PM', '06:00 PM');
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 3')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 3', '05:30 PM', '10:00 PM');

-- Seed Admin and Employees
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17655')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '17655', 'Sanjeev Kumar N', '9876543210', 'sanjeev.kumar@examduty.gov.in', 'Bengaluru', 'Active');

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '597299')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '597299', 'IFSHA', '9876543211', 'ifsha@examduty.in', 'Mysore', 'Active');

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '597300')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '597300', 'imsha', '9876543212', 'imsha@examduty.in', 'Mysore', 'Active');

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '52671')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '52671', 'MOHAN H S', '9876543213', 'mohan@examduty.in', 'Bengaluru', 'Active');

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '17656')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '17656', 'Rajesh Sharma', '9876543214', 'rajesh.sharma@examduty.in', 'Bengaluru', 'Active');

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '59253')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '59253', 'sahida', '9876543215', 'sahida@examduty.in', 'Mysore', 'Active');

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE resourceId = '317677')
    INSERT INTO dbo.employees (id, resourceId, name, mobile, email, city, status)
    VALUES (NEWID(), '317677', 'SWAMY', '9876543216', 'swamy@examduty.in', 'Mysore', 'Active');

PRINT '>>> All Master Data & Employees Seeded Successfully.';
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 4: VERIFICATION QUERIES (RUN TO INSPECT ALL TABLES)
-- -------------------------------------------------------------------------------------------------
PRINT '================================================================================';
PRINT 'TABLE RECORD COUNTS:';
PRINT '================================================================================';
SELECT 'employees'        AS [Table], COUNT(*) AS [RecordCount] FROM dbo.employees
UNION ALL
SELECT 'cities'           AS [Table], COUNT(*) AS [RecordCount] FROM dbo.cities
UNION ALL
SELECT 'centers'          AS [Table], COUNT(*) AS [RecordCount] FROM dbo.centers
UNION ALL
SELECT 'exams'            AS [Table], COUNT(*) AS [RecordCount] FROM dbo.exams
UNION ALL
SELECT 'roles'            AS [Table], COUNT(*) AS [RecordCount] FROM dbo.roles
UNION ALL
SELECT 'shifts'           AS [Table], COUNT(*) AS [RecordCount] FROM dbo.shifts
UNION ALL
SELECT 'attendance_files' AS [Table], COUNT(*) AS [RecordCount] FROM dbo.attendance_files
UNION ALL
SELECT 'duties'           AS [Table], COUNT(*) AS [RecordCount] FROM dbo.duties;
GO

-- Query to view all duties in clean, human-readable format (WITHOUT internal UUIDs):
SELECT 
    e.resourceId                            AS [Resource ID],
    e.name                                  AS [Employee Name],
    e.mobile                                AS [Mobile Number],
    d.dutyDate                              AS [Duty Date],
    c.name                                  AS [City],
    cnt.centerName                          AS [Center Name],
    cnt.centerCode                          AS [Center Code],
    d.dutyType                              AS [Duty Type],
    ex.name                                 AS [Exam Name],
    r.name                                  AS [Duty Role],
    s.name                                  AS [Shift],
    ISNULL(d.reportingTime, s.defaultReportingTime) AS [Reporting Time],
    ISNULL(d.shiftEndTime, s.defaultEndTime)        AS [Shift End Time],
    d.status                                AS [Status],
    CASE 
        WHEN d.attendanceFileId IS NOT NULL THEN 'Uploaded'
        ELSE 'Pending Proof'
    END                                     AS [Attendance Proof Status],
    af.originalName                         AS [Proof File Name]
FROM dbo.duties d
INNER JOIN dbo.employees e         ON d.employeeId = e.id
INNER JOIN dbo.cities c            ON d.cityId = c.id
INNER JOIN dbo.centers cnt         ON d.centerId = cnt.id
INNER JOIN dbo.exams ex            ON d.examId = ex.id
INNER JOIN dbo.roles r             ON d.roleId = r.id
INNER JOIN dbo.shifts s            ON d.shiftId = s.id
LEFT JOIN dbo.attendance_files af  ON d.attendanceFileId = af.id
ORDER BY d.dutyDate DESC, e.resourceId ASC;
GO
