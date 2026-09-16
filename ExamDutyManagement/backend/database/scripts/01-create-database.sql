-- =============================================
-- Script: 01-create-database.sql
-- Description: Create ExamDutyDB if not exists
-- =============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ExamDutyDB')
BEGIN
    CREATE DATABASE [ExamDutyDB2];
    PRINT 'Database ExamDutyDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database ExamDutyDB already exists.';
END
GO
