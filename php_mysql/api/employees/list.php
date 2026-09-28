<?php
// ====================================================================================================
// List Employees Endpoint
// File: api/employees/list.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            resource_id AS resourceId,
            name,
            mobile,
            email,
            city,
            is_admin AS isAdmin,
            status,
            created_at AS createdAt
        FROM employees
        ORDER BY is_admin DESC, name ASC
    ");
    $employees = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'count' => count($employees),
        'data' => $employees
    ]);
} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Error fetching employees: ' . $e->getMessage()], 500);
}
