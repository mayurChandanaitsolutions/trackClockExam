-- =================================================================================
-- Exam Duty Management System - Complete SQL Database Setup
-- Script: 01_create_database_and_tables.sql
-- Description: Creates the ExamDutyDB2 database and all 8 relational tables
-- Target RDBMS: Microsoft SQL Server (MSSQL 2016+ / SQL Server Express)
-- =================================================================================

-- 1. Create Database if it does not exist
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

-- =================================================================================
-- 2. Drop existing tables if re-running (safe foreign key order)
-- =================================================================================
-- Uncomment below if you want a complete clean reset:
/*
IF OBJECT_ID('dbo.duties', 'U') IS NOT NULL DROP TABLE dbo.duties;
IF OBJECT_ID('dbo.attendance_files', 'U') IS NOT NULL DROP TABLE dbo.attendance_files;
IF OBJECT_ID('dbo.centers', 'U') IS NOT NULL DROP TABLE dbo.centers;
IF OBJECT_ID('dbo.cities', 'U') IS NOT NULL DROP TABLE dbo.cities;
IF OBJECT_ID('dbo.exams', 'U') IS NOT NULL DROP TABLE dbo.exams;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;
IF OBJECT_ID('dbo.shifts', 'U') IS NOT NULL DROP TABLE dbo.shifts;
IF OBJECT_ID('dbo.employees', 'U') IS NOT NULL DROP TABLE dbo.employees;
*/

-- =================================================================================
-- 3. Table: employees
-- =================================================================================
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
    PRINT '>>> Table [employees] created successfully.';
END
GO

-- =================================================================================
-- 4. Table: cities
-- =================================================================================
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
    PRINT '>>> Table [cities] created successfully.';
END
GO

-- =================================================================================
-- 5. Table: centers
-- =================================================================================
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
    PRINT '>>> Table [centers] created successfully.';
END
GO

-- =================================================================================
-- 6. Table: exams
-- =================================================================================
IF OBJECT_ID('dbo.exams', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.exams (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) NULL,
        type NVARCHAR(20) NOT NULL DEFAULT 'Exam', -- 'Exam' | 'Mock'
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_exams PRIMARY KEY (id),
        CONSTRAINT UQ_exams_name UNIQUE (name)
    );
    PRINT '>>> Table [exams] created successfully.';
END
GO

-- =================================================================================
-- 7. Table: roles
-- =================================================================================
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
    PRINT '>>> Table [roles] created successfully.';
END
GO

-- =================================================================================
-- 8. Table: shifts
-- =================================================================================
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
    PRINT '>>> Table [shifts] created successfully.';
END
GO

-- =================================================================================
-- 9. Table: attendance_files
-- =================================================================================
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
    PRINT '>>> Table [attendance_files] created successfully.';
END
GO

-- =================================================================================
-- 10. Table: duties
-- =================================================================================
IF OBJECT_ID('dbo.duties', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.duties (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        employeeId UNIQUEIDENTIFIER NOT NULL,
        dutyDate NVARCHAR(30) NOT NULL,
        cityId UNIQUEIDENTIFIER NOT NULL,
        centerId UNIQUEIDENTIFIER NOT NULL,
        dutyType NVARCHAR(20) NOT NULL DEFAULT 'Exam', -- 'Exam' | 'Mock'
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
        CONSTRAINT UQ_duties_duplicate_check UNIQUE (employeeId, dutyDate, centerId, shiftId)
    );
    PRINT '>>> Table [duties] created successfully with duplicate duty prevention constraint.';
END
GO
