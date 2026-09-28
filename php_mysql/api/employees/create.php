<?php
// ====================================================================================================
// Register Employee Endpoint
// File: api/employees/create.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
}

$input = getJsonInput();

$resourceId = trim($input['resourceId'] ?? $input['resource_id'] ?? '');
$name = trim($input['name'] ?? '');
$mobile = trim($input['mobile'] ?? '');
$email = trim($input['email'] ?? '');
$city = trim($input['city'] ?? 'Mysore');

if (empty($resourceId) || empty($name) || empty($mobile)) {
    sendJson(['success' => false, 'message' => 'Resource ID, Employee Name, and Mobile Number are required.'], 400);
}

if (!preg_match('/^[6-9]\d{9}$/', $mobile)) {
    sendJson(['success' => false, 'message' => 'Mobile number must be a valid 10-digit number.'], 400);
}

try {
    // Check if Resource ID or Mobile already exists
    $check = $pdo->prepare("SELECT id FROM employees WHERE resource_id = :res_id OR mobile = :mobile LIMIT 1");
    $check->execute([':res_id' => $resourceId, ':mobile' => $mobile]);
    if ($check->fetch()) {
        sendJson(['success' => false, 'message' => 'An employee with this Resource ID or Mobile Number already exists.'], 409);
    }

    $stmt = $pdo->prepare("
        INSERT INTO employees (resource_id, name, mobile, email, city, is_admin, status)
        VALUES (:resource_id, :name, :mobile, :email, :city, 0, 'Active')
    ");
    $stmt->execute([
        ':resource_id' => $resourceId,
        ':name' => $name,
        ':mobile' => $mobile,
        ':email' => $email ?: null,
        ':city' => $city
    ]);

    $newId = (int)$pdo->lastInsertId();

    sendJson([
        'success' => true,
        'message' => 'Employee successfully registered.',
        'employee' => [
            'id' => $newId,
            'resourceId' => $resourceId,
            'name' => $name,
            'mobile' => $mobile,
            'email' => $email,
            'city' => $city
        ]
    ], 201);

} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Database error registering employee: ' . $e->getMessage()], 500);
}
