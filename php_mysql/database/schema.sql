-- ====================================================================================================
-- PROJECT: EXAM DUTY MANAGEMENT SYSTEM (PHP + MySQL Version)
-- SCRIPT: database/schema.sql
-- DESCRIPTION: Complete MySQL Database Schema, Relational Tables, Constraints, and Master Seed Data
-- TARGET RDBMS: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+ (XAMPP / WAMP / cPanel / Linux)
-- ====================================================================================================

CREATE DATABASE IF NOT EXISTS `exam_duty_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `exam_duty_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------------------------------
-- 1. TABLE: employees (Staff and Administrators)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `resource_id` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL UNIQUE,
    `email` VARCHAR(150) NULL,
    `city` VARCHAR(100) NULL DEFAULT 'Mysore',
    `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `password` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_emp_resource` (`resource_id`),
    INDEX `idx_emp_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 2. TABLE: cities
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `cities`;
CREATE TABLE `cities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `state` VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 3. TABLE: centers (Exam Centers linked to Cities)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `centers`;
CREATE TABLE `centers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `center_code` VARCHAR(50) NOT NULL UNIQUE,
    `center_name` VARCHAR(200) NOT NULL,
    `city_id` INT NOT NULL,
    `address` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_centers_cities` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
    INDEX `idx_centers_city` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 4. TABLE: exams (All 12 Exams and Mock Drills)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `code` VARCHAR(50) NULL,
    `type` ENUM('Exam', 'Mock') NOT NULL DEFAULT 'Exam',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 5. TABLE: roles (Duty Roles)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 6. TABLE: shifts (Work Shifts)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `default_reporting_time` VARCHAR(20) NOT NULL DEFAULT '07:30 AM',
    `default_end_time` VARCHAR(20) NOT NULL DEFAULT '01:30 PM',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 7. TABLE: attendance_files (Attendance Photo Uploads)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance_files`;
CREATE TABLE `attendance_files` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `original_name` VARCHAR(255) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------------------------------
-- 8. TABLE: duties (Primary Duty Assignments & Submissions Ledger)
-- -------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS `duties`;
CREATE TABLE `duties` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `duty_date` DATE NOT NULL,
    `city_id` INT NOT NULL,
    `center_id` INT NOT NULL,
    `duty_type` ENUM('Exam', 'Mock') NOT NULL DEFAULT 'Exam',
    `exam_id` INT NOT NULL,
    `role_id` INT NOT NULL,
    `shift_id` INT NOT NULL,
    `reporting_time` VARCHAR(30) NULL,
    `shift_end_time` VARCHAR(30) NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `attendance_file_id` INT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_duties_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_duties_cities` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
    CONSTRAINT `fk_duties_centers` FOREIGN KEY (`center_id`) REFERENCES `centers` (`id`),
    CONSTRAINT `fk_duties_exams` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`),
    CONSTRAINT `fk_duties_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
    CONSTRAINT `fk_duties_shifts` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`),
    CONSTRAINT `fk_duties_attendance` FOREIGN KEY (`attendance_file_id`) REFERENCES `attendance_files` (`id`) ON DELETE SET NULL,
    -- Prevent duplicate duty on same day, center, and shift for the same employee:
    UNIQUE KEY `uq_emp_date_center_shift` (`employee_id`, `duty_date`, `center_id`, `shift_id`),
    INDEX `idx_duties_emp` (`employee_id`),
    INDEX `idx_duties_date` (`duty_date`),
    INDEX `idx_duties_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------------------------------------------
-- MASTER SEED DATA
-- -------------------------------------------------------------------------------------------------

