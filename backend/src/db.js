const mysql = require("mysql2/promise");
require("dotenv").config();

const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
    }
  : {
      host:     process.env.DB_HOST || "localhost",
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "hotel_db",
      ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
    };

const pool = mysql.createPool(poolConfig);

pool.getConnection()
  .then(conn => { console.log("✅ MySQL connected!"); conn.release(); })
  .catch(err => {
    console.error("❌ MySQL FAILED:", err.message);
    console.error("👉 Check database connection parameters or run FIX-MySQL-Password.bat");
  });

module.exports = pool;
