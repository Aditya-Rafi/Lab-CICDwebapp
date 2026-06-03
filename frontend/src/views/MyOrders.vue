<template>
  <div class="my-orders-view">
    <div class="view-header">
      <div>
        <h1>My Order History</h1>
        <p class="subtitle">Track your purchases and shipping status</p>
      </div>
      <button class="btn-primary" @click="fetchOrders" :disabled="loading">
        <span>🔄</span> Refresh Orders
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your orders...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="empty-state glass-card">
      <span class="empty-icon">📦</span>
      <h3>No Orders Found</h3>
      <p>You haven't placed any orders yet. Visit our storefront to buy awesome products!</p>
      <router-link to="/" class="btn-primary">Shop Now</router-link>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card glass-card">
        <div class="order-header">
          <div class="order-meta">
            <div>
              <span class="label">Order Number</span>
              <span class="val font-mono">{{ order.orderNumber }}</span>
            </div>
            <div>
              <span class="label">Date Placed</span>
              <span class="val">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div>
              <span class="label">Total Amount</span>
              <span class="val price">${{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
          <span :class="['badge', getStatusBadgeClass(order.status)]">
            {{ order.status }}
          </span>
        </div>

        <!-- Tracking Timeline -->
        <div class="tracking-timeline-container" v-if="order.status !== 'Cancelled'">
          <div class="timeline">
            <div class="timeline-progress" :style="{ width: getTimelineProgress(order.status) }"></div>
            <div 
              v-for="step in steps" 
              :key="step.name" 
              :class="['timeline-step', getStepClass(order.status, step.name)]"
            >
              <div class="step-circle">{{ step.icon }}</div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          </div>
        </div>

        <div class="cancelled-banner" v-else>
          <span class="cancel-icon">❌</span>
          <div>
            <h4>This order was cancelled</h4>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items">
          <h4>Items Ordered</h4>
          <div class="items-grid">
            <div v-for="item in order.items" :key="item.productId" class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-qty">Qty: {{ item.quantity }}</span>
              </div>
              <span class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { showToast } from '../toast';

export default {
  name: 'MyOrders',
  setup() {
    const orders = ref([]);
    const loading = ref(true);
    const user = JSON.parse(localStorage.getItem('user'));

    const steps = [
      { name: 'Pending', label: 'Pending', icon: '📝' },
      { name: 'Processing', label: 'Processing', icon: '⚙️' },
      { name: 'Shipped', label: 'Shipped', icon: '🚚' },
      { name: 'Delivered', label: 'Delivered', icon: '🎁' }
    ];

    const fetchOrders = async () => {
      if (!user) return;
      loading.value = true;
      try {
        const res = await fetch(`/api/v1/orders/customer?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          // Sort descending by date
          orders.value = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
          showToast('Failed to load orders history', 'error');
        }
      } catch (err) {
        showToast('Network error loading your orders', 'error');
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchOrders);

    const getStatusBadgeClass = (status) => {
      switch (status) {
        case 'Delivered': return 'badge-success';
        case 'Shipped': return 'badge-info';
        case 'Processing': return 'badge-warning';
        case 'Pending': return 'badge-warning';
        case 'Cancelled': return 'badge-danger';
        default: return 'badge-info';
      }
    };

    const getTimelineProgress = (status) => {
      switch (status) {
        case 'Pending': return '0%';
        case 'Processing': return '33.3%';
        case 'Shipped': return '66.6%';
        case 'Delivered': return '100%';
        default: return '0%';
      }
    };

    const getStepClass = (currentStatus, stepName) => {
      const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered'];
      const currentIndex = statusOrder.indexOf(currentStatus);
      const stepIndex = statusOrder.indexOf(stepName);

      if (stepIndex < currentIndex) {
        return 'completed';
      } else if (stepIndex === currentIndex) {
        return 'active';
      }
      return '';
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      orders,
      loading,
      steps,
      fetchOrders,
      getStatusBadgeClass,
      getTimelineProgress,
      getStepClass,
      formatDate
    };
  }
};
</script>

<style scoped>
.my-orders-view {
  padding-bottom: 40px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.view-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-state {
  text-align: center;
  padding: 120px 20px;
  color: var(--text-secondary);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(255,255,255,0.1);
  border-left-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  max-width: 600px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-icon {
  font-size: 50px;
}

.empty-state h3 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 15px;
  margin: 0 0 10px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.order-card {
  padding: 28px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 20px;
  margin-bottom: 24px;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.order-meta .label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.order-meta .val {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.order-meta .val.price {
  color: var(--color-accent);
}

/* Timeline Tracking */
.tracking-timeline-container {
  margin: 32px 0;
  padding: 0 20px;
}

.timeline {
  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.06);
  z-index: 1;
}

.timeline-progress {
  position: absolute;
  top: 20px;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  z-index: 2;
  transition: width 0.4s ease;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  position: relative;
}

.step-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.step-label {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
  transition: color 0.3s;
}

.timeline-step.active .step-circle {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.timeline-step.active .step-label {
  color: var(--text-primary);
  font-weight: 600;
}

.timeline-step.completed .step-circle {
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.timeline-step.completed .step-label {
  color: var(--color-success);
}

.cancelled-banner {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  margin: 24px 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.cancel-icon {
  font-size: 28px;
}

.cancelled-banner h4 {
  margin: 0 0 4px 0;
  color: #ef4444;
  font-size: 15px;
}

.cancelled-banner p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* Order Items */
.order-items {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
  margin-top: 20px;
}

.order-items h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.01);
  border-radius: var(--radius-sm);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-name {
  color: var(--text-primary);
  font-weight: 500;
}

.item-qty {
  color: var(--text-muted);
  font-size: 12px;
  background: rgba(255,255,255,0.04);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.item-price {
  font-weight: 600;
  color: var(--text-secondary);
}

@media (max-width: 576px) {
  .order-meta {
    gap: 16px;
  }
  .step-label {
    font-size: 11px;
  }
  .step-circle {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }
}
</style>
