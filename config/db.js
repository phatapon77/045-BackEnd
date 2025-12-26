// config/db.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306, // เพิ่มบรรทัดนี้เพื่อรองรับ Port 3308
  user: process.env.DB_USER,
  password: process.env.DB_PASS,     // แก้ให้ตรงกับ .env (จาก DB_PASSWORD เป็น DB_PASS)
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();