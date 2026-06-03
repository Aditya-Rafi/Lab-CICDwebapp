const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csrf');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// CSRF token verification middleware using 'csrf' package
const csrfTokens = new csrf();
/* istanbul ignore next */
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const secret = req.cookies._csrfSecret;
    if (!secret || !csrfTokens.verify(secret, token)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
  });
}

// API Version: Semantic Versioning of the API
const API_VERSION = 'v1';
const BASE_PATH = `/api/${API_VERSION}`;

// 0. System Meta Check
app.get(`${BASE_PATH}/health`, (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    apiVersion: API_VERSION,
    service: 'E-Commerce Admin REST Service'
  });
});

// Native Node health check endpoint (Kubernetes-friendly)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 1. ANALYTICS ENDPOINTS
app.get(`${BASE_PATH}/analytics`, (req, res) => {
  res.json(db.getAnalytics());
});

// 2. PRODUCTS ENDPOINTS (CRUD)
app.get(`${BASE_PATH}/products`, (req, res) => {
  const products = db.getProducts();
  res.json(products);
});

app.get(`${BASE_PATH}/products/:id`, (req, res) => {
  const prod = db.getProductById(req.params.id);
  if (prod) {
    res.json(prod);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post(`${BASE_PATH}/products`, (req, res) => {
  const { name, sku, price, stock, category } = req.body;
  if (!name || !sku || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Missing required fields (name, sku, price, stock, category)' });
  }
  const newProduct = db.createProduct(req.body);
  res.status(201).json(newProduct);
});

app.put(`${BASE_PATH}/products/:id`, (req, res) => {
  const prod = db.getProductById(req.params.id);
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const updatedProduct = db.updateProduct(req.params.id, req.body);
  res.json(updatedProduct);
});

app.delete(`${BASE_PATH}/products/:id`, (req, res) => {
  const prod = db.getProductById(req.params.id);
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const success = db.deleteProduct(req.params.id);
  if (success) {
    res.json({ message: 'Product deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 3. ORDERS ENDPOINTS
app.get(`${BASE_PATH}/orders`, (req, res) => {
  res.json(db.getOrders());
});

app.post(`${BASE_PATH}/orders`, (req, res) => {
  const { customerName, customerEmail, items, totalAmount } = req.body;
  if (!customerName || !customerEmail || !items || !items.length || totalAmount === undefined) {
    return res.status(400).json({ error: 'Missing order parameters' });
  }
  // Deduct product stock
  const products = db.getProducts();
  let stockError = false;
  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod || prod.stock < item.quantity) {
      stockError = true;
    }
  });

  if (stockError) {
    return res.status(400).json({ error: 'One or more items are out of stock' });
  }

  // Deduct stocks
  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    db.updateProduct(item.productId, { stock: prod.stock - item.quantity });
  });

  const newOrder = db.createOrder(req.body);
  res.status(201).json(newOrder);
});

app.put(`${BASE_PATH}/orders/:id/status`, (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  const updatedOrder = db.updateOrderStatus(req.params.id, status);
  if (updatedOrder) {
    res.json(updatedOrder);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// 4. CUSTOMERS ENDPOINTS
app.get(`${BASE_PATH}/customers`, (req, res) => {
  res.json(db.getCustomers());
});

// 5. AUTH ENDPOINTS
app.post(`${BASE_PATH}/auth/register`, (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }
  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const newUser = db.createUser({ name, email, password });
  res.status(201).json(newUser);
});

app.post(`${BASE_PATH}/auth/login`, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const crypto = require('crypto');
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  if (user.password !== hashedPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    token: 'simulated-token-' + user.id
  });
});

// 6. CUSTOMER ORDERS ENDPOINT
app.get(`${BASE_PATH}/orders/customer`, (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const orders = db.getOrders();
  const customerOrders = orders.filter(o => o.customerEmail.toLowerCase() === email.toLowerCase());
  res.json(customerOrders);
});


// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT} (API Version: ${API_VERSION})`);
  });
}

module.exports = app;