-- 1. Cities
INSERT INTO `cities` (`id`, `name`, `state`) VALUES
(1, 'Mysore', 'Karnataka'),
(2, 'Bengaluru', 'Karnataka'),
(3, 'Mangaluru', 'Karnataka'),
(4, 'Hubballi', 'Karnataka')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Centers
INSERT INTO `centers` (`id`, `center_code`, `center_name`, `city_id`, `address`) VALUES
(1, '8414', 'iDZ 1 Hebbal Mysore', 1, 'Hebbal Industrial Area, Phase 1, Mysore'),
(2, '8413', 'iDZ 2 Hebbal Mysore', 1, 'Hebbal Industrial Area, Phase 2, Mysore'),
(3, '8411', 'iDZ Electronics City Bengaluru', 2, 'Phase 1, Electronic City, Bengaluru'),
(4, '8412', 'iDZ Whitefield Bengaluru', 2, 'ITPL Main Road, Whitefield, Bengaluru'),
(5, '7701', 'PES University Campus Center', 2, '100 Feet Ring Road, BSK 3rd Stage, Bengaluru'),
(6, '9142', 'TCS iON Digital Zone Mangaluru', 3, 'Kottara Chowki, Mangaluru')
ON DUPLICATE KEY UPDATE `center_name`=VALUES(`center_name`);

-- 3. Exams (All 12 Exams and Mock Drills)
INSERT INTO `exams` (`id`, `name`, `code`, `type`) VALUES
(1, 'NEET', 'NEET', 'Exam'),
(2, 'JEE Main', 'JEE', 'Exam'),
(3, 'JEE Main 2026 Session 2', 'JEE-M-S2', 'Exam'),
(4, 'UGC NET', 'NET', 'Exam'),
(5, 'TCS', 'TCS', 'Exam'),
(6, 'IBPS PO Mains 2026', 'IBPS-PO-M', 'Exam'),
(7, 'SSC CGL Tier 1 2026', 'SSC-CGL-26', 'Exam'),
(8, 'RRB NTPC Phase 1', 'RRB-NTPC-01', 'Exam'),
(9, 'UPSC NDA 2026', 'UPSC-NDA', 'Exam'),
(10, 'AIIMS Mock', 'AIIMS', 'Mock'),
(11, 'GATE Mock', 'GATE', 'Mock'),
(12, 'Mock Drill 2026', 'MOCK-DR-26', 'Mock')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Roles (Exact 5 Authorized Portal Roles)
INSERT INTO `roles` (`id`, `name`, `code`) VALUES
(1, 'M OT', 'MOT'),
(2, 'SO', 'SO'),
(3, 'HOT(IT Manager)', 'HOT'),
(4, 'CCTV', 'CCTV'),
(5, 'Equity Lab Supervisior_ ssc', 'ELS_SSC')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 5. Shifts
INSERT INTO `shifts` (`id`, `name`, `default_reporting_time`, `default_end_time`) VALUES
(1, 'Shift 1', '07:30 AM', '01:30 PM'),
(2, 'Shift 2', '01:00 PM', '06:00 PM'),
(3, 'Shift 3', '05:30 PM', '10:00 PM')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 6. Employees (Admin Sanjeev Kumar + Staff Members)
INSERT INTO `employees` (`id`, `resource_id`, `name`, `mobile`, `email`, `city`, `is_admin`, `status`) VALUES
(1, '17655', 'Sanjeev Kumar N', '9876543210', 'sanjeev.kumar@examduty.gov.in', 'Bengaluru', 1, 'Active'),
(2, '597299', 'IFSHA', '9876543211', 'ifsha@examduty.in', 'Mysore', 0, 'Active'),
(3, '597300', 'imsha', '9876543212', 'imsha@examduty.in', 'Mysore', 0, 'Active'),
(4, '52671', 'MOHAN H S', '9876543213', 'mohan@examduty.in', 'Bengaluru', 0, 'Active'),
(5, '17656', 'Rajesh Sharma', '9876543214', 'rajesh.sharma@examduty.in', 'Bengaluru', 0, 'Active'),
(6, '59253', 'sahida', '9876543215', 'sahida@examduty.in', 'Mysore', 0, 'Active'),
(7, '317677', 'SWAMY', '9876543216', 'swamy@examduty.in', 'Mysore', 0, 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
