// swaggerSpec.js

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Food Delivery API",
    version: "1.0.0",
    description: "API Documentation สำหรับระบบ Food Delivery ครอบคลุม Customers, Menus, Orders, Payments, Restaurants และ Shippings (เพิ่ม CRUD ครบถ้วน)"
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      Customer: {
        type: "object",
        properties: {
          username: { type: "string", example: "user1" },
          password: { type: "string", example: "123456" },
          fullname: { type: "string", example: "Somchai Jai-dee" },
          address: { type: "string", example: "123 Bangkok" },
          phone: { type: "string", example: "0812345678" },
          email: { type: "string", example: "somchai@email.com" }
        }
      },
      LoginRequest: {
         type: "object",
         properties: {
           username: { type: "string", example: "user1" },
           password: { type: "string", example: "123456" }
         }
      },
      Restaurant: {
        type: "object",
        properties: {
          name: { type: "string", example: "Pad Thai Shop" },
          address: { type: "string", example: "Siam Square" },
          phone: { type: "string", example: "029999999" },
          menu_details: { type: "string", example: "Thai Food, Spicy" }
        }
      },
      Menu: {
        type: "object",
        properties: {
          restaurant_id: { type: "integer", example: 1 },
          menu_name: { type: "string", example: "Tom Yum Kung" },
          description: { type: "string", example: "Spicy Shrimp Soup" },
          price: { type: "number", format: "float", example: 150.00 },
          category: { type: "string", example: "Soup" }
        }
      },
      Order: {
        type: "object",
        properties: {
          customer_id: { type: "integer", example: 1 },
          restaurant_id: { type: "integer", example: 1 },
          menu_id: { type: "integer", example: 1 },
          quantity: { type: "integer", example: 2 },
          total_amount: { type: "number", format: "float", example: 300.00 },
          order_status: { type: "string", example: "Pending" }
        }
      },
      Payment: {
        type: "object",
        properties: {
          order_id: { type: "integer", example: 10 },
          payment_method: { type: "string", example: "Credit Card" },
          payment_status: { type: "string", example: "Pending" }
        }
      },
      Shipping: {
        type: "object",
        properties: {
          order_id: { type: "integer", example: 10 },
          recipient_name: { type: "string", example: "Somchai" },
          recipient_address: { type: "string", example: "123 Main St" },
          recipient_phone: { type: "string", example: "0812345678" },
          shipping_status: { type: "string", example: "Preparing" }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Customers", description: "จัดการข้อมูลลูกค้า" },
    { name: "Restaurants", description: "จัดการข้อมูลร้านอาหาร" },
    { name: "Menus", description: "จัดการเมนูอาหาร" },
    { name: "Orders", description: "จัดการออเดอร์" },
    { name: "Payments", description: "จัดการการชำระเงิน" },
    { name: "Shippings", description: "จัดการการจัดส่ง" }
  ],
  paths: {
    // ================= CUSTOMERS =================
    "/api/customers/register": {
      post: {
        tags: ["Customers"],
        summary: "ลงทะเบียนลูกค้าใหม่",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Customer" } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/customers/login": {
      post: {
        tags: ["Customers"],
        summary: "เข้าสู่ระบบ",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: { "200": { description: "Success (Returns JWT Token)" } }
      }
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        summary: "ดูรายชื่อลูกค้าทั้งหมด",
        responses: { "200": { description: "List of customers" } }
      }
    },
    "/api/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "ดูข้อมูลลูกค้าตาม ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Customer data" } }
      },
      put: {
        tags: ["Customers"],
        summary: "แก้ไขข้อมูลลูกค้า",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { fullname: {type:"string"}, address:{type:"string"}, phone:{type:"string"}, email:{type:"string"} } } } } },
        responses: { "200": { description: "Updated" } }
      },
      delete: {
        tags: ["Customers"],
        summary: "ลบข้อมูลลูกค้า",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Deleted" } }
      }
    },

    // ================= RESTAURANTS =================
    "/api/restaurants": {
      get: {
        tags: ["Restaurants"],
        summary: "ดูร้านอาหารทั้งหมด",
        responses: { "200": { description: "List of restaurants" } }
      },
      post: {
        tags: ["Restaurants"],
        summary: "สร้างร้านอาหารใหม่",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/restaurants/{id}": {
      get: {
        tags: ["Restaurants"],
        summary: "ดูร้านอาหารตาม ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Restaurant data" } }
      },
      put: {
        tags: ["Restaurants"],
        summary: "แก้ไขข้อมูลร้านอาหาร",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
        responses: { "200": { description: "Updated" } }
      },
      delete: {
        tags: ["Restaurants"],
        summary: "ลบร้านอาหาร",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Deleted" } }
      }
    },

    // ================= MENUS =================
    "/api/menus": {
      get: {
        tags: ["Menus"],
        summary: "ดูเมนูทั้งหมด",
        responses: { "200": { description: "List of menus" } }
      },
      post: {
        tags: ["Menus"],
        summary: "สร้างเมนูใหม่",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Menu" } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/menus/{id}": {
      get: {
        tags: ["Menus"],
        summary: "ดูเมนูตาม ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Menu details" } }
      },
      put: {
        tags: ["Menus"],
        summary: "แก้ไขเมนู",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Menu" } } } },
        responses: { "200": { description: "Updated" } }
      },
      delete: {
        tags: ["Menus"],
        summary: "ลบเมนู",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Deleted" } }
      }
    },

    // ================= ORDERS =================
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "ดูออเดอร์ทั้งหมด",
        responses: { "200": { description: "List of orders" } }
      },
      post: {
        tags: ["Orders"],
        summary: "สร้างออเดอร์",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "ดูออเดอร์ตาม ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Order details" } }
      },
      put: {
        tags: ["Orders"],
        summary: "อัปเดตสถานะออเดอร์",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { order_status: { type: "string", example: "Completed" } } } } } },
        responses: { "200": { description: "Updated" } }
      },
      delete: {
        tags: ["Orders"],
        summary: "ลบออเดอร์",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Deleted" } }
      }
    },

    // ================= PAYMENTS =================
    "/api/payments": {
      get: {
        tags: ["Payments"],
        summary: "ดูประวัติการชำระเงินทั้งหมด",
        responses: { "200": { description: "List of payments" } }
      },
      post: {
        tags: ["Payments"],
        summary: "สร้างรายการชำระเงิน",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "ดูการชำระเงินตาม ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Payment details" } }
      },
      put: {
        tags: ["Payments"],
        summary: "อัปเดตสถานะการชำระเงิน",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { payment_status: { type: "string", example: "Paid" } } } } } },
        responses: { "200": { description: "Updated" } }
      },
      delete: {
        tags: ["Payments"],
        summary: "ลบรายการชำระเงิน",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Deleted" } }
      }
    },

    // ================= SHIPPINGS =================
    "/api/shippings": {
      get: {
        tags: ["Shippings"],
        summary: "ดูรายการจัดส่งทั้งหมด",
        responses: { "200": { description: "List of shippings" } }
      },
      post: {
        tags: ["Shippings"],
        summary: "สร้างรายการจัดส่ง",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Shipping" } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/shippings/{id}": {
      get: {
        tags: ["Shippings"],
        summary: "ดูรายการจัดส่งตาม ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Shipping details" } }
      },
      put: {
        tags: ["Shippings"],
        summary: "อัปเดตสถานะการจัดส่ง",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { shipping_status: { type: "string", example: "Delivered" } } } } } },
        responses: { "200": { description: "Updated" } }
      },
      delete: {
        tags: ["Shippings"],
        summary: "ลบรายการจัดส่ง",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Deleted" } }
      }
    }
  }
};

module.exports = swaggerSpec;