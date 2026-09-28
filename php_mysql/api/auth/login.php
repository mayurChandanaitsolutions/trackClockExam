<?php
// ====================================================================================================
// Authentication Endpoint
// File: api/auth/login.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
}

$input = getJsonInput();
$mobile = trim($input['mobile'] ?? '');
$resourceId = trim($input['resourceId'] ?? $input['resource_id'] ?? '');

if (empty($mobile) || empty($resourceId)) {
    sendJson(['success' => false, 'message' => 'Please provide both Mobile Number and Resource ID.'], 400);
}

try {
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE mobile = :mobile AND resource_id = :resource_id LIMIT 1");
    $stmt->execute([
        ':mobile' => $mobile,
        ':resource_id' => $resourceId
    ]);
    $employee = $stmt->fetch();

    if (!$employee) {
        sendJson([
            'success' => false,
            'message' => 'Invalid credentials. Please verify your Mobile Number and Resource ID.'
        ], 401);
    }

    if ($employee['status'] !== 'Active') {
        sendJson([
            'success' => false,
            'message' => 'Your account is currently inactive. Please contact the administrator.'
        ], 403);
    }

    $isAdmin = (bool)($employee['is_admin'] == 1 || $employee['resource_id'] === '17655');

    sendJson([
        'success' => true,
        'message' => 'Login successful.',
        'user' => [
            'id' => (int)$employee['id'],
            'resourceId' => $employee['resource_id'],
            'name' => $employee['name'],
            'mobile' => $employee['mobile'],
            'email' => $employee['email'],
            'city' => $employee['city'],
            'isAdmin' => $isAdmin,
            'role' => $isAdmin ? 'admin' : 'employee'
        ]
    ]);
} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Database query error: ' . $e->getMessage()], 500);
}
