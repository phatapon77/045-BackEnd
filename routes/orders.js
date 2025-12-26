// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 * name: Orders
 * description: จัดการคำสั่งซื้อ
 */

/**
 * @swagger
 * components:
 * schemas:
 * Order:
 * type: object
 * required:
 * - customer_id
 * - restaurant_id
 * - menu_id
 * - quantity
 * - total_amount
 * properties:
 * customer_id:
 * type: integer
 * restaurant_id:
 * type: integer
 * menu_id:
 * type: integer
 * quantity:
 * type: integer
 * total_amount:
 * type: number
 * format: float
 * order_status:
 * type: string
 * default: Pending
 */

/**
 * @swagger
 * /api/orders:
 * get:
 * summary: ดูออเดอร์ทั้งหมด
 * tags: [Orders]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: สำเร็จ
 * post:
 * summary: สร้างคำสั่งซื้อ
 * tags: [Orders]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Order'
 * responses:
 * 201:
 * description: สร้างออเดอร์สำเร็จ
 */
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_orders'); 
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', auth, async (req, res) => {
    const { customer_id, restaurant_id, menu_id, quantity, total_amount, order_status } = req.body;
    try {
        const sql = 'INSERT INTO tbl_orders (customer_id, restaurant_id, menu_id, quantity, total_amount, order_status) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [customer_id, restaurant_id, menu_id, quantity, total_amount, order_status || 'Pending']);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /api/orders/{id}:
 * get:
 * summary: ดูรายละเอียดออเดอร์ตาม ID
 * tags: [Orders]
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
 * description: พบออเดอร์
 * put:
 * summary: อัปเดตสถานะออเดอร์
 * tags: [Orders]
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
 * type: object
 * properties:
 * order_status:
 * type: string
 * example: "Completed"
 * responses:
 * 200:
 * description: อัปเดตสถานะสำเร็จ
 * delete:
 * summary: ยกเลิก/ลบออเดอร์
 * tags: [Orders]
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
router.get('/:id', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_orders WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Order not found');
        res.json(rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.put('/:id', auth, async (req, res) => {
    const { order_status } = req.body;
    try {
        await db.query('UPDATE tbl_orders SET order_status=? WHERE id=?', [order_status, req.params.id]);
        res.send(`Order status updated to ${order_status}`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM tbl_orders WHERE id = ?', [req.params.id]);
        res.send('Order deleted successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;