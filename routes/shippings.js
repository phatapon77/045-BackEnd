// routes/shippings.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Shippings
 *     description: Shipping endpoints
 *
 * /api/shippings:
 *   get:
 *     summary: Get all shippings
 *     tags: [Shippings]
 *     responses:
 *       '200':
 *         description: OK
 *   post:
 *     summary: Create a shipping entry
 *     tags: [Shippings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *             required: [orderId]
 *     responses:
 *       '201':
 *         description: Created
 *
 * /api/shippings/{id}:
 *   get:
 *     summary: Get shipping by id
 *     tags: [Shippings]
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Shipping:
 *       type: object
 *       required:
 *         - order_id
 *         - recipient_name
 *         - recipient_address
 *         - recipient_phone
 *       properties:
 *         order_id:
 *           type: integer
 *         recipient_name:
 *           type: string
 *         recipient_address:
 *           type: string
 *         recipient_phone:
 *           type: string
 *         shipping_status:
 *           type: string
 *           default: "Preparing"
 */

/**
 * @swagger
 * /api/shippings:
 *   get:
 *     summary: ดูรายการจัดส่งทั้งหมด
 *     tags: [Shippings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: สำเร็จ
 *   post:
 *     summary: สร้างรายการจัดส่ง
 *     tags: [Shippings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shipping'
 *     responses:
 *       '201':
 *         description: สร้างรายการจัดส่งสำเร็จ
 */
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_shippings');
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', auth, async (req, res) => {
    const { order_id, recipient_name, recipient_address, recipient_phone, shipping_status } = req.body;
    try {
        const sql = 'INSERT INTO tbl_shippings (order_id, recipient_name, recipient_address, recipient_phone, shipping_status) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [order_id, recipient_name, recipient_address, recipient_phone, shipping_status || 'Preparing']);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /api/shippings/{id}:
 *   put:
 *     summary: อัปเดตสถานะการจัดส่ง
 *     tags: [Shippings]
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
 *             type: object
 *             properties:
 *               shipping_status:
 *                 type: string
 *                 example: "Delivered"
 *     responses:
 *       '200':
 *         description: อัปเดตสถานะสำเร็จ
 */
router.put('/:id', auth, async (req, res) => {
    const { shipping_status } = req.body;
    try {
        await db.query('UPDATE tbl_shippings SET shipping_status=? WHERE id=?', [shipping_status, req.params.id]);
        res.send('Shipping status updated');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;