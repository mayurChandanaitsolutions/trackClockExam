<?php
// ====================================================================================================
// Attendance Proof Upload Endpoint
// File: api/attendance/upload.php
// ====================================================================================================

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    sendJson(['success' => false, 'message' => 'No image file uploaded or upload error occurred.'], 400);
}

$file = $_FILES['file'];
$fileName = $file['name'];
$tmpPath = $file['tmp_name'];
$fileSize = $file['size'];

// Detect MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $tmpPath);
finfo_close($finfo);

// Strict validation: Only images allowed
$allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
if (!in_array(strtolower($mimeType), $allowedMimes)) {
    sendJson([
        'success' => false,
        'message' => 'Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed. Documents or PDFs are strictly disabled.'
    ], 400);
}

// Ensure upload directory exists
$uploadDir = __DIR__ . '/../../uploads/attendance/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'jpg';
$savedFileName = 'attendance_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
$targetPath = $uploadDir . $savedFileName;

if (!move_uploaded_file($tmpPath, $targetPath)) {
    sendJson(['success' => false, 'message' => 'Failed to save uploaded file on server.'], 500);
}

// Relative URL/path for client access
$relativeFilePath = 'uploads/attendance/' . $savedFileName;

try {
    $stmt = $pdo->prepare("
        INSERT INTO attendance_files (original_name, file_name, mime_type, file_size, file_path)
        VALUES (:orig_name, :file_name, :mime_type, :file_size, :file_path)
    ");
    $stmt->execute([
        ':orig_name' => $fileName,
        ':file_name' => $savedFileName,
        ':mime_type' => $mimeType,
        ':file_size' => $fileSize,
        ':file_path' => $relativeFilePath
    ]);

    $fileId = (int)$pdo->lastInsertId();

    sendJson([
        'success' => true,
        'message' => 'Attendance proof uploaded successfully.',
        'file' => [
            'id' => $fileId,
            'originalName' => $fileName,
            'fileName' => $savedFileName,
            'filePath' => $relativeFilePath,
            'size' => $fileSize
        ]
    ]);
} catch (PDOException $e) {
    sendJson(['success' => false, 'message' => 'Database error recording file: ' . $e->getMessage()], 500);
}
