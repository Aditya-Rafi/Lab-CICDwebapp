<template>
  <div class="storefront-page">
    <!-- Hero Banner -->
    <section class="hero-banner glass-card">
      <div class="hero-content">
        <h1>Welcome to <span class="highlight">BeliAja.com</span></h1>
        <p>Premium, high-performance, and curated products at your fingertips.</p>
      </div>
      <div class="hero-graphic">🛍️✨</div>
    </section>

    <div class="storefront-layout">
      <!-- Products Panel -->
      <div class="products-panel">
        <div class="controls-row glass-card">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search products by name or SKU..." 
            />
          </div>
          
          <div class="categories-filter">
            <button 
              v-for="cat in categories" 
              :key="cat"
              :class="['filter-btn', { active: activeCategory === cat }]"
              @click="activeCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading products catalog...</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="empty-state glass-card">
          <p>No products found matching your search criteria.</p>
        </div>

        <div v-else class="products-grid">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id" 
            class="product-card glass-card"
          >
            <div class="product-image-container">
              <img :src="product.imageUrl" :alt="product.name" class="product-image" />
              <span class="category-badge">{{ product.category }}</span>
            </div>
            
            <div class="product-details">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-sku">SKU: <code>{{ product.sku }}</code></p>
              <p class="product-desc">{{ truncateDesc(product.description) }}</p>
              
              <div class="card-footer">
                <span class="product-price">${{ product.price.toFixed(2) }}</span>
                
                <div v-if="product.stock > 0">
                  <button class="btn-add-cart" @click="addToCart(product)">
                    Add to Cart 🛒
                  </button>
                </div>
                <div v-else>
                  <span class="badge badge-danger">Out of Stock</span>
                </div>
              </div>
              <div class="stock-status">
                <span v-if="product.stock > 0 && product.stock < 5" class="low-stock-text">
                  ⚠️ Only {{ product.stock }} left!
                </span>
                <span v-else-if="product.stock >= 5" class="in-stock-text">
                  ✓ {{ product.stock }} in stock
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shopping Cart Sidebar -->
      <div class="cart-panel glass-card">
        <h2>Your Cart 🛒</h2>
        
        <div v-if="cart.length === 0" class="cart-empty">
          <span class="cart-empty-icon">🎒</span>
          <p>Your cart is empty. Add products to get started!</p>
        </div>
        
        <div v-else class="cart-contents">
          <div class="cart-items-list">
            <div v-for="item in cart" :key="item.id" class="cart-item">
              <div class="cart-item-info">
                <h4>{{ item.name }}</h4>
                <p>${{ item.price.toFixed(2) }} x {{ item.quantity }}</p>
              </div>
              <div class="cart-item-actions">
                <button class="qty-btn" @click="changeQty(item, -1)">-</button>
                <span class="qty-display">{{ item.quantity }}</span>
                <button class="qty-btn" @click="changeQty(item, 1)">+</button>
                <button class="remove-btn" @click="removeFromCart(item)">✕</button>
              </div>
            </div>
          </div>

          <div class="cart-summary">
            <div class="summary-row">
              <span>Items Subtotal:</span>
              <span>${{ cartSubtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Tax (5%):</span>
              <span>${{ cartTax.toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total Price:</span>
              <span>${{ cartTotal.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Checkout Form -->
          <div class="checkout-form">
            <h3>Checkout Information</h3>
            <div v-if="loggedInUser" class="auth-notice">
              <span>✓ Menggunakan profil aktif: <strong>{{ loggedInUser.name }}</strong></span>
            </div>
            <div class="form-group">
              <label for="checkout-name">Name</label>
              <input 
                id="checkout-name" 
                v-model="checkoutForm.name" 
                type="text" 
                placeholder="Enter your name" 
              />
            </div>
            <div class="form-group">
              <label for="checkout-email">Email</label>
              <input 
                id="checkout-email" 
                v-model="checkoutForm.email" 
                type="email" 
                placeholder="customer@example.com" 
              />
            </div>
            
            <button 
              class="btn-checkout" 
              :disabled="submittingOrder"
              @click="startPaymentFlow"
            >
              {{ submittingOrder ? 'Processing...' : 'Place Order Now' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Flow Modal -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h3>Simulasi Pembayaran (Payment Gateway)</h3>
          <button class="close-modal-btn" @click="showPaymentModal = false">✕</button>
        </div>

        <div class="modal-body-content" v-if="paymentProcessing">
          <div class="payment-loading-state">
            <div class="spinner"></div>
            <h4 class="payment-status-title">{{ paymentStatusText }}</h4>
            <p>Mohon jangan menutup jendela ini...</p>
          </div>
        </div>

        <div class="modal-body-content" v-else>
          <!-- Order Summary inside Modal -->
          <div class="payment-summary border-bottom">
            <h4>Ringkasan Pembayaran</h4>
            <div class="summary-details">
              <div class="summary-line">
                <span>Total Belanja ({{ cart.reduce((s, i) => s + i.quantity, 0) }} item):</span>
                <span class="price-highlight">${{ cartTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="payment-methods-section">
            <h4>Pilih Metode Pembayaran</h4>
            <div class="payment-tabs">
              <button 
                :class="['payment-tab-btn', { active: paymentMethod === 'card' }]" 
                @click="paymentMethod = 'card'"
              >
                💳 Kartu Kredit/Debit
              </button>
              <button 
                :class="['payment-tab-btn', { active: paymentMethod === 'ewallet' }]" 
                @click="paymentMethod = 'ewallet'"
              >
                📱 E-Wallet / QRIS
              </button>
              <button 
                :class="['payment-tab-btn', { active: paymentMethod === 'transfer' }]" 
                @click="paymentMethod = 'transfer'"
              >
                🏦 Virtual Account
              </button>
            </div>

            <!-- Tab Content: Card -->
            <div v-if="paymentMethod === 'card'" class="tab-pane-content">
              <div class="form-group-row">
                <div class="form-group col-12">
                  <label>Nomor Kartu</label>
                  <input type="text" v-model="cardInfo.number" placeholder="4111 2222 3333 4444" required />
                </div>
              </div>
              <div class="form-group-row">
                <div class="form-group col-6">
                  <label>Masa Berlaku (MM/YY)</label>
                  <input type="text" v-model="cardInfo.expiry" placeholder="12/29" required />
                </div>
                <div class="form-group col-6">
                  <label>CVV</label>
                  <input type="password" v-model="cardInfo.cvv" placeholder="•••" maxlength="3" required />
                </div>
              </div>
              <div class="form-group col-12 mt-2">
                <label>Nama Pemegang Kartu</label>
                <input type="text" v-model="cardInfo.name" placeholder="John Doe" />
              </div>
            </div>

            <!-- Tab Content: E-wallet -->
            <div v-if="paymentMethod === 'ewallet'" class="tab-pane-content text-center">
              <div class="qr-code-simulator">
                <span class="qr-emoji">🔳 QRIS</span>
                <p class="qr-desc">Scan QRIS menggunakan aplikasi pembayaran pilihan Anda (GoPay, OVO, Dana, dll.)</p>
              </div>
              <div class="form-group col-12">
                <label>Nomor Handphone Terdaftar</label>
                <input type="tel" v-model="ewalletPhone" placeholder="081234567890" required />
              </div>
            </div>

            <!-- Tab Content: Bank Transfer -->
            <div v-if="paymentMethod === 'transfer'" class="tab-pane-content">
              <div class="bank-va-details">
                <p>Transfer melalui Virtual Account Bank Mandiri / BCA:</p>
                <div class="va-number-box">
                  <code>8839029103921</code>
                </div>
                <p class="va-instructions">Total nominal transfer harus sesuai dengan ringkasan di atas demi verifikasi otomatis.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" v-if="!paymentProcessing">
          <button class="btn-secondary" @click="showPaymentModal = false">Batal</button>
          <button class="btn-primary" @click="handlePay">Bayar Sekarang & Tempatkan Pesanan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { showToast } from '../toast';
import { apiPost } from '../api';

export default {
  name: 'Storefront',
  setup() {
    const products = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const activeCategory = ref('All');
    const categories = ref(['All', 'Electronics', 'Sports', 'Accessories', 'Home & Living', 'Office']);
    
    // Cart state
    const cart = ref([]);
    const checkoutForm = ref({ name: '', email: '' });
    const submittingOrder = ref(false);

    // Payment Flow state
    const showPaymentModal = ref(false);
    const paymentMethod = ref('card');
    const cardInfo = ref({ number: '', expiry: '', cvv: '', name: '' });
    const ewalletPhone = ref('');
    const paymentStatusText = ref('');
    const paymentProcessing = ref(false);
    const loggedInUser = ref(null);

    const fetchProducts = async () => {
      loading.value = true;
      try {
        const res = await fetch('/api/v1/products');
        if (res.ok) {
          products.value = await res.json();
        } else {
          showToast('Failed to load products list', 'error');
        }
      } catch (err) {
        showToast('Network error loading products', 'error');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchProducts();
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        loggedInUser.value = user;
        checkoutForm.value.name = user.name || '';
        checkoutForm.value.email = user.email || '';
      }
    });

    const filteredProducts = computed(() => {
      return products.value.filter(p => {
        const matchesCategory = activeCategory.value === 'All' || p.category === activeCategory.value;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                              p.sku.toLowerCase().includes(searchQuery.value.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    });

    const truncateDesc = (text) => {
      if (text.length > 90) {
        return text.substring(0, 87) + '...';
      }
      return text;
    };

    // Cart operations
    const addToCart = (product) => {
      const existing = cart.value.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more. Limit of ${product.stock} available stock reached.`, 'warning');
          return;
        }
        existing.quantity += 1;
      } else {
        cart.value.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxStock: product.stock
        });
      }
      showToast(`${product.name} added to cart`, 'success');
    };

    const changeQty = (item, amount) => {
      const targetQty = item.quantity + amount;
      if (targetQty <= 0) {
        removeFromCart(item);
      } else if (targetQty > item.maxStock) {
        showToast(`Only ${item.maxStock} items available in stock.`, 'warning');
      } else {
        item.quantity = targetQty;
      }
    };

    const removeFromCart = (item) => {
      cart.value = cart.value.filter(i => i.id !== item.id);
      showToast(`${item.name} removed from cart`, 'warning');
    };

    const cartSubtotal = computed(() => {
      return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    });

    const cartTax = computed(() => {
      return cartSubtotal.value * 0.05;
    });

    const cartTotal = computed(() => {
      return cartSubtotal.value + cartTax.value;
    });

    const startPaymentFlow = () => {
      if (!checkoutForm.value.name || !checkoutForm.value.email) {
        showToast('Please fill in your name and email to checkout', 'warning');
        return;
      }
      showPaymentModal.value = true;
    };

    const handlePay = async () => {
      if (paymentMethod.value === 'card') {
        if (!cardInfo.value.number || !cardInfo.value.expiry || !cardInfo.value.cvv) {
          showToast('Please fill in all card details', 'warning');
          return;
        }
      } else if (paymentMethod.value === 'ewallet') {
        if (!ewalletPhone.value) {
          showToast('Please enter your digital wallet phone number', 'warning');
          return;
        }
      }

      paymentProcessing.value = true;
      paymentStatusText.value = 'Securing connection...';
      
      await new Promise(r => setTimeout(r, 800));
      paymentStatusText.value = 'Authorizing payment details...';
      
      await new Promise(r => setTimeout(r, 1000));
      paymentStatusText.value = 'Completing transaction...';
      
      await new Promise(r => setTimeout(r, 600));
      
      const success = await submitOrder();
      paymentProcessing.value = false;
      if (success) {
        showPaymentModal.value = false;
      }
    };

    const submitOrder = async () => {
      submittingOrder.value = true;
      try {
        const orderData = {
          customerName: checkoutForm.value.name,
          customerEmail: checkoutForm.value.email,
          items: cart.value.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: parseFloat(cartTotal.value.toFixed(2))
        };

        const response = await apiPost('/api/v1/orders', orderData);

        if (response.ok) {
          showToast('Payment successful & Order placed!', 'success');
          cart.value = [];
          const user = JSON.parse(localStorage.getItem('user'));
          if (user) {
            checkoutForm.value = { name: user.name, email: user.email };
          } else {
            checkoutForm.value = { name: '', email: '' };
          }
          await fetchProducts(); // Refresh products list to show new stock values
          return true;
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to place order', 'error');
          return false;
        }
      } catch (err) {
        showToast('Network error processing checkout', 'error');
        return false;
      } finally {
        submittingOrder.value = false;
      }
    };

    return {
      products,
      loading,
      searchQuery,
      activeCategory,
      categories,
      filteredProducts,
      truncateDesc,
      
      // Cart
      cart,
      addToCart,
      changeQty,
      removeFromCart,
      cartSubtotal,
      cartTax,
      cartTotal,
      checkoutForm,
      submittingOrder,
      submitOrder,

      // Payment Flow
      showPaymentModal,
      paymentMethod,
      cardInfo,
      ewalletPhone,
      paymentStatusText,
      paymentProcessing,
      loggedInUser,
      startPaymentFlow,
      handlePay
    };
  }
};
</script>

<style scoped>
.storefront-page {
  padding-bottom: 60px;
}

/* Hero Section */
.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
  padding: 40px;
}

.hero-content h1 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
}

.hero-content p {
  color: var(--text-secondary);
  font-size: 18px;
}

.hero-graphic {
  font-size: 64px;
}

/* Grid Layouts */
.storefront-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
}

.controls-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-box input {
  padding-left: 48px;
}

.categories-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.product-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  height: 100%;
}

.product-image-container {
  position: relative;
  height: 180px;
  background: #0f172a;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(15,23,42,0.85);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
}

.product-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.product-sku {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.product-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  flex-grow: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.product-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-add-cart {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.btn-add-cart:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
}

.stock-status {
  margin-top: 8px;
  font-size: 11px;
}

.low-stock-text {
  color: var(--color-warning);
}

.in-stock-text {
  color: var(--color-success);
}

/* Cart Panel */
.cart-panel {
  height: fit-content;
  position: sticky;
  top: 90px;
}

.cart-panel h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.cart-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.cart-empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.cart-item-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.cart-item-info p {
  font-size: 12px;
  color: var(--text-secondary);
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color);
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.qty-btn:hover {
  background: rgba(255,255,255,0.1);
}

.qty-display {
  font-size: 13px;
  width: 20px;
  text-align: center;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  padding: 4px;
}

.remove-btn:hover {
  color: var(--color-danger);
}

.cart-summary {
  margin-top: 20px;
  background: rgba(0,0,0,0.2);
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-row.total {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
  margin-top: 4px;
}

.checkout-form {
  margin-top: 24px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.checkout-form h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.btn-checkout {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background: var(--color-success);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.btn-checkout:hover {
  background: #059669;
  transform: translateY(-1px);
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.1);
  border-left-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
  .storefront-layout {
    grid-template-columns: 1fr;
  }
  
  .cart-panel {
    position: static;
  }
}

/* Auth autofill notice */
.auth-notice {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-success);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

/* Modal and Payment styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-content {
  max-width: 550px;
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
  animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
}

.close-modal-btn:hover {
  color: var(--text-primary);
}

.modal-body-content {
  padding: 24px;
  overflow-y: auto;
}

.payment-summary {
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.payment-summary.border-bottom {
  border-bottom: 1px solid var(--border-color);
}

.payment-summary h4, .payment-methods-section h4 {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.price-highlight {
  font-weight: 700;
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 16px;
}

.payment-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.payment-tab-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  padding: 10px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 11px;
  text-align: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.payment-tab-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tab-pane-content {
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: var(--radius-md);
  animation: fadeIn 0.2s ease;
}

.form-group-row {
  display: flex;
  gap: 12px;
}

.col-6 {
  flex: 1;
}

.col-12 {
  width: 100%;
}

.mt-2 {
  margin-top: 8px;
}

.qr-code-simulator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.qr-emoji {
  font-size: 32px;
  background: white;
  color: black;
  padding: 16px;
  border-radius: var(--radius-md);
  font-weight: bold;
}

.qr-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.bank-va-details {
  text-align: center;
}

.va-number-box {
  background: rgba(255,255,255,0.05);
  border: 1px dashed var(--color-primary);
  padding: 12px;
  border-radius: var(--radius-sm);
  margin: 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

.va-instructions {
  font-size: 11px;
  color: var(--text-muted);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.payment-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.payment-status-title {
  font-size: 16px;
  font-weight: 600;
  margin-top: 16px;
  color: var(--text-primary);
}

@keyframes modalIn {
  from { transform: translateY(30px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
