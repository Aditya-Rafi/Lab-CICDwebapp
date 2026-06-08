const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csrf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '8h';

if (!JWT_SECRET && NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-insecure-secret-change-me-before-production'; // gitleaks:allow

// --- Security middleware ---
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// CORS: restrict origins via ALLOWED_ORIGINS env var in production
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true
}));

// CSRF protection (production only — dev SPA uses JWT Bearer token)
const csrfTokens = new csrf();
/* istanbul ignore next */
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const secret = req.cookies._csrfSecret;
    if (!secret || !csrfTokens.verify(secret, token)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
  });
}

// --- Rate limiters ---
// Stricter limit on auth endpoints to mitigate brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: NODE_ENV === 'test' ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down.' }
});

app.use(generalLimiter);

// --- JWT authentication middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, EFFECTIVE_JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const API_VERSION = 'v1';
const BASE_PATH = `/api/${API_VERSION}`;

// --- Health endpoints (public) ---
app.get(`${BASE_PATH}/health`, (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    apiVersion: API_VERSION,
    service: 'E-Commerce Admin REST Service'
  });
});

// Kubernetes-friendly health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- Analytics (protected) ---
app.get(`${BASE_PATH}/analytics`, authenticateToken, (req, res) => {
  res.json(db.getAnalytics());
});

// --- Products (GET public, writes protected) ---
app.get(`${BASE_PATH}/products`, (req, res) => {
  res.json(db.getProducts());
});

app.get(`${BASE_PATH}/products/:id`, (req, res) => {
  const prod = db.getProductById(req.params.id);
  if (prod) return res.json(prod);
  res.status(404).json({ error: 'Product not found' });
});

app.post(`${BASE_PATH}/products`, authenticateToken, (req, res) => {
  const { name, sku, price, stock, category } = req.body;
  if (!name || !sku || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Missing required fields (name, sku, price, stock, category)' });
  }
  res.status(201).json(db.createProduct(req.body));
});

app.put(`${BASE_PATH}/products/:id`, authenticateToken, (req, res) => {
  const prod = db.getProductById(req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });
  res.json(db.updateProduct(req.params.id, req.body));
});

app.delete(`${BASE_PATH}/products/:id`, authenticateToken, (req, res) => {
  const prod = db.getProductById(req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });
  const success = db.deleteProduct(req.params.id);
  if (success) return res.json({ message: 'Product deleted successfully' });
  res.status(500).json({ error: 'Failed to delete product' });
});

// --- Orders (all protected) ---
// NOTE: /orders/customer must be defined before /orders/:id routes to avoid param capture
app.get(`${BASE_PATH}/orders/customer`, authenticateToken, (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  // Users may only query their own orders
  if (req.user.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: you may only view your own orders' });
  }
  const orders = db.getOrders().filter(o => o.customerEmail.toLowerCase() === email.toLowerCase());
  res.json(orders);
});

app.get(`${BASE_PATH}/orders`, authenticateToken, (req, res) => {
  res.json(db.getOrders());
});

app.post(`${BASE_PATH}/orders`, authenticateToken, (req, res) => {
  const { customerName, customerEmail, items } = req.body;
  if (!customerName || !customerEmail || !items || !items.length) {
    return res.status(400).json({ error: 'Missing order parameters' });
  }

  // Server-side stock check and total calculation (do not trust client-sent totalAmount)
  const products = db.getProducts();
  let stockError = false;
  let serverTotal = 0;

  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod || prod.stock < item.quantity) {
      stockError = true;
    } else {
      serverTotal += prod.price * item.quantity;
    }
  });

  if (stockError) {
    return res.status(400).json({ error: 'One or more items are out of stock' });
  }

  // Apply 5% tax server-side
  serverTotal = parseFloat((serverTotal * 1.05).toFixed(2));

  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    db.updateProduct(item.productId, { stock: prod.stock - item.quantity });
  });

  res.status(201).json(db.createOrder({ ...req.body, totalAmount: serverTotal }));
});

app.put(`${BASE_PATH}/orders/:id/status`, authenticateToken, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }
  const updated = db.updateOrderStatus(req.params.id, status);
  if (updated) return res.json(updated);
  res.status(404).json({ error: 'Order not found' });
});

// --- Customers (protected) ---
app.get(`${BASE_PATH}/customers`, authenticateToken, (req, res) => {
  res.json(db.getCustomers());
});

// --- Auth endpoints (rate limited) ---
app.post(`${BASE_PATH}/auth/register`, authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (db.getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = db.createUser({ name, email, hashedPassword });
  res.status(201).json(newUser);
});

app.post(`${BASE_PATH}/auth/login`, authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.json({ id: user.id, name: user.name, email: user.email, token });
});

/* istanbul ignore next */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT} (API Version: ${API_VERSION})`);
  });
}

module.exports = app;
