-- =================================================================================
-- Exam Duty Management System - Master Data Seed Script
-- Script: 02_insert_master_data.sql
-- Description: Inserts standard Cities, Centers, Exams, Roles, and Shifts
-- Target RDBMS: Microsoft SQL Server (ExamDutyDB2)
-- =================================================================================

USE [ExamDutyDB2];
GO

-- 1. Insert Cities
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mysore')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Mysore', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Bengaluru')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Bengaluru', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mangalore')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Mangalore', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Shivmogga')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Shivmogga', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mandya')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Mandya', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Davanagere')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Davanagere', 'Karnataka');
IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Dharwad')
    INSERT INTO dbo.cities (id, name, state) VALUES (NEWID(), 'Dharwad', 'Karnataka');

PRINT '>>> Master Cities seeded.';
GO

-- 2. Insert Centers
DECLARE @CityBengaluru UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Bengaluru');
DECLARE @CityHyderabad UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Hyderabad');
DECLARE @CityMumbai UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.cities WHERE name = 'Mumbai');

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

PRINT '>>> Master Centers seeded.';
GO

-- 3. Insert Exams
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

IF NOT EXISTS (SELECT 1 FROM dbo.exams WHERE name = 'National Mock Exam 2026')
    INSERT INTO dbo.exams (id, name, code, type) VALUES (NEWID(), 'National Mock Exam 2026', 'NAT-MOCK', 'Mock');

PRINT '>>> Master Exams seeded.';
GO

-- 4. Insert Roles (Matching portal: M OT, SO, HOT, CCTV, Equity Lab Supervisior_ ssc)
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

PRINT '>>> Master Roles seeded (M OT, SO, HOT, CCTV, Equity Lab Supervisior_ ssc).';
GO

-- 5. Insert Shifts
IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 1')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 1', '07:30 AM', '01:30 PM');

IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 2')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 2', '12:30 PM', '06:30 PM');

IF NOT EXISTS (SELECT 1 FROM dbo.shifts WHERE name = 'Shift 3')
    INSERT INTO dbo.shifts (id, name, defaultReportingTime, defaultEndTime)
    VALUES (NEWID(), 'Shift 3', '05:30 PM', '09:30 PM');

PRINT '>>> Master Shifts seeded.';
GO
