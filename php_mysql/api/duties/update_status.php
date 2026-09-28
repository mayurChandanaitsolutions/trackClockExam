<?php
// ====================================================================================================
// Update Duty Status Endpoint (Approve / Reject)
// File: api/duties/update_status.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
}

$input = getJsonInput();
$dutyId = !empty($input['dutyId']) ? (int)$input['dutyId'] : 0;
$status = trim($input['status'] ?? '');

if ($dutyId === 0 || !in_array($status, ['Approved', 'Rejected', 'Pending'])) {
    sendJson(['success' => false, 'message' => 'Valid Duty ID and Status (Approved/Rejected/Pending) are required.'], 400);
}

try {
    $stmt = $pdo->prepare("UPDATE duties SET status = :status WHERE id = :id");
    $stmt->execute([
        ':status' => $status,
        ':id' => $dutyId
    ]);

    if ($stmt->rowCount() === 0) {
        sendJson(['success' => false, 'message' => 'Duty record not found or status already set.'], 404);
    }

    sendJson([
        'success' => true,
        'message' => "Duty status successfully updated to {$status}."
    ]);
} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Error updating status: ' . $e->getMessage()], 500);
}
