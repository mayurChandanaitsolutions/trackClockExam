<?php
// ====================================================================================================
// List Duties Endpoint (with Joins and Filtering)
// File: api/duties/list.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

$resourceId = trim($_GET['resourceId'] ?? $_GET['resource_id'] ?? '');
$employeeId = !empty($_GET['employeeId']) ? (int)$_GET['employeeId'] : 0;
$status = trim($_GET['status'] ?? '');
$date = trim($_GET['date'] ?? '');

$sql = "
    SELECT 
        d.id,
        d.duty_date AS dutyDate,
        d.duty_type AS dutyType,
        d.reporting_time AS reportingTime,
        d.shift_end_time AS shiftEndTime,
        d.status,
        d.created_at AS createdAt,
        e.id AS employeeId,
        e.resource_id AS resourceId,
        e.name AS employeeName,
        e.mobile AS employeeMobile,
        c.id AS cityId,
        c.name AS cityName,
        cnt.id AS centerId,
        cnt.center_code AS centerCode,
        cnt.center_name AS centerName,
        cnt.address AS centerAddress,
        ex.id AS examId,
        ex.name AS examName,
        ex.code AS examCode,
        r.id AS roleId,
        r.name AS roleName,
        s.id AS shiftId,
        s.name AS shiftName,
        af.id AS attendanceFileId,
        af.original_name AS attendanceOriginalName,
        af.file_path AS attendanceFilePath
    FROM duties d
    INNER JOIN employees e ON d.employee_id = e.id
    INNER JOIN cities c ON d.city_id = c.id
    INNER JOIN centers cnt ON d.center_id = cnt.id
    INNER JOIN exams ex ON d.exam_id = ex.id
    INNER JOIN roles r ON d.role_id = r.id
    INNER JOIN shifts s ON d.shift_id = s.id
    LEFT JOIN attendance_files af ON d.attendance_file_id = af.id
    WHERE 1=1
";

$params = [];

if (!empty($resourceId)) {
    $sql .= " AND e.resource_id = :resource_id";
    $params[':resource_id'] = $resourceId;
} elseif ($employeeId > 0) {
    $sql .= " AND d.employee_id = :employee_id";
    $params[':employee_id'] = $employeeId;
}

if (!empty($status)) {
    $sql .= " AND d.status = :status";
    $params[':status'] = $status;
}

if (!empty($date)) {
    $sql .= " AND d.duty_date = :duty_date";
    $params[':duty_date'] = $date;
}

$sql .= " ORDER BY d.duty_date DESC, d.id DESC";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $duties = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'count' => count($duties),
        'data' => $duties
    ]);
} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Error querying duties: ' . $e->getMessage()], 500);
}
