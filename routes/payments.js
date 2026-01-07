// routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment endpoints
 *
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     responses:
 *       '200':
 *         description: OK
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *             required: [orderId, amount]
 *     responses:
 *       '201':
 *         description: Created
 *
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by id
 *     tags: [Payments]
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
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_payments');
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', auth, async (req, res) => {
    const { order_id, payment_method, payment_status } = req.body;
    try {
        const sql = 'INSERT INTO tbl_payments (order_id, payment_method, payment_status) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [order_id, payment_method, payment_status || 'Pending']);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: อัปเดตสถานะการชำระเงิน
 *     tags: [Payments]
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
 *               payment_status:
 *                 type: string
 *                 example: "Paid"
 *     responses:
 *       '200':
 *         description: อัปเดตสถานะสำเร็จ
 */
router.put('/:id', auth, async (req, res) => {
    const { payment_status } = req.body;
    try {
        await db.query('UPDATE tbl_payments SET payment_status=? WHERE id=?', [payment_status, req.params.id]);
        res.send('Payment status updated');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;