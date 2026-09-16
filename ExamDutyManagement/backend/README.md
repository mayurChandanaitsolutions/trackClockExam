# Exam Duty Management System - Backend

Backend API foundation built with **NestJS**, **TypeScript**, **TypeORM**, and **Microsoft SQL Server (MSSQL)**.

---

## Folder Structure

```
ExamDutyManagement/
  backend/
    database/
      scripts/
        01-create-database.sql
    src/
      config/
        database.config.ts
      health/
        health.controller.ts
        health.service.ts
        health.module.ts
      app.module.ts
      main.ts
    .env.example
    .gitignore
    nest-cli.json
    package.json
    README.md
    tsconfig.json
```

---

## Configuration (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure the following variables match your SQL Server setup:

```env
PORT=5000
DB_HOST=localhost
DB_INSTANCE=SQLEXPRESS
DB_NAME=ExamDutyDB
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

---

## Database Setup

Run the SQL script located in `database/scripts/01-create-database.sql` in SQL Server Management Studio (SSMS) or via `sqlcmd` to create `ExamDutyDB`:

```sql
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ExamDutyDB')
BEGIN
    CREATE DATABASE [ExamDutyDB];
END
GO
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Run Development Server
```bash
npm run start:dev
```

---

## Health Check Endpoint

```http
GET http://localhost:5000/api/health
```

Expected Response:
```json
{
  "status": "ok",
  "service": "exam-duty-management-api",
  "database": "connected"
}
```
