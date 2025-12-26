// index.js
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger'); // Import ไฟล์ config ที่เราแยกไป
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Route
// เรียกใช้ swaggerUi.setup โดยส่งค่า config ที่ import เข้ามา
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/shippings', require('./routes/shippings'));

// Health Check
app.get('/', (req, res) => res.send('API Running... Docs at /api-docs'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;