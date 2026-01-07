// routes/menus.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Menus
 *     description: Menu related endpoints
 *
 * /api/menus:
 *   get:
 *     summary: Get all menus
 *     tags: [Menus]
 *     responses:
 *       '200':
 *         description: OK
 *   post:
 *     summary: Create a menu
 *     tags: [Menus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *             required: [name, price]
 *     responses:
 *       '201':
 *         description: Created
 *
 * /api/menus/{id}:
 *   get:
 *     summary: Get a menu by id
 *     tags: [Menus]
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
 *     Menu:
 *       type: object
 *       required:
 *         - restaurant_id
 *         - menu_name
 *         - price
 *       properties:
 *         restaurant_id:
 *           type: integer
 *         menu_name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         category:
 *           type: string
 */

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: ดูรายการเมนูทั้งหมด
 *     tags: [Menus]
 *     responses:
 *       '200':
 *         description: รายการเมนู
 *   post:
 *     summary: เพิ่มเมนูใหม่
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       '201':
 *         description: สร้างเมนูสำเร็จ
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tbl_menus');
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', auth, async (req, res) => {
    const { restaurant_id, menu_name, description, price, category } = req.body;
    try {
        const sql = 'INSERT INTO tbl_menus (restaurant_id, menu_name, description, price, category) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [restaurant_id, menu_name, description, price, category]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /api/menus/{id}:
 *   put:
 *     summary: แก้ไขเมนู
 *     tags: [Menus]
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
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       '200':
 *         description: อัปเดตสำเร็จ
 *   delete:
 *     summary: ลบเมนู
 *     tags: [Menus]
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
router.put('/:id', auth, async (req, res) => {
    const { restaurant_id, menu_name, description, price, category } = req.body;
    try {
        const sql = 'UPDATE tbl_menus SET restaurant_id=?, menu_name=?, description=?, price=?, category=? WHERE id=?';
        await db.query(sql, [restaurant_id, menu_name, description, price, category, req.params.id]);
        res.send('Menu updated successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM tbl_menus WHERE id = ?', [req.params.id]);
        res.send('Menu deleted successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;