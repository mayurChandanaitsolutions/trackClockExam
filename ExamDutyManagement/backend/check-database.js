const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Read .env file directly
const envPath = path.resolve(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        env[key] = val;
      }
    }
  }
}

const config = {
  user: env.DB_USER || 'Imsha1',
  password: env.DB_PASSWORD || 'Sa@123456',
  server: env.DB_HOST || 'localhost',
  database: env.DB_NAME || 'ExamDutyDB2',
  port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : 54337,
  options: {
    encrypt: env.DB_ENCRYPT === 'true',
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
};

async function testConnection() {
  console.log('Testing Database Connection...\n');
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT @@VERSION AS sqlVersion, DB_NAME() AS currentDb');

    console.log('\x1b[32m====================================================\x1b[0m');
    console.log('\x1b[32m✔ DATABASE CONNECTED SUCCESSFULLY\x1b[0m');
    console.log('\x1b[32m====================================================\x1b[0m');
    console.log(`Database Name : ${result.recordset[0].currentDb}`);
    console.log(`Server Host   : ${config.server}:${config.port}`);
    console.log(`Database User : ${config.user}`);
    console.log(`Status        : Connected & Healthy`);
    console.log('\x1b[32m====================================================\x1b[0m\n');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.log('\x1b[31m====================================================\x1b[0m');
    console.log('\x1b[31m✖ DATABASE CONNECTION FAILED\x1b[0m');
    console.log('\x1b[31m====================================================\x1b[0m');
    console.log(`Database Name : ${config.database}`);
    console.log(`Server Host   : ${config.server}:${config.port}`);
    console.log(`Error Message : ${err.message}`);
    console.log('\x1b[31m====================================================\x1b[0m\n');
    process.exit(1);
  }
}

testConnection();
