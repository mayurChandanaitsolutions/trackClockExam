# Exam Duty Management System (PHP + MySQL Version)

A full-stack, standalone Exam Duty Management System built with **HTML5, Vanilla CSS3, JavaScript, AJAX, PHP, and MySQL**.

---

## 🌟 Technology Stack
- **Frontend:** Pure HTML5, Vanilla CSS3, JavaScript (ES6+), and AJAX (`fetch`)
- **Backend:** PHP (PDO MySQL REST API)
- **Database:** MySQL 5.7+ / 8.0+ / MariaDB
- **Hardware Integrations:** HTML5 Webcam / Mobile Camera capture (`navigator.mediaDevices.getUserMedia`)
- **Zero build steps:** No Node.js, npm, or TypeScript required! Runs natively in XAMPP, WAMP, or Apache.

---

## 📁 Directory Structure
```
php_mysql/
├── index.html                   # Login Page (Admin & Staff)
├── dashboard.html               # Main Dashboard with metrics & recent duties
├── add-duty.html                # Add/Assign Duty with Live Camera & File Upload
├── my-duties.html               # Duty roster, status badges, & Admin approvals
├── add-employee.html            # Register new workforce members
├── css/
│   └── style.css                # Modern responsive UI & camera viewfinder styles
├── js/
│   ├── app.js                   # Authentication state, session, & navigation
│   └── camera.js                # Live webcam capture & AJAX upload manager
├── api/
│   ├── config/
│   │   └── db.php               # PDO MySQL database connection
│   ├── auth/
│   │   └── login.php            # Login verification endpoint
│   ├── master/
│   │   └── get_all.php          # Dropdown data (cities, centers, exams, roles, shifts)
│   ├── duties/
│   │   ├── create.php           # Create duty with duplicate check
│   │   ├── list.php             # Get duties with joins and filters
│   │   └── update_status.php    # Approve/Reject duty endpoint
│   ├── employees/
│   │   ├── create.php           # Employee registration
│   │   └── list.php             # List employees
│   └── attendance/
│       └── upload.php           # Attendance photo upload (images only)
├── uploads/
│   └── attendance/              # Saved attendance proof images
└── database/
    └── schema.sql               # Complete MySQL schema & master seed data
```

---

## 🚀 Quick Setup Instructions (XAMPP / WAMP)

### Step 1: Copy to Web Root
Copy the `php_mysql` folder into your web server root:
- **XAMPP:** `C:\xampp\htdocs\php_mysql`
- **WAMP:** `C:\wamp64\www\php_mysql`

### Step 2: Import the Database
1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open your browser and go to: `http://localhost/phpmyadmin`
3. Click on the **Import** tab.
4. Select `php_mysql/database/schema.sql` and click **Import** (or create database `exam_duty_db` and run the script).

### Step 3: Run the Application
Open your browser and visit:
👉 **`http://localhost/php_mysql/index.html`**

---

## 🔑 Default Login Credentials

| User Type | Name | Mobile Number | Resource ID | Role |
|---|---|---|---|---|
| **Admin** | Sanjeev Kumar N | `9876543210` | `17655` | System Administrator |
| **Employee** | IFSHA | `9876543211` | `597299` | Staff / Observer |
| **Employee** | imsha | `9876543212` | `597300` | Staff / Observer |
| **Employee** | MOHAN H S | `9876543213` | `52671` | Staff / Observer |

---

## ✨ Features Included
1. **Direct Live Camera Capture:**
   - Opens user webcam / phone camera with visual alignment frame.
   - Captures instant snapshot onto HTML5 canvas and uploads via AJAX.
   - Dual buttons: **Take Photo (Camera)** and **Upload Photo (Files)**.
   - Strict image-only validation (JPG, JPEG, PNG, WEBP).
2. **Authorized Duty Roles:**
   - Strictly supports: `M OT`, `SO`, `HOT(IT Manager)`, `CCTV`, and `Equity Lab Supervisior_ ssc`.
3. **12 Master Exams & Mocks:**
   - NEET, JEE Main, JEE Main 2026 Session 2, UGC NET, TCS, IBPS PO Mains 2026, SSC CGL Tier 1 2026, RRB NTPC Phase 1, UPSC NDA 2026, AIIMS Mock, GATE Mock, Mock Drill 2026.
4. **Duplicate Duty Prevention:**
   - Prevents duplicate assignments for the same employee, duty date, center, and shift.
5. **Admin Approval Workflow:**
   - Admin can approve or reject duties with a single click via AJAX without reloading the page.
