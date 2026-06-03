const { spawn } = require('child_process');

console.log("Starting API endpoint verification checks on Semantic Versioned (v1) routes...");

// Start the Express server as a subprocess
const serverProcess = spawn('node', ['backend/server.js'], { 
  stdio: 'inherit',
  env: { ...process.env, PORT: 5000 }
});

// Keep track of exit code
let exitCode = 0;

const makeRequest = async (path, method = 'GET', body = null) => {
  const url = `http://localhost:5000/api/v1${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let parsed = {};
  const text = await res.text();
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (err) {
    parsed = text;
  }
  return { status: res.status, body: parsed };
};

setTimeout(async () => {
  try {
    console.log("\nExecuting tests against http://localhost:5000/api/v1...");

    // Test 1: Health endpoint
    console.log("Test 1: GET /health");
    const health = await makeRequest('/health');
    console.log("Status: ", health.status, ", Response: ", health.body);
    if (health.status !== 200 || health.body.status !== 'healthy') {
      throw new Error("Health check failed!");
    }

    // Test 2: Analytics
    console.log("\nTest 2: GET /analytics");
    const analytics = await makeRequest('/analytics');
    console.log("Status: ", analytics.status, ", Revenue: $", analytics.body.totalRevenue);
    if (analytics.status !== 200 || typeof analytics.body.totalRevenue !== 'number') {
      throw new Error("Analytics retrieval failed!");
    }

    // Test 3: List products
    console.log("\nTest 3: GET /products");
    const products = await makeRequest('/products');
    console.log("Status: ", products.status, ", Total Products: ", products.body.length);
    if (products.status !== 200 || !Array.isArray(products.body)) {
      throw new Error("Get products list failed!");
    }

    // Test 4: Create product
    console.log("\nTest 4: POST /products");
    const newProd = {
      name: "Test Smart Bulb",
      sku: "ELC-TEST-09",
      price: 19.99,
      stock: 100,
      category: "Electronics",
      description: "Smart WiFi enabled LED color changing light bulb."
    };
    const createRes = await makeRequest('/products', 'POST', newProd);
    console.log("Status: ", createRes.status, ", Created Product: ", createRes.body);
    if (createRes.status !== 201 || !createRes.body.id) {
      throw new Error("Product creation failed!");
    }
    const createdId = createRes.body.id;

    // Test 5: Update product
    console.log("\nTest 5: PUT /products/" + createdId);
    const updateRes = await makeRequest(`/products/${createdId}`, 'PUT', { price: 24.99 });
    console.log("Status: ", updateRes.status, ", Updated Price: $", updateRes.body.price);
    if (updateRes.status !== 200 || updateRes.body.price !== 24.99) {
      throw new Error("Product update failed!");
    }

    // Test 6: Delete product
    console.log("\nTest 6: DELETE /products/" + createdId);
    const deleteRes = await makeRequest(`/products/${createdId}`, 'DELETE');
    console.log("Status: ", deleteRes.status, ", Message: ", deleteRes.body.message);
    if (deleteRes.status !== 200) {
      throw new Error("Product deletion failed!");
    }

    console.log("\nAll integration tests passed successfully! ✅");
  } catch (err) {
    console.error("\nTest execution failed: ❌", err.message);
    exitCode = 1;
  } finally {
    console.log("\nShutting down Express server process...");
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      process.exit(exitCode);
    }, 1000);
  }
}, 2000);
