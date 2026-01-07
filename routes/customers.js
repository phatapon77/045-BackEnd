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
 *   - name: Customers
 *     description: Customer related endpoints
 *
 * /api/customers/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required: [username, password]
 *     responses:
 *       '201':
 *         description: Customer created
 *
 * /api/customers/login:
 *   post:
 *     summary: Login a customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required: [username, password]
 *     responses:
 *       '200':
 *         description: Logged in
 *
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     responses:
 *       '200':
 *         description: OK
 *
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by id
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
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

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, fullname, address, phone, email FROM tbl_customers');
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

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