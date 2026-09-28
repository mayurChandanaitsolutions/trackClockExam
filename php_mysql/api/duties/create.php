<?php
// ====================================================================================================
// Create Duty Assignment Endpoint
// File: api/duties/create.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
}

$input = getJsonInput();

$employeeId = !empty($input['employeeId']) ? (int)$input['employeeId'] : 0;
$resourceId = trim($input['resourceId'] ?? '');
$dutyDate = trim($input['dutyDate'] ?? '');
$cityId = !empty($input['cityId']) ? (int)$input['cityId'] : 0;
$centerId = !empty($input['centerId']) ? (int)$input['centerId'] : 0;
$dutyType = in_array(trim($input['dutyType'] ?? ''), ['Exam', 'Mock']) ? trim($input['dutyType']) : 'Exam';
$examId = !empty($input['examId']) ? (int)$input['examId'] : 0;
$roleId = !empty($input['roleId']) ? (int)$input['roleId'] : 0;
$shiftId = !empty($input['shiftId']) ? (int)$input['shiftId'] : 0;
$reportingTime = trim($input['reportingTime'] ?? '');
$shiftEndTime = trim($input['shiftEndTime'] ?? '');
$attendanceFileId = !empty($input['attendanceFileId']) ? (int)$input['attendanceFileId'] : null;

// Resolve employee ID by resourceId if employeeId was not provided directly
if ($employeeId === 0 && !empty($resourceId)) {
    $stmt = $pdo->prepare("SELECT id FROM employees WHERE resource_id = :res_id LIMIT 1");
    $stmt->execute([':res_id' => $resourceId]);
    $empRow = $stmt->fetch();
    if ($empRow) {
        $employeeId = (int)$empRow['id'];
    }
}

// Validation
if ($employeeId === 0 || empty($dutyDate) || $centerId === 0 || $examId === 0 || $roleId === 0 || $shiftId === 0) {
    sendJson(['success' => false, 'message' => 'Please provide all mandatory fields (Employee, Date, Center, Exam, Role, Shift).'], 400);
}

try {
    // 1. Check for Duplicate Duty Assignment
    $checkStmt = $pdo->prepare("
        SELECT id FROM duties 
        WHERE employee_id = :emp_id 
          AND duty_date = :duty_date 
          AND center_id = :center_id 
          AND shift_id = :shift_id 
        LIMIT 1
    ");
    $checkStmt->execute([
        ':emp_id' => $employeeId,
        ':duty_date' => $dutyDate,
        ':center_id' => $centerId,
        ':shift_id' => $shiftId
    ]);

    if ($checkStmt->fetch()) {
        sendJson([
            'success' => false,
            'message' => 'Duty already assigned to this employee for the selected Date, Center, and Shift.'
        ], 409);
    }

    // 2. Insert new Duty record
    $insertStmt = $pdo->prepare("
        INSERT INTO duties (
            employee_id, duty_date, city_id, center_id, duty_type, 
            exam_id, role_id, shift_id, reporting_time, shift_end_time, 
            status, attendance_file_id
        ) VALUES (
            :employee_id, :duty_date, :city_id, :center_id, :duty_type, 
            :exam_id, :role_id, :shift_id, :reporting_time, :shift_end_time, 
            'Pending', :attendance_file_id
        )
    ");

    $insertStmt->execute([
        ':employee_id' => $employeeId,
        ':duty_date' => $dutyDate,
        ':city_id' => $cityId,
        ':center_id' => $centerId,
        ':duty_type' => $dutyType,
        ':exam_id' => $examId,
        ':role_id' => $roleId,
        ':shift_id' => $shiftId,
        ':reporting_time' => $reportingTime,
        ':shift_end_time' => $shiftEndTime,
        ':attendance_file_id' => $attendanceFileId
    ]);

    $dutyId = (int)$pdo->lastInsertId();

    sendJson([
        'success' => true,
        'message' => 'Duty assignment submitted successfully.',
        'dutyId' => $dutyId
    ], 201);

} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Database error creating duty: ' . $e->getMessage()], 500);
}
