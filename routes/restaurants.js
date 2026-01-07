// routes/restaurants.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Restaurants
 *     description: Restaurant endpoints
 *
 * /api/restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     responses:
 *       '200':
 *         description: OK
 *   post:
 *     summary: Create a restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             required: [name]
 *     responses:
 *       '201':
 *         description: Created
 *
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get restaurant by id
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Not Found
 *   put:
 *     summary: Update a restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             required: [name]
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Not Found
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Not Found
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_restaurants');
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', auth, async (req, res) => {
    const { name, address, phone, menu_details } = req.body;
    try {
        const sql = 'INSERT INTO tbl_restaurants (name, address, phone, menu_details) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [name, address, phone, menu_details]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: ดูข้อมูลร้านอาหารตาม ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: พบข้อมูล
 *       '404':
 *         description: ไม่พบร้านอาหาร
 *   put:
 *     summary: แก้ไขข้อมูลร้านอาหาร
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       '200':
 *         description: อัปเดตสำเร็จ
 *   delete:
 *     summary: ลบร้านอาหาร
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: ลบสำเร็จ
 */
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_restaurants WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Restaurant not found');
        res.json(rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.put('/:id', auth, async (req, res) => {
    const { name, address, phone, menu_details } = req.body;
    try {
        const sql = 'UPDATE tbl_restaurants SET name=?, address=?, phone=?, menu_details=? WHERE id=?';
        await db.query(sql, [name, address, phone, menu_details, req.params.id]);
        res.send('Restaurant updated successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM tbl_restaurants WHERE id = ?', [req.params.id]);
        res.send('Restaurant deleted successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;