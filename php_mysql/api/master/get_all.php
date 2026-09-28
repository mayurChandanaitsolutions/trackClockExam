<?php
// ====================================================================================================
// Master Data Endpoint (Cities, Centers, Exams, Roles, Shifts, Employees)
// File: api/master/get_all.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

try {
    // 1. Cities
    $stmt = $pdo->query("SELECT id, name, state FROM cities ORDER BY name ASC");
    $cities = $stmt->fetchAll();

    // 2. Centers
    $stmt = $pdo->query("SELECT id, center_code AS centerCode, center_name AS centerName, city_id AS cityId, address FROM centers ORDER BY center_name ASC");
    $centers = $stmt->fetchAll();

    // 3. Exams
    $stmt = $pdo->query("SELECT id, name, code, type FROM exams ORDER BY name ASC");
    $exams = $stmt->fetchAll();

    // 4. Roles (Strictly: M OT, SO, HOT(IT Manager), CCTV, Equity Lab Supervisior_ ssc)
    $stmt = $pdo->query("SELECT id, name, code FROM roles ORDER BY id ASC");
    $roles = $stmt->fetchAll();

    // 5. Shifts (Strictly Shift 1, Shift 2, Shift 3)
    $stmt = $pdo->query("SELECT id, name, default_reporting_time AS defaultReportingTime, default_end_time AS defaultEndTime FROM shifts ORDER BY id ASC");
    $shifts = $stmt->fetchAll();

    // 6. Employees (Workforce staff excluding Sanjeev Kumar)
    $stmt = $pdo->query("SELECT id, resource_id AS resourceId, name, mobile, email, city, status, is_admin AS isAdmin FROM employees WHERE is_admin = 0 AND resource_id != '17655' AND status = 'Active' ORDER BY name ASC");
    $employees = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => [
            'cities' => $cities,
            'centers' => $centers,
            'exams' => $exams,
            'roles' => $roles,
            'shifts' => $shifts,
            'employees' => $employees
        ]
    ]);
} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Error fetching master data: ' . $e->getMessage()], 500);
}
