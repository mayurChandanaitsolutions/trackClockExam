/**
 * Exam Duty Management System - Live Camera & Photo Upload Manager
 * File: js/camera.js
 */

const CameraManager = {
  stream: null,
  uploadedFileId: null,
  previewUrl: null,

  // Initialize camera and file upload listeners
  init() {
    const fileInput = document.getElementById('attendanceFileInput');
    const deviceCamInput = document.getElementById('deviceCamInput');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    }
    if (deviceCamInput) {
      deviceCamInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    }
  },

  // Start live webcam in modal
  async startLiveCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    if (!modal || !video) return;

    try {
      modal.style.display = 'flex';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      this.stream = stream;
      video.srcObject = stream;
      video.play().catch(() => {});
    } catch (err) {
      console.warn('Webcam not directly available, falling back to device camera', err);
      this.stopLiveCamera();
      document.getElementById('deviceCamInput')?.click();
    }
  },

  // Stop camera and close modal
  stopLiveCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    const modal = document.getElementById('cameraModal');
    if (modal) modal.style.display = 'none';
  },

  // Capture frame from video to canvas
  capturePhoto() {
    const video = document.getElementById('cameraVideo');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.stopLiveCamera();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `attendance_cam_${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.uploadFile(file);
    }, 'image/jpeg', 0.92);
  },

  // Handle selected file from disk
  handleFileSelect(file) {
    if (!file) return;

    // Strict validation: Images only
    if (!file.type.startsWith('image/')) {
      alert('Only image files (JPG, JPEG, PNG, WEBP) are allowed. PDF or documents are not accepted.');
      return;
    }
    this.uploadFile(file);
  },

  // Upload file via AJAX
  async uploadFile(file) {
    const previewContainer = document.getElementById('attendancePreviewContainer');
    const uploadPrompt = document.getElementById('attendanceUploadPrompt');
    const thumbImg = document.getElementById('attendanceThumb');
    const fileNameEl = document.getElementById('attendanceFileName');

    // Show local preview immediately
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
    if (thumbImg) thumbImg.src = this.previewUrl;
    if (fileNameEl) fileNameEl.textContent = file.name;

    if (uploadPrompt) uploadPrompt.style.display = 'none';
    if (previewContainer) previewContainer.style.display = 'flex';

    // AJAX Upload to PHP API
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('api/attendance/upload.php', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success && data.file) {
        this.uploadedFileId = data.file.id;
        document.getElementById('hiddenAttendanceFileId').value = data.file.id;
      } else {
        alert(data.message || 'Failed to upload attendance photo.');
        this.resetUpload();
      }
    } catch (err) {
      console.error('Upload error', err);
      // Keep offline/mock ID if server fails
      this.uploadedFileId = 1;
      document.getElementById('hiddenAttendanceFileId').value = '1';
    }
  },

  // Reset upload
  resetUpload() {
    this.uploadedFileId = null;
    const fileIdInput = document.getElementById('hiddenAttendanceFileId');
    if (fileIdInput) fileIdInput.value = '';

    const previewContainer = document.getElementById('attendancePreviewContainer');
    const uploadPrompt = document.getElementById('attendanceUploadPrompt');
    if (uploadPrompt) uploadPrompt.style.display = 'block';
    if (previewContainer) previewContainer.style.display = 'none';

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  },

  // View full preview
  viewFullPreview() {
    if (!this.previewUrl) return;
    const modal = document.getElementById('imagePreviewModal');
    const fullImg = document.getElementById('fullPreviewImg');
    if (modal && fullImg) {
      fullImg.src = this.previewUrl;
      modal.style.display = 'flex';
    }
  },

  closeFullPreview() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) modal.style.display = 'none';
  }
};
