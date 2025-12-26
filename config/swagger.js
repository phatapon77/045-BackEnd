// config/swagger.js
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Food Delivery API',
      version: '1.0.0',
      description: 'API for Managing Food Delivery System'
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  // ระบุ Path ของไฟล์ Route ที่เราเขียน Docs ไว้
  // หมายเหตุ: Path นี้อ้างอิงจาก Root ของโปรเจกต์ (ที่ไฟล์ index.js อยู่)
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;