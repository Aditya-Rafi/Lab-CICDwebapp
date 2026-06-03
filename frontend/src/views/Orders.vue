<template>
  <div class="orders-view">
    <div class="view-header">
      <div>
        <h1>Orders Tracker</h1>
        <p class="subtitle">Process purchases, examine items details, and manage customer shipments</p>
      </div>
      <button class="btn-primary" @click="fetchOrders">
        <span>🔄</span> Refresh Orders
      </button>
    </div>

    <!-- Controls Row -->
    <div class="controls-card glass-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by customer name, email, or order number..." 
        />
      </div>

      <div class="filter-group">
        <span class="filter-label">Status:</span>
        <select v-model="selectedStatus">
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Retrieving transaction database...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrders.length === 0" class="empty-state glass-card">
      <p>No orders found matching your search parameters.</p>
    </div>

    <!-- Orders Table -->
    <div v-else class="table-card glass-card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer details</th>
              <th>Total Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Purchase Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td><code class="order-code">{{ order.orderNumber }}</code></td>
              <td>
                <div class="customer-cell">
                  <p class="name">{{ order.customerName }}</p>
                  <p class="email">{{ order.customerEmail }}</p>
                </div>
              </td>
              <td>{{ getItemsCount(order) }} items</td>
              <td class="amount-cell">${{ order.totalAmount.toFixed(2) }}</td>
              <td>
                <span :class="['badge', getStatusBadgeClass(order.status)]">
                  {{ order.status }}
                </span>
              </td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>
                <div class="actions-cell">
                  <button class="btn-detail" @click="viewDetails(order)">
                    🔍 Details
                  </button>
                  <select 
                    :value="order.status" 
                    @change="updateStatus(order.id, $event.target.value)"
                    class="status-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h3>Order Details: <code>{{ selectedOrder?.orderNumber }}</code></h3>
          <button class="close-modal-btn" @click="showDetailModal = false">✕</button>
        </div>

        <div class="modal-body-content">
          <!-- Customer info -->
          <div class="modal-section border-bottom">
            <h4>Customer Information</h4>
            <div class="info-grid">
              <div>
                <p class="label">Name</p>
                <p class="value">{{ selectedOrder?.customerName }}</p>
              </div>
              <div>
                <p class="label">Email Address</p>
                <p class="value">{{ selectedOrder?.customerEmail }}</p>
              </div>
              <div>
                <p class="label">Purchase Date</p>
                <p class="value">{{ formatDate(selectedOrder?.createdAt) }}</p>
              </div>
              <div>
                <p class="label">Current Status</p>
                <span :class="['badge', getStatusBadgeClass(selectedOrder?.status)]">
                  {{ selectedOrder?.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Items list -->
          <div class="modal-section">
            <h4>Purchased Items</h4>
            <div class="items-list">
              <div v-for="(item, idx) in selectedOrder?.items" :key="idx" class="item-row">
                <div class="item-name-col">
                  <p class="title">{{ item.name }}</p>
                  <p class="id-text">ID: <code>{{ item.productId }}</code></p>
                </div>
                <div class="item-qty-col">
                  <span>{{ item.quantity }} x ${{ item.price.toFixed(2) }}</span>
                </div>
                <div class="item-subtotal-col">
                  <span>${{ (item.quantity * item.price).toFixed(2) }}</span>
                </div>
              </div>
            </div>
            
            <div class="total-row">
              <span>Order Grand Total:</span>
              <span class="total-val">${{ selectedOrder?.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showDetailModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { showToast } from '../toast';

export default {
  name: 'Orders',
  setup() {
    const orders = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const selectedStatus = ref('All');
    
    // Modal state
    const showDetailModal = ref(false);
    const selectedOrder = ref(null);

    const fetchOrders = async () => {
      loading.value = true;
      try {
        const res = await fetch('/api/v1/orders');
        if (res.ok) {
          orders.value = await res.json();
        } else {
          showToast('Failed to retrieve orders database', 'error');
        }
      } catch (err) {
        showToast('Network error loading orders', 'error');
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchOrders);

    const filteredOrders = computed(() => {
      return orders.value.filter(o => {
        const matchesStatus = selectedStatus.value === 'All' || o.status === selectedStatus.value;
        const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                              o.customerEmail.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                              o.orderNumber.toLowerCase().includes(searchQuery.value.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    });

    const getItemsCount = (order) => {
      if (!order.items) return 0;
      return order.items.reduce((sum, item) => sum + item.quantity, 0);
    };

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

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const viewDetails = (order) => {
      selectedOrder.value = order;
      showDetailModal.value = true;
    };

    const updateStatus = async (orderId, newStatus) => {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
          showToast(`Order status updated to ${newStatus}`, 'success');
          // Update local state reactively
          const index = orders.value.findIndex(o => o.id === orderId);
          if (index !== -1) {
            orders.value[index].status = newStatus;
          }
          if (selectedOrder.value && selectedOrder.value.id === orderId) {
            selectedOrder.value.status = newStatus;
          }
        } else {
          showToast('Failed to update order status', 'error');
        }
      } catch (err) {
        showToast('Network error updating status', 'error');
      }
    };

    return {
      orders,
      loading,
      searchQuery,
      selectedStatus,
      filteredOrders,
      showDetailModal,
      selectedOrder,
      getItemsCount,
      getStatusBadgeClass,
      formatDate,
      viewDetails,
      updateStatus
    };
  }
};
</script>

<style scoped>
.orders-view {
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

/* Controls card */
.controls-card {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 20px;
  margin-bottom: 24px;
  align-items: center;
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

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Table card */
.table-card {
  padding: 0;
  overflow: hidden;
}

.order-code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-accent);
}

.customer-cell {
  line-height: 1.3;
}

.customer-cell .name {
  font-weight: 600;
  color: var(--text-primary);
}

.customer-cell .email {
  font-size: 11px;
  color: var(--text-muted);
}

.amount-cell {
  font-weight: 700;
  font-family: var(--font-mono);
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-detail {
  background: rgba(255,255,255,0.05);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.btn-detail:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}

.status-select {
  width: auto;
  padding: 6px 12px;
  font-size: 13px;
  background: rgba(15,23,42,0.8);
}

/* Modal Styling */
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
  max-width: 650px;
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

.modal-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.modal-section.border-bottom {
  border-bottom: 1px solid var(--border-color);
}

.modal-section h4 {
  font-size: 14px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 16px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-grid .label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.info-grid .value {
  font-size: 14px;
  font-weight: 500;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color);
}

.item-row:last-child {
  border-bottom: none;
}

.item-name-col {
  max-width: 60%;
}

.item-name-col .title {
  font-size: 14px;
  font-weight: 600;
}

.item-name-col .id-text {
  font-size: 11px;
  color: var(--text-muted);
}

.item-qty-col {
  font-size: 13px;
  color: var(--text-secondary);
}

.item-subtotal-col {
  font-weight: 700;
  font-family: var(--font-mono);
  font-size: 14px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  background: rgba(255,255,255,0.03);
  padding: 16px;
  border-radius: var(--radius-md);
  font-weight: 700;
}

.total-val {
  font-size: 18px;
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

@keyframes modalIn {
  from { transform: translateY(30px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
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

@media (max-width: 768px) {
  .controls-card {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
