const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const dbPath = path.join(__dirname, '../db.json');

const testUser = {
  name: "Test Customer",
  email: "test.customer@example.com",
  password: "secretpassword123"
};

describe('E-Commerce API Endpoints', () => {
  let authToken = '';
  let createdProductId = '';
  let createdOrderId = '';

  // Register + login once before all tests to get a valid JWT token
  beforeAll(async () => {
    // Ensure no leftover test user from a previous run
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      data.users = (data.users || []).filter(u => u.email !== testUser.email.toLowerCase());
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }
    await request(app).post('/api/v1/auth/register').send(testUser);
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginRes.body.token;
  });

  // Clean up everything created during the test run
  afterAll(async () => {
    if (createdProductId) {
      await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      data.users = (data.users || []).filter(u => u.email !== testUser.email.toLowerCase());
      data.orders = (data.orders || []).filter(o => o.customerEmail !== testUser.email.toLowerCase());
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }
  });

  // ─────────────────────────────────────────────
  describe('Health Endpoints', () => {
    test('GET /health should return 200 with status healthy', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body).toHaveProperty('status', 'healthy');
    });

    test('GET /api/v1/health should return version metadata', async () => {
      const res = await request(app).get('/api/v1/health').expect(200);
      expect(res.body).toHaveProperty('apiVersion', 'v1');
      expect(res.body).toHaveProperty('status', 'healthy');
    });
  });

  // ─────────────────────────────────────────────
  describe('Auth Endpoints', () => {
    test('POST /api/v1/auth/register should fail with missing fields', async () => {
      await request(app).post('/api/v1/auth/register').send({ email: 'x@x.com', password: 'pass1234' }).expect(400);
    });

    test('POST /api/v1/auth/register should fail with password under 8 chars', async () => {
      await request(app).post('/api/v1/auth/register').send({ name: 'X', email: 'x@x.com', password: 'short' }).expect(400);
    });

    test('POST /api/v1/auth/register should fail on duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser).expect(400);
    });

    test('POST /api/v1/auth/login should authenticate registered credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password
      }).expect(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(testUser.email.toLowerCase());
      expect(res.body).not.toHaveProperty('password');
    });

    test('POST /api/v1/auth/login should fail on wrong password', async () => {
      await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword'
      }).expect(401);
    });

    test('POST /api/v1/auth/login should fail for unregistered email', async () => {
      await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123'
      }).expect(401);
    });

    test('Protected endpoints return 401 without token', async () => {
      await request(app).get('/api/v1/analytics').expect(401);
      await request(app).get('/api/v1/orders').expect(401);
      await request(app).get('/api/v1/customers').expect(401);
    });
  });

  // ─────────────────────────────────────────────
  describe('Analytics Endpoints', () => {
    test('GET /api/v1/analytics should return revenue and inventory metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('totalOrders');
      expect(res.body).toHaveProperty('activeCustomers');
    });
  });

  // ─────────────────────────────────────────────
  describe('Products CRUD Endpoints', () => {
    test('GET /api/v1/products should return list of products (public)', async () => {
      const res = await request(app).get('/api/v1/products').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('POST /api/v1/products should create a new product (requires auth)', async () => {
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
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newProduct.name);
      createdProductId = res.body.id;
    });

    test('POST /api/v1/products should fail validation if missing fields', async () => {
      await request(app).post('/api/v1/products').set('Authorization', `Bearer ${authToken}`)
        .send({ sku: "S", price: 1, stock: 1, category: "C" }).expect(400);
      await request(app).post('/api/v1/products').set('Authorization', `Bearer ${authToken}`)
        .send({ name: "N", price: 1, stock: 1, category: "C" }).expect(400);
    });

    test('GET /api/v1/products/:id should return single product (public)', async () => {
      const res = await request(app).get(`/api/v1/products/${createdProductId}`).expect(200);
      expect(res.body.id).toBe(createdProductId);
    });

    test('GET /api/v1/products/:id should return 404 for unknown product', async () => {
      await request(app).get('/api/v1/products/prod-unknown').expect(404);
    });

    test('PUT /api/v1/products/:id should modify product parameters (requires auth)', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 59.99, stock: 18 })
        .expect(200);
      expect(res.body.price).toBe(59.99);
      expect(res.body.stock).toBe(18);
    });

    test('PUT /api/v1/products/:id should return 404 for unknown product', async () => {
      await request(app)
        .put('/api/v1/products/prod-unknown')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 10.00 })
        .expect(404);
    });
  });

  // ─────────────────────────────────────────────
  describe('Orders Endpoints', () => {
    test('GET /api/v1/orders should list all orders (requires auth)', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/v1/orders should create order with server-calculated total', async () => {
      const orderPayload = {
        customerName: testUser.name,
        customerEmail: testUser.email,
        items: [
          { productId: createdProductId, name: "Jest Test Speaker", price: 49.99, quantity: 1 }
        ],
        totalAmount: 999 // server ignores this and recalculates
      };
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderPayload)
        .expect(201);
      // Capture the ID first so afterAll cleanup and status tests can use it
      createdOrderId = res.body.id;
      expect(createdOrderId).toBeDefined();
      expect(res.body.orderNumber).toBeDefined();
      // Server ignores client-sent totalAmount (999) and recalculates from product price.
      // Price was updated to 59.99 by the PUT test earlier; 59.99 * 1.05 = 62.99
      expect(res.body.totalAmount).toBe(62.99);
      expect(res.body.totalAmount).not.toBe(999);
    });

    test('POST /api/v1/orders should fail if missing parameters', async () => {
      await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${authToken}`)
        .send({ customerEmail: "e", items: [] }).expect(400);
      await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${authToken}`)
        .send({ customerName: "n", items: [] }).expect(400);
      await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${authToken}`)
        .send({ customerName: "n", customerEmail: "e" }).expect(400);
      await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${authToken}`)
        .send({ customerName: "n", customerEmail: "e", items: [] }).expect(400);
    });

    test('POST /api/v1/orders should fail if quantities exceed available stock', async () => {
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerName: "Fail Order",
          customerEmail: "fail@example.com",
          items: [{ productId: "prod-3", name: "Watch", price: 89.00, quantity: 9999 }],
          totalAmount: 89000.00
        })
        .expect(400);
    });

    test('PUT /api/v1/orders/:id/status should transition order status', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Processing' })
        .expect(200);
      expect(res.body.status).toBe('Processing');
    });

    test('PUT /api/v1/orders/:id/status should fail for invalid status value', async () => {
      await request(app)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'InvalidStatus' })
        .expect(400);
    });

    test('PUT /api/v1/orders/:id/status should fail if status field is missing', async () => {
      await request(app)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    test('PUT /api/v1/orders/:id/status should return 404 for unknown order', async () => {
      await request(app)
        .put('/api/v1/orders/ord-unknown/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Shipped' })
        .expect(404);
    });
  });

  // ─────────────────────────────────────────────
  describe('Customers Endpoints', () => {
    test('GET /api/v1/customers should aggregate unique purchasers data', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  describe('Customer Orders Endpoint', () => {
    test('GET /api/v1/orders/customer should retrieve own orders', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/customer?email=${testUser.email}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].customerEmail).toBe(testUser.email.toLowerCase());
    });

    test('GET /api/v1/orders/customer should fail if email query is missing', async () => {
      await request(app)
        .get('/api/v1/orders/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('GET /api/v1/orders/customer should return 403 for another user email', async () => {
      await request(app)
        .get('/api/v1/orders/customer?email=other@example.com')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
