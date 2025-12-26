// routes/restaurants.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 * name: Restaurants
 * description: จัดการข้อมูลร้านอาหาร
 */

/**
 * @swagger
 * components:
 * schemas:
 * Restaurant:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * address:
 * type: string
 * phone:
 * type: string
 * menu_details:
 * type: string
 */

/**
 * @swagger
 * /api/restaurants:
 * get:
 * summary: ดูรายชื่อร้านอาหารทั้งหมด
 * tags: [Restaurants]
 * responses:
 * 200:
 * description: สำเร็จ
 * post:
 * summary: เพิ่มร้านอาหารใหม่
 * tags: [Restaurants]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Restaurant'
 * responses:
 * 201:
 * description: สร้างร้านสำเร็จ
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
 * get:
 * summary: ดูข้อมูลร้านอาหารตาม ID
 * tags: [Restaurants]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: พบข้อมูล
 * 404:
 * description: ไม่พบร้านอาหาร
 * put:
 * summary: แก้ไขข้อมูลร้านอาหาร
 * tags: [Restaurants]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Restaurant'
 * responses:
 * 200:
 * description: อัปเดตสำเร็จ
 * delete:
 * summary: ลบร้านอาหาร
 * tags: [Restaurants]
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
 * description: ลบสำเร็จ
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