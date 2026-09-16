# Microsoft SQL Server (MSSQL) Database Setup Guide

All database queries and scripts are stored in this folder:
`ExamDutyManagement/database_queries/`

---

## Quick 1-Step Setup (Recommended)

To set up everything in one go:

1. Open **SQL Server Management Studio (SSMS)** or Azure Data Studio.
2. Connect to your SQL Server instance (e.g. `localhost\SQLEXPRESS` or port `54337`).
3. Open or copy the contents of:
   👉 **`04_all_in_one_run_me.sql`**
4. Click **Execute** (or press **F5**).
5. Done! The database `ExamDutyDB2`, all 8 tables, master seed data (Cities, Centers, Exams, Roles, Shifts), and employees (including Sanjeev Kumar N - `17655`) will be created and populated.

---

## File Structure & Contents

| File Name | Purpose |
| :--- | :--- |
| **`04_all_in_one_run_me.sql`** | **Master Script**: Runs everything at once (DB, tables, constraints, master data, seed employees, seed duties). |
| **`01_create_database_and_tables.sql`** | Creates `ExamDutyDB2` database and all 8 relational tables with constraints (`employees`, `cities`, `centers`, `exams`, `roles`, `shifts`, `attendance_files`, `duties`). |
| **`02_insert_master_data.sql`** | Inserts all master dropdown data (Bengaluru, Mysuru, TCS iON Centers, SSC CGL, RRB NTPC, Roles, Shifts). |
| **`03_insert_employees_and_duties.sql`** | Seeds the primary test employees (`17655`, `17656`, `17657`) and baseline duties. |
| **`05_how_to_add_new_employee_and_duty.sql`** | **Template for adding any new employee & assigning duties** in MSSQL. Any employee inserted here can log in immediately and all data is fetched live from the backend with zero hardcoding! |

---

## How to Test Adding a New Employee in MSSQL

1. Open `05_how_to_add_new_employee_and_duty.sql`.
2. Change the Resource ID (e.g. `18999`) and Mobile Number (e.g. `9123456780`).
3. Press **Execute (F5)** in SSMS.
4. Now open the web application at `http://localhost:3000`:
   - Enter Resource ID: `18999`
   - Enter Mobile Number: `9123456780`
   - Click **LOGIN**.
   - The dashboard will load the new employee's name, assigned duties, and real-time statistics fetched directly from MSSQL!
