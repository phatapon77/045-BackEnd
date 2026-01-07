const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. เพิ่มบรรทัดนี้ที่ส่วนบนสุด

// const swaggerUi = require('swagger-ui-express');      <-- 2. ลบหรือ comment บรรทัดนี้
// const swaggerSpecs = require('./config/swagger');     <-- 2. ลบหรือ comment บรรทัดนี้

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Use Routes (เปิดใช้งาน)
app.use('/api/customers', require('./routes/customers'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/shippings', require('./routes/shippings'));

// ==========================================
// 🚀 Swagger UI Setup (แบบ HTML Static File)
// ==========================================
// 3. แทนที่ส่วนเดิมด้วยโค้ดชุดนี้ครับ
app.get('/api-docs', (req, res) => {
  // ตรวจสอบให้แน่ใจว่าไฟล์ swagger-api.html อยู่โฟลเดอร์เดียวกับไฟล์นี้
  res.sendFile(path.join(__dirname, 'swagger-api.html'));
});

// ส่วนของเดิม (Vercel Fix) ให้ลบหรือ Comment ทิ้งไปเลยครับ
/* const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
const JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js";
const JS_PRESET_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js";

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCssUrl: CSS_URL,
    customJs: [JS_URL, JS_PRESET_URL],
    customSiteTitle: "Food API Docs"
  })
);
*/

// Default Route (เผื่อเข้าหน้าแรก)
app.get('/', (req, res) => {
   res.send('API Backend is running! Access docs at <a href="/api-docs">/api-docs</a>');
});

module.exports = app;