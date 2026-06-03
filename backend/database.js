const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'db.json');

// Default database fallback
const defaultDb = {
  products: [],
  orders: []
};

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      writeDb(defaultDb);
      return defaultDb;
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file:", err);
    return defaultDb;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

const db = {
  getProducts: () => {
    const data = readDb();
    return data.products || [];
  },
  getProductById: (id) => {
    const products = db.getProducts();
    return products.find(p => p.id === id);
  },
  createProduct: (productData) => {
    const data = readDb();
    const newProduct = {
      id: "prod-" + uuidv4().substring(0, 8),
      name: productData.name || "Unnamed Product",
      sku: productData.sku || "SKU-TEMP",
      price: parseFloat(productData.price) || 0,
      stock: parseInt(productData.stock) || 0,
      category: productData.category || "General",
      description: productData.description || "",
      imageUrl: productData.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
    };
    data.products.push(newProduct);
    writeDb(data);
    return newProduct;
  },
  updateProduct: (id, productData) => {
    const data = readDb();
    const index = data.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    data.products[index] = {
      ...data.products[index],
      name: productData.name !== undefined ? productData.name : data.products[index].name,
      sku: productData.sku !== undefined ? productData.sku : data.products[index].sku,
      price: productData.price !== undefined ? parseFloat(productData.price) : data.products[index].price,
      stock: productData.stock !== undefined ? parseInt(productData.stock) : data.products[index].stock,
      category: productData.category !== undefined ? productData.category : data.products[index].category,
      description: productData.description !== undefined ? productData.description : data.products[index].description,
      imageUrl: productData.imageUrl !== undefined ? productData.imageUrl : data.products[index].imageUrl
    };
    writeDb(data);
    return data.products[index];
  },
  deleteProduct: (id) => {
    const data = readDb();
    const initialLen = data.products.length;
    data.products = data.products.filter(p => p.id !== id);
    writeDb(data);
    return data.products.length < initialLen;
  },
  getOrders: () => {
    const data = readDb();
    return data.orders || [];
  },
  createOrder: (orderData) => {
    const data = readDb();
    const newOrder = {
      id: "ord-" + uuidv4().substring(0, 8),
      orderNumber: "BELI-" + (1000 + (data.orders || []).length + 1),
      customerName: orderData.customerName || "Customer Name",
      customerEmail: orderData.customerEmail || "customer@example.com",
      items: orderData.items || [],
      totalAmount: parseFloat(orderData.totalAmount) || 0,
      status: "Pending",
      createdAt: new Date().toISOString()
    };
    data.orders = data.orders || [];
    data.orders.push(newOrder);
    writeDb(data);
    return newOrder;
  },
  updateOrderStatus: (id, status) => {
    const data = readDb();
    const index = data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    data.orders[index].status = status;
    writeDb(data);
    return data.orders[index];
  },
  getCustomers: () => {
    const orders = db.getOrders();
    const customerMap = {};
    orders.forEach(o => {
      const email = o.customerEmail;
      if (!customerMap[email]) {
        customerMap[email] = {
          name: o.customerName,
          email: o.customerEmail,
          ordersCount: 0,
          totalSpent: 0
        };
      }
      customerMap[email].ordersCount += 1;
      if (o.status !== 'Cancelled') {
        customerMap[email].totalSpent += o.totalAmount;
      }
    });
    return Object.values(customerMap);
  },
  getAnalytics: () => {
    const products = db.getProducts();
    const orders = db.getOrders();
    
    let totalRevenue = 0;
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        totalRevenue += o.totalAmount;
      }
    });
    
    const activeCustomers = new Set(orders.map(o => o.customerEmail)).size;
    const outOfStockProducts = products.filter(p => p.stock <= 0).length;
    const lowStockAlerts = products.filter(p => p.stock > 0 && p.stock < 5).map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock
    }));
    
    const monthlySales = [
      { month: "Jan", sales: 1200 },
      { month: "Feb", sales: 1900 },
      { month: "Mar", sales: 1700 },
      { month: "Apr", sales: 2400 },
      { month: "May", sales: 3100 },
      { month: "Jun", sales: parseFloat(totalRevenue.toFixed(2)) }
    ];
    
    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders: orders.length,
      activeCustomers,
      outOfStockProducts,
      lowStockAlerts,
      monthlySales
    };
  }
};

module.exports = db;
