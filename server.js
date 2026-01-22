require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. เชื่อมต่อฐานข้อมูล
// ==========================================
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

pool.getConnection()
  .then(conn => {
    console.log("✅ Database connected successfully!");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

// ==========================================
// 2. ตั้งค่าระบบอัปโหลดรูปภาพ (Multer)
// ==========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'image-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 3. ROUTES (API)
// ==========================================

// --- Upload Image ---
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'กรุณาเลือกไฟล์รูปภาพ' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// --- Restaurants ---

// 1. ดึงร้านค้าทั้งหมด
app.get('/api/restaurants', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_restaurants');
    const shops = rows.map(shop => ({
      ...shop,
      // ✅ ใช้ shop.image ตรงๆ
      image: shop.image || 'https://placehold.co/600x400/orange/white?text=' + encodeURIComponent(shop.name)
    }));
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5 ดึงข้อมูลร้านค้าตาม ID
app.get('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_restaurants WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      const shop = rows[0];
      shop.image = shop.image || 'https://placehold.co/600x400/orange/white?text=' + encodeURIComponent(shop.name);
      res.json([shop]);
    } else {
      res.status(404).json({ error: 'Shop not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. สร้างร้านค้าใหม่
app.post('/api/restaurants', async (req, res) => {
  const { name, address, phone, image } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO tbl_restaurants (name, address, phone, image) VALUES (?, ?, ?, ?)`,
      [name, address, phone, image || '']
    );
    res.json({ success: true, id: result.insertId, message: 'Shop created!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. แก้ไขข้อมูลร้านค้า
app.put('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, image } = req.body;
  try {
    await pool.query(
      'UPDATE tbl_restaurants SET name = ?, address = ?, phone = ?, image = ? WHERE id = ?',
      [name, address, phone, image, id]
    );
    res.json({ success: true, message: 'Shop updated successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 4. ลบร้านค้า
app.delete('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tbl_restaurants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Shop deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. อัปเดตสถานะร้าน
app.put('/api/restaurants/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 
  try {
    await pool.query(
      'UPDATE tbl_restaurants SET status = ? WHERE id = ?',
      [status, id]
    );
    res.json({ success: true, message: 'Updated status successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Menus ---

// 6. ดึงเมนูตามร้าน (✅ แก้ไขจุดนี้ให้ชื่อเมนูขึ้น)
app.get('/api/menus', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_menus WHERE restaurant_id = ?', [restaurant_id]);
    
    // ✅ เพิ่มการแปลงข้อมูล: สร้าง menu_name ให้หน้าเว็บใช้งานได้
    const menus = rows.map(menu => ({
      ...menu,
      menu_name: menu.name, // ตัวนี้สำคัญ! หน้าเว็บรอดึงตัวนี้
      title: menu.name      
    }));

    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. เพิ่มเมนู
app.post('/api/menus', async (req, res) => {
  const { restaurant_id, menu_name, description, price, category, image } = req.body; 
  try {
    await pool.query(
      `INSERT INTO tbl_menus (restaurant_id, name, price, category, image) 
       VALUES (?, ?, ?, ?, ?)`,
      [restaurant_id, menu_name, price, category, image || '']
    );
    res.json({ success: true, message: 'Menu added successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 8. ลบเมนู
app.delete('/api/menus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tbl_menus WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Orders & Users ---

// 9. สั่งอาหาร
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

// 10. ดึงออเดอร์ (Dashboard)
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

// 11. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
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
          role: user.status 
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Login failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Start Server
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});