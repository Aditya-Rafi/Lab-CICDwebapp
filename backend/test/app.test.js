const request = require('supertest');
const app = require('../server');

describe('E-Commerce API Endpoints', () => {
  let createdProductId = '';
  let createdOrderId = '';

  describe('Health Endpoints', () => {
    test('GET /health should return 200 with status healthy', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      expect(res.body).toHaveProperty('status', 'healthy');
    });

    test('GET /api/v1/health should return 200 with version metadata', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .expect(200);
      expect(res.body).toHaveProperty('apiVersion', 'v1');
      expect(res.body).toHaveProperty('status', 'healthy');
    });
  });

  describe('Analytics Endpoints', () => {
    test('GET /api/v1/analytics should return revenue and inventory metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics')
        .expect(200);
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('totalOrders');
      expect(res.body).toHaveProperty('activeCustomers');
    });
  });

  describe('Products CRUD Endpoints', () => {
    test('GET /api/v1/products should return list of products', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('POST /api/v1/products should create a new product', async () => {
      const newProduct = {
        name: "Jest Test Speaker",
        sku: "ELC-JEST-88",
        price: 49.99,
        stock: 20,
        category: "Electronics",
        description: "Wireless bluetooth speaker built for testing."
      };
      
      const res = await request(app)
        .post('/api/v1/products')
        .send(newProduct)
        .expect(201);
        
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newProduct.name);
      createdProductId = res.body.id;
    });

    test('POST /api/v1/products should fail validation if missing fields', async () => {
      await request(app).post('/api/v1/products').send({ sku: "S", price: 1, stock: 1, category: "C" }).expect(400);
      await request(app).post('/api/v1/products').send({ name: "N", price: 1, stock: 1, category: "C" }).expect(400);
      await request(app).post('/api/v1/products').send({ name: "N", sku: "S", stock: 1, category: "C" }).expect(400);
      await request(app).post('/api/v1/products').send({ name: "N", sku: "S", price: 1, category: "C" }).expect(400);
      await request(app).post('/api/v1/products').send({ name: "N", sku: "S", price: 1, stock: 1 }).expect(400);
    });

    test('GET /api/v1/products/:id should return single product details', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${createdProductId}`)
        .expect(200);
      expect(res.body.id).toBe(createdProductId);
    });

    test('GET /api/v1/products/:id should return 404 for unknown product', async () => {
      await request(app)
        .get('/api/v1/products/prod-unknown')
        .expect(404);
    });

    test('PUT /api/v1/products/:id should modify product parameters', async () => {
      const updateData = { price: 59.99, stock: 18 };
      const res = await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .send(updateData)
        .expect(200);
      expect(res.body.price).toBe(59.99);
      expect(res.body.stock).toBe(18);
    });

    test('PUT /api/v1/products/:id should return 404 for unknown product', async () => {
      await request(app)
        .put('/api/v1/products/prod-unknown')
        .send({ price: 10.00 })
        .expect(404);
    });
  });

  describe('Orders Endpoints', () => {
    test('GET /api/v1/orders should list all orders', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/v1/orders should check out order and deduct product stocks', async () => {
      const orderPayload = {
        customerName: "Alice Jest",
        customerEmail: "alice.j@example.com",
        items: [
          { productId: "prod-2", name: "AeroGlide Performance Running Shoes", price: 125.50, quantity: 1 }
        ],
        totalAmount: 125.50
      };

      const res = await request(app)
        .post('/api/v1/orders')
        .send(orderPayload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.orderNumber).toBeDefined();
      createdOrderId = res.body.id;
    });

    test('POST /api/v1/orders should fail if missing parameters', async () => {
      await request(app).post('/api/v1/orders').send({ customerEmail: "e", items: [], totalAmount: 0 }).expect(400);
      await request(app).post('/api/v1/orders').send({ customerName: "n", items: [], totalAmount: 0 }).expect(400);
      await request(app).post('/api/v1/orders').send({ customerName: "n", customerEmail: "e", totalAmount: 0 }).expect(400);
      await request(app).post('/api/v1/orders').send({ customerName: "n", customerEmail: "e", items: [] }).expect(400);
    });

    test('POST /api/v1/orders should fail if quantities exceed available stock', async () => {
      const orderPayload = {
        customerName: "Fail Order",
        customerEmail: "fail@example.com",
        items: [
          { productId: "prod-3", name: "Watch", price: 89.00, quantity: 9999 }
        ],
        totalAmount: 89000.00
      };

      await request(app)
        .post('/api/v1/orders')
        .send(orderPayload)
        .expect(400);
    });

    test('PUT /api/v1/orders/:id/status should transition order status', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .send({ status: 'Processing' })
        .expect(200);
      expect(res.body.status).toBe('Processing');
    });

    test('PUT /api/v1/orders/:id/status should fail if status field is missing', async () => {
      await request(app)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .send({})
        .expect(400);
    });

    test('PUT /api/v1/orders/:id/status should return 404 for unknown order id', async () => {
      await request(app)
        .put('/api/v1/orders/ord-unknown/status')
        .send({ status: 'Shipped' })
        .expect(404);
    });
  });

  describe('Customers Endpoints', () => {
    test('GET /api/v1/customers should aggregate unique purchasers data', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      const customer = res.body.find(c => c.email === 'alice.j@example.com');
      expect(customer).toBeDefined();
    });
  });

  // Cleanup newly created products
  afterAll(async () => {
    if (createdProductId) {
      await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .expect(200);
    }
  });
});
