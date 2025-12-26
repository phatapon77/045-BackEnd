// tests/integration.test.js
const request = require('supertest');
const app = require('../index'); // Import app
const db = require('../config/db');

describe('Full System Integration Tests', () => {
  let token = '';
  let customerId = '';
  let restaurantId = '';
  let menuId = '';
  let orderId = '';
  let paymentId = '';
  let shippingId = '';

  const testUser = {
    username: 'testuser_fullsystem',
    password: 'password123',
    fullname: 'Test Full System',
    address: '123 Test Street',
    phone: '0812345678',
    email: 'testfull@example.com'
  };

  // --- Setup & Teardown ---
  beforeAll(async () => {
    // ล้างข้อมูลเก่าที่อาจค้างอยู่ (ลบย้อนกลับเพื่อเลี่ยง Foreign Key Error)
    await db.query('DELETE FROM tbl_shippings');
    await db.query('DELETE FROM tbl_payments');
    await db.query('DELETE FROM tbl_orders');
    await db.query('DELETE FROM tbl_menus');
    await db.query('DELETE FROM tbl_restaurants');
    await db.query('DELETE FROM tbl_customers WHERE username = ?', [testUser.username]);
  });

  afterAll(async () => {
    // ล้างข้อมูลหลังจบการทดสอบ
    await db.query('DELETE FROM tbl_shippings WHERE id = ?', [shippingId]);
    await db.query('DELETE FROM tbl_payments WHERE id = ?', [paymentId]);
    await db.query('DELETE FROM tbl_orders WHERE id = ?', [orderId]);
    await db.query('DELETE FROM tbl_menus WHERE id = ?', [menuId]);
    await db.query('DELETE FROM tbl_restaurants WHERE id = ?', [restaurantId]);
    await db.query('DELETE FROM tbl_customers WHERE id = ?', [customerId]);
    
    await db.end(); // ปิด Connection DB
  });

  // ==========================================
  // 1. CUSTOMERS & AUTHENTICATION
  // ==========================================
  describe('Authentication & Customers', () => {
    test('POST /register - Should register a new user', async () => {
      const res = await request(app).post('/api/customers/register').send(testUser);
      expect(res.statusCode).toEqual(201);
    });

    test('POST /login - Should login and return token', async () => {
      const res = await request(app).post('/api/customers/login').send({
        username: testUser.username,
        password: testUser.password
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token; // เก็บ Token ไว้ใช้
      customerId = res.body.user.id; // เก็บ ID ไว้ใช้
    });

    test('GET /customers - Should get all customers (Protected)', async () => {
      const res = await request(app).get('/api/customers').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    test('PUT /customers/:id - Should update customer info', async () => {
      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testUser, fullname: 'Updated Name' });
      expect(res.statusCode).toEqual(200);
    });
  });

  // ==========================================
  // 2. RESTAURANTS (CRUD)
  // ==========================================
  describe('Restaurants API', () => {
    test('POST /restaurants - Should create a restaurant', async () => {
      const res = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Restaurant',
          address: 'Rest Address',
          phone: '029999999',
          menu_details: 'Thai Food'
        });
      expect(res.statusCode).toEqual(201);
      restaurantId = res.body.id; // เก็บ Restaurant ID
    });

    test('GET /restaurants - Should list restaurants', async () => {
      const res = await request(app).get('/api/restaurants');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('PUT /restaurants/:id - Should update restaurant', async () => {
      const res = await request(app)
        .put(`/api/restaurants/${restaurantId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Restaurant', address: 'New Addr', phone: '028888888', menu_details: 'Fusion' });
      expect(res.statusCode).toEqual(200);
    });
  });

  // ==========================================
  // 3. MENUS (CRUD)
  // ==========================================
  describe('Menus API', () => {
    test('POST /menus - Should create a menu item', async () => {
      const res = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: restaurantId,
          menu_name: 'Pad Thai',
          description: 'Delicious noodles',
          price: 150.00,
          category: 'Main Course'
        });
      expect(res.statusCode).toEqual(201);
      menuId = res.body.id; // เก็บ Menu ID
    });

    test('GET /menus - Should list menus', async () => {
      const res = await request(app).get('/api/menus');
      expect(res.statusCode).toEqual(200);
    });

    test('PUT /menus/:id - Should update menu', async () => {
      const res = await request(app)
        .put(`/api/menus/${menuId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: restaurantId,
          menu_name: 'Pad Thai Special',
          description: 'More shrimp',
          price: 180.00,
          category: 'Main Course'
        });
      expect(res.statusCode).toEqual(200);
    });
  });

  // ==========================================
  // 4. ORDERS (CRUD)
  // ==========================================
  describe('Orders API', () => {
    test('POST /orders - Should create an order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customer_id: customerId,
          restaurant_id: restaurantId,
          menu_id: menuId,
          quantity: 2,
          total_amount: 360.00,
          order_status: 'Pending'
        });
      expect(res.statusCode).toEqual(201);
      orderId = res.body.id; // เก็บ Order ID
    });

    test('GET /orders - Should list orders', async () => {
      const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });

    test('PUT /orders/:id - Should update order status', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ order_status: 'Confirmed' });
      expect(res.statusCode).toEqual(200);
    });
  });

  // ==========================================
  // 5. PAYMENTS (CRUD)
  // ==========================================
  describe('Payments API', () => {
    test('POST /payments - Should create a payment', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          payment_method: 'Credit Card',
          payment_status: 'Pending'
        });
      expect(res.statusCode).toEqual(201);
      paymentId = res.body.id;
    });

    test('PUT /payments/:id - Should update payment status', async () => {
      const res = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_status: 'Completed' });
      expect(res.statusCode).toEqual(200);
    });
  });

  // ==========================================
  // 6. SHIPPINGS (CRUD)
  // ==========================================
  describe('Shippings API', () => {
    test('POST /shippings - Should create shipping info', async () => {
      const res = await request(app)
        .post('/api/shippings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          recipient_name: 'Test Recipient',
          recipient_address: 'Shipping Address',
          recipient_phone: '0899999999',
          shipping_status: 'Preparing'
        });
      expect(res.statusCode).toEqual(201);
      shippingId = res.body.id;
    });

    test('PUT /shippings/:id - Should update shipping status', async () => {
      const res = await request(app)
        .put(`/api/shippings/${shippingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ shipping_status: 'Delivered' });
      expect(res.statusCode).toEqual(200);
    });
  });

  // ==========================================
  // 7. CLEANUP (DELETE TESTS)
  // ==========================================
  describe('Delete Operations (Cleanup)', () => {
    // ต้องลบย้อนกลับตามลำดับ Foreign Keys
    
    test('DELETE /shippings/:id', async () => {
      const res = await request(app).delete(`/api/shippings/${shippingId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });

    test('DELETE /payments/:id', async () => {
      const res = await request(app).delete(`/api/payments/${paymentId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });

    test('DELETE /orders/:id', async () => {
      const res = await request(app).delete(`/api/orders/${orderId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });

    test('DELETE /menus/:id', async () => {
      const res = await request(app).delete(`/api/menus/${menuId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });

    test('DELETE /restaurants/:id', async () => {
      const res = await request(app).delete(`/api/restaurants/${restaurantId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });

    test('DELETE /customers/:id', async () => {
      const res = await request(app).delete(`/api/customers/${customerId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
    });
  });

});