require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
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

// ==========================================
//                 ROUTES
// ==========================================

// 1. ดึงรายชื่อร้านค้าทั้งหมด
app.get('/api/restaurants', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_restaurants');
    // ใส่รูป Default ถ้าไม่มี
    const shops = rows.map(shop => ({
      ...shop,
      image: shop.menu_details || 'https://placehold.co/600x400/orange/white?text=' + encodeURIComponent(shop.name)
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
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO tbl_orders (customer_id, restaurant_id, total_amount, order_status, created_at) 
       VALUES (?, ?, ?, 'Pending', NOW())`,
      [customer_id || 1, restaurant_id, total_amount]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        `INSERT INTO tbl_order_items (order_id, menu_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.menu_id, item.qty, item.price]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Order created!', orderId });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// 4. สร้างร้านค้าใหม่ (Admin Only)
app.post('/api/restaurants', async (req, res) => {
  const { name, address, phone, image } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO tbl_restaurants (name, address, phone, menu_details) VALUES (?, ?, ?, ?)`,
      [name, address, phone, image || '']
    );
    res.json({ success: true, id: result.insertId, message: 'Shop created!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. ลบร้านค้า
app.delete('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tbl_restaurants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Shop deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 6. เข้าสู่ระบบ (Login API) - เพิ่มใหม่
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // เช็ค username และ password ใน tbl_customers
    const [users] = await pool.query(
      'SELECT id, username, fullname, status FROM tbl_customers WHERE username = ? AND password = ?', 
      [username, password]
    );

    if (users.length > 0) {
      const user = users[0];
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          role: user.status // ส่งค่า status ไปให้ Frontend ใช้เช็คสิทธิ์
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ส่วนจัดการเมนู (Admin: Menu Management) ---

// 7. เพิ่มเมนูอาหารใหม่
app.post('/api/menus', async (req, res) => {
  const { restaurant_id, menu_name, description, price, category } = req.body;
  try {
    await pool.query(
      `INSERT INTO tbl_menus (restaurant_id, menu_name, description, price, category) 
       VALUES (?, ?, ?, ?, ?)`,
      [restaurant_id, menu_name, description, price, category]
    );
    res.json({ success: true, message: 'Menu added successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. ลบเมนูอาหาร
app.delete('/api/menus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tbl_menus WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ส่วน Dashboard (Admin) ---

// 9. ดึงออเดอร์ทั้งหมด (พร้อมชื่อลูกค้าและชื่อร้าน)
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.id, o.total_amount, o.order_status, o.created_at, 
             r.name as restaurant_name, c.username as customer_name
      FROM tbl_orders o
      LEFT JOIN tbl_restaurants r ON o.restaurant_id = r.id
      LEFT JOIN tbl_customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
//               START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});