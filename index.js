const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

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
// 🚀 Swagger UI Setup (Vercel Fix)
// ==========================================
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
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

// Default Route (เผื่อเข้าหน้าแรก)
app.get('/', (req, res) => {
    res.send('API Backend is running! Access docs at <a href="/api-docs">/api-docs</a>');
});

module.exports = app;