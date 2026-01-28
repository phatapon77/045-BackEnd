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

// 🔥 ระบบ Auto-Fix Database (ทำงานอัตโนมัติเมื่อเริ่ม Server)
// ช่วยสร้างคอลัมน์ description ถ้ายังไม่มี (แก้ Error 500)
async function autoFixDatabase() {
    const conn = await pool.getConnection();
    try {
        console.log("🔧 กำลังตรวจสอบและซ่อมแซมฐานข้อมูล...");
        
        // ลองเพิ่มคอลัมน์ description
        try {
            await conn.query(`ALTER TABLE tbl_menus ADD COLUMN description TEXT`);
            console.log("✅ เพิ่มช่อง 'description' สำเร็จ! (พร้อมบันทึกแล้ว)");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') console.log("👌 ฐานข้อมูลปกติ (มีช่อง description แล้ว)");
        }

    } catch (error) {
        console.error("⚠️ การซ่อมแซมอัตโนมัติมีปัญหา:", error.message);
    } finally {
        conn.release();
    }
}
autoFixDatabase(); // เรียกทำงานทันที

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

// --- ปุ่มลับกู้คืนเมนู (Magic Fix) ---
app.get('/api/magic-fix-menus', async (req, res) => {
    try {
        await pool.query('DELETE FROM tbl_menus WHERE restaurant_id = 1');
        const sql = `INSERT INTO tbl_menus (restaurant_id, name, price, category, image, description) VALUES ?`;
        const values = [
            [1, 'Khao Soi Kai Special (Chicken Leg)', 129.00, 'Main Course', '', 'ข้าวซอยไก่สูตรเข้มข้น น่องไก่ชิ้นโต ตุ๋นจนเปื่อย'],
            [1, 'Sai Ua (Northern Herbal Sausage)', 150.00, 'Appetizer', '', 'ไส้อั่วสมุนไพร สูตรคุณยาย หอมกลิ่นเครื่องเทศ'],
            [1, 'Nam Prik Ong Set (Dip with Veg)', 90.00, 'Main Course', '', 'ชุดน้ำพริกอ่อง เสิร์ฟพร้อมผักสดตามฤดูกาล'],
            [1, 'Traditional Khao Soi Kai', 80.00, 'Main Course', '', 'ข้าวซอยไก่ดั้งเดิม รสชาติต้นตำรับเชียงใหม่'],
            [1, 'Hang Lay Curry (Pork Belly)', 120.00, 'Curry', '', 'แกงฮังเลหมูสามชั้น เคี่ยวจนนุ่ม ละลายในปาก'],
            [1, 'Khanom Jeen Nam Ngiao', 60.00, 'Noodles', '', 'ขนมจีนน้ำเงี้ยว กระดูกหมูอ่อน เลือดไก่นุ่มๆ'],
            [1, 'Sticky Rice', 15.00, 'Side Dish', '', 'ข้าวเหนียวเขี้ยวงู นุ่ม หอม'],
            [1, 'Chrysanthemum Tea', 25.00, 'Beverage', '', 'น้ำเก๊กฮวยเย็น ชื่นใจ แก้กระหาย']
        ];
        await pool.query(sql, [values]);
        res.send("<h1>🎉 กู้คืนเมนูเรียบร้อยแล้ว!</h1><p>กลับไปที่หน้า Admin แล้วกดรีเฟรชได้เลยครับ</p>");
    } catch (error) {
        res.status(500).send("เกิดข้อผิดพลาด: " + error.message);
    }
});

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

// 6. ดึงเมนูตามร้าน
app.get('/api/menus', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_menus WHERE restaurant_id = ?', [restaurant_id]);
    
    // แปลงข้อมูลให้หน้าเว็บใช้งานง่าย
    const menus = rows.map(menu => ({
      ...menu,
      menu_name: menu.name,
      title: menu.name      
    }));

    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 7. เพิ่มเมนู (อัปเดตใหม่: บันทึก description ด้วย)
app.post('/api/menus', async (req, res) => {
  const { restaurant_id, menu_name, description, price, category, image } = req.body; 
  try {
    await pool.query(
      `INSERT INTO tbl_menus (restaurant_id, name, price, category, image, description) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [restaurant_id, menu_name, price, category, image || '', description || '']
    );
    res.json({ success: true, message: 'Menu added successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 7.5 แก้ไขเมนู (PUT) - เพิ่มใหม่สำหรับหน้าแก้ไข
app.put('/api/menus/:id', async (req, res) => {
    const { menu_name, price, category, image, description } = req.body;
    const { id } = req.params;
    try {
        await pool.query(
            `UPDATE tbl_menus SET name=?, price=?, category=?, image=?, description=? WHERE id=?`,
            [menu_name, price, category, image, description, id]
        );
        res.json({ success: true, message: 'Menu updated successfully!' });
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

// 12. อัปเดตสถานะออเดอร์
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE tbl_orders SET order_status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Updated order status successfully' });
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