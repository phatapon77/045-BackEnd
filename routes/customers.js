// routes/customers.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 * name: Customers
 * description: API สำหรับจัดการข้อมูลลูกค้าและการเข้าสู่ระบบ
 */

/**
 * @swagger
 * components:
 * schemas:
 * CustomerRegister:
 * type: object
 * required:
 * - username
 * - password
 * - fullname
 * properties:
 * username:
 * type: string
 * password:
 * type: string
 * fullname:
 * type: string
 * address:
 * type: string
 * phone:
 * type: string
 * email:
 * type: string
 * LoginRequest:
 * type: object
 * required:
 * - username
 * - password
 * properties:
 * username:
 * type: string
 * password:
 * type: string
 */

/**
 * @swagger
 * /api/customers/register:
 * post:
 * summary: ลงทะเบียนลูกค้าใหม่ (Register)
 * tags: [Customers]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CustomerRegister'
 * responses:
 * 201:
 * description: สร้างบัญชีสำเร็จ
 * 400:
 * description: Username ซ้ำ
 * 500:
 * description: Server Error
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullname, address, phone, email } = req.body;
    const [existing] = await db.query('SELECT * FROM tbl_customers WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).send('Username already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql = 'INSERT INTO tbl_customers (username, password, fullname, address, phone, email) VALUES (?, ?, ?, ?, ?, ?)';
    await db.query(sql, [username, hashedPassword, fullname, address, phone, email]);

    res.status(201).send('User registered successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /api/customers/login:
 * post:
 * summary: เข้าสู่ระบบ (Login)
 * tags: [Customers]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/LoginRequest'
 * responses:
 * 200:
 * description: ล็อกอินสำเร็จ (คืนค่า Token)
 * 400:
 * description: รหัสผ่านผิด
 * 404:
 * description: ไม่พบผู้ใช้งาน
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await db.query('SELECT * FROM tbl_customers WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).send('User not found');
    
    const user = users[0];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, fullname: user.fullname } });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /api/customers:
 * get:
 * summary: ดึงข้อมูลลูกค้าทั้งหมด (ต้องใช้ Token)
 * tags: [Customers]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: รายชื่อลูกค้าทั้งหมด
 * 401:
 * description: ไม่ได้รับอนุญาต (Token ไม่ถูกต้อง)
 */
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, fullname, address, phone, email FROM tbl_customers');
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 * get:
 * summary: ดึงข้อมูลลูกค้าตาม ID
 * tags: [Customers]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ไอดีลูกค้า
 * responses:
 * 200:
 * description: ข้อมูลลูกค้า
 * 404:
 * description: ไม่พบข้อมูล
 * put:
 * summary: แก้ไขข้อมูลลูกค้า
 * tags: [Customers]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * fullname:
 * type: string
 * address:
 * type: string
 * phone:
 * type: string
 * email:
 * type: string
 * responses:
 * 200:
 * description: อัปเดตข้อมูลสำเร็จ
 * delete:
 * summary: ลบข้อมูลลูกค้า
 * tags: [Customers]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: ลบข้อมูลสำเร็จ
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, fullname, address, phone, email FROM tbl_customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Customer not found');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { fullname, address, phone, email } = req.body;
    await db.query('UPDATE tbl_customers SET fullname=?, address=?, phone=?, email=? WHERE id=?', 
      [fullname, address, phone, email, req.params.id]);
    res.send('Customer updated');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM tbl_customers WHERE id = ?', [req.params.id]);
    res.send('Customer deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;