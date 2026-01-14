require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,  // <--- ต้องใช้ชื่อ DB_PASS ให้ตรงกับใน .env
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Connection
pool.getConnection()
  .then(conn => {
    console.log("✅ Database connected successfully!");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

// --- ROUTES ---

// 1. ดึงรายชื่อร้านค้าทั้งหมด
app.get('/api/restaurants', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_restaurants');
    // แปลงข้อมูลให้มี field 'image' ถ้าใน DB ไม่มี (เพื่อให้ Frontend ไม่พัง)
    const shops = rows.map(shop => ({
      ...shop,
      image: 'https://placehold.co/600x400/orange/white?text=' + encodeURIComponent(shop.name)
    }));
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. ดึงเมนูตาม Shop ID
app.get('/api/menus', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_menus WHERE restaurant_id = ?', [restaurant_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. สั่งอาหาร (Create Order) - ใช้ Transaction
app.post('/api/orders', async (req, res) => {
  const { customer_id, restaurant_id, total_amount, items } = req.body;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction(); // เริ่ม Transaction

    // 3.1 สร้างหัวบิล (Order)
    const [orderResult] = await connection.query(
      `INSERT INTO tbl_orders (customer_id, restaurant_id, total_amount, order_status, created_at) 
       VALUES (?, ?, ?, 'Pending', NOW())`,
      [customer_id || 1, restaurant_id, total_amount]
    );
    
    const orderId = orderResult.insertId;

    // 3.2 วนลูปสร้างรายการอาหาร (Order Items)
    for (const item of items) {
      await connection.query(
        `INSERT INTO tbl_order_items (order_id, menu_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.menu_id, item.qty, item.price]
      );
    }

    await connection.commit(); // บันทึกข้อมูลจริง
    res.json({ success: true, message: 'Order created!', orderId });

  } catch (error) {
    await connection.rollback(); // ย้อนกลับถ้ามี Error
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});