<template>
  <div class="dashboard-view">
    <div class="view-header">
      <div>
        <h1>Dashboard Overview</h1>
        <p class="subtitle">E-Commerce operations and performance metrics</p>
      </div>
      <button class="btn-primary" @click="fetchAnalytics">
        <span>🔄</span> Refresh Data
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching latest operational telemetry...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-grid">
      <!-- 1. Stats Summary Cards -->
      <section class="stats-row">
        <!-- Revenue Card -->
        <div class="stat-card glass-card">
          <div class="stat-icon revenue">💰</div>
          <div class="stat-details">
            <span class="stat-label">Total Revenue</span>
            <h2 class="stat-val">${{ stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</h2>
            <p class="stat-trend green">↑ 12.4% vs last month</p>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="stat-card glass-card">
          <div class="stat-icon orders">🛒</div>
          <div class="stat-details">
            <span class="stat-label">Total Orders</span>
            <h2 class="stat-val">{{ stats.totalOrders }}</h2>
            <p class="stat-trend green">↑ 8.2% vs last month</p>
          </div>
        </div>

        <!-- Customers Card -->
        <div class="stat-card glass-card">
          <div class="stat-icon customers">👥</div>
          <div class="stat-details">
            <span class="stat-label">Active Customers</span>
            <h2 class="stat-val">{{ stats.activeCustomers }}</h2>
            <p class="stat-trend green">↑ 5.6% vs last week</p>
          </div>
        </div>

        <!-- Stockout Card -->
        <div class="stat-card glass-card">
          <div class="stat-icon stockout">⚠️</div>
          <div class="stat-details">
            <span class="stat-label">Out of Stock Items</span>
            <h2 class="stat-val" :class="{ 'text-danger': stats.outOfStockProducts > 0 }">
              {{ stats.outOfStockProducts }}
            </h2>
            <p class="stat-trend" :class="stats.outOfStockProducts > 0 ? 'red' : 'muted'">
              {{ stats.outOfStockProducts > 0 ? 'Requires attention!' : 'Inventory healthy' }}
            </p>
          </div>
        </div>
      </section>

      <!-- 2. SVG Line Chart & Low Stock Alerts -->
      <div class="insights-row">
        <!-- SVG Line Chart Card -->
        <div class="chart-card glass-card">
          <div class="chart-header">
            <h3>Sales Distribution Trend</h3>
            <span class="badge badge-info">Monthly Interval</span>
          </div>
          
          <div class="chart-wrapper">
            <svg class="line-chart" viewBox="0 0 500 220" preserveAspectRatio="none">
              <!-- Grid lines -->
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.05)" />

              <!-- Chart Path -->
              <path 
                :d="chartPath" 
                fill="none" 
                stroke="url(#chartGradient)" 
                stroke-width="3" 
                stroke-linecap="round" 
              />

              <!-- Area under path -->
              <path 
                :d="chartAreaPath" 
                fill="url(#areaGradient)" 
                stroke="none" 
              />

              <!-- Chart Points -->
              <circle 
                v-for="(point, idx) in chartPoints" 
                :key="idx"
                :cx="point.x" 
                :cy="point.y" 
                r="5" 
                fill="#3b82f6" 
                stroke="#fff" 
                stroke-width="1.5"
                class="chart-circle"
              />

              <!-- X-Axis text -->
              <text 
                v-for="(point, idx) in chartPoints" 
                :key="'t-' + idx"
                :x="point.x" 
                y="195" 
                text-anchor="middle" 
                fill="#94a3b8" 
                font-size="10"
              >
                {{ point.label }}
              </text>

              <!-- Values display -->
              <text 
                v-for="(point, idx) in chartPoints" 
                :key="'v-' + idx"
                :x="point.x" 
                :y="point.y - 12" 
                text-anchor="middle" 
                fill="#f8fafc" 
                font-size="9"
                font-weight="600"
              >
                ${{ point.val }}
              </text>

              <!-- Gradients Definition -->
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#3b82f6" />
                  <stop offset="100%" stop-color="#6366f1" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(59, 130, 246, 0.25)" />
                  <stop offset="100%" stop-color="rgba(99, 102, 241, 0.0)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="alerts-card glass-card">
          <h3>Low Stock Alerts</h3>
          <p class="card-subtitle">Items with less than 5 units remaining</p>
          
          <div v-if="stats.lowStockAlerts.length === 0" class="alerts-empty">
            <span class="shield-check">✓</span>
            <p>All product levels are healthy. No alerts!</p>
          </div>

          <div v-else class="alerts-list">
            <div 
              v-for="item in stats.lowStockAlerts" 
              :key="item.id" 
              class="alert-item"
            >
              <div class="alert-info">
                <span class="warning-triangle">⚠️</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <span class="stock-count badge badge-warning">
                Only {{ item.stock }} left
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Warehouse & Shipping Conditions -->
      <div class="conditions-row">
        <!-- Warehouse Stock Condition -->
        <div class="condition-card glass-card">
          <h3>Warehouse Inventory Condition</h3>
          <p class="card-subtitle">Current stock metrics in storage</p>
          <div class="condition-metrics">
            <div class="metric-item">
              <span class="metric-number">{{ stats.warehouseStatus?.totalStock || 0 }}</span>
              <span class="metric-label">Total Units in Stock</span>
            </div>
            <div class="metric-item">
              <span class="metric-number text-warning">{{ stats.warehouseStatus?.lowStockCount || 0 }}</span>
              <span class="metric-label">Low Stock Items</span>
            </div>
            <div class="metric-item">
              <span class="metric-number text-danger">{{ stats.warehouseStatus?.outOfStockCount || 0 }}</span>
              <span class="metric-label">Out of Stock Items</span>
            </div>
          </div>
        </div>

        <!-- Shipping Status Condition -->
        <div class="condition-card glass-card">
          <h3>Shipping Status Tracker</h3>
          <p class="card-subtitle">Active fulfillment pipeline stages</p>
          <div class="shipping-grid">
            <div class="ship-status-item">
              <span class="status-name"><span class="status-icon">⏳</span>Pending</span>
              <span class="badge badge-warning">{{ stats.shippingStatus?.pending || 0 }}</span>
            </div>
            <div class="ship-status-item">
              <span class="status-name"><span class="status-icon">⚙️</span>Processing</span>
              <span class="badge badge-warning">{{ stats.shippingStatus?.processing || 0 }}</span>
            </div>
            <div class="ship-status-item">
              <span class="status-name"><span class="status-icon">🚚</span>Shipped</span>
              <span class="badge badge-info">{{ stats.shippingStatus?.shipped || 0 }}</span>
            </div>
            <div class="ship-status-item">
              <span class="status-name"><span class="status-icon">🎁</span>Delivered</span>
              <span class="badge badge-success">{{ stats.shippingStatus?.delivered || 0 }}</span>
            </div>
            <div class="ship-status-item">
              <span class="status-name"><span class="status-icon">❌</span>Cancelled</span>
              <span class="badge badge-danger">{{ stats.shippingStatus?.cancelled || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Popular/Trending Products -->
        <div class="condition-card glass-card">
          <h3>Top Trending Products</h3>
          <p class="card-subtitle">Best-selling items by ordered quantity</p>
          <div v-if="!stats.trendingProducts || stats.trendingProducts.length === 0" class="alerts-empty">
            <p>No sales data yet.</p>
          </div>
          <div v-else class="trending-list">
            <div v-for="(p, index) in stats.trendingProducts" :key="p.id" class="trending-item">
              <div class="trending-info">
                <span class="trending-rank">#{{ index + 1 }}</span>
                <div>
                  <p class="trending-name">{{ p.name }}</p>
                  <p class="trending-sku">{{ p.sku }}</p>
                </div>
              </div>
              <span class="trending-qty badge badge-info">
                {{ p.orderedQuantity }} Ordered
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Recent Transactions -->
      <section class="recent-orders glass-card">
        <div class="section-header">
          <h3>Recent Orders</h3>
          <router-link to="/admin/orders" class="view-all-link">
            View All Orders →
          </router-link>
        </div>

        <div v-if="recentOrders.length === 0" class="empty-table">
          <p>No transactions recorded yet.</p>
        </div>

        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td><code>{{ order.orderNumber }}</code></td>
                <td>
                  <div class="customer-info">
                    <p class="cust-name">{{ order.customerName }}</p>
                    <p class="cust-email">{{ order.customerEmail }}</p>
                  </div>
                </td>
                <td class="amount-cell">${{ order.totalAmount.toFixed(2) }}</td>
                <td>
                  <span :class="['badge', getStatusBadge(order.status)]">
                    {{ order.status }}
                  </span>
                </td>
                <td>{{ formatDate(order.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { showToast } from '../toast';

export default {
  name: 'Dashboard',
  setup() {
    const loading = ref(true);
    const stats = ref({
      totalRevenue: 0,
      totalOrders: 0,
      activeCustomers: 0,
      outOfStockProducts: 0,
      lowStockAlerts: [],
      monthlySales: [],
      warehouseStatus: { totalStock: 0, lowStockCount: 0, outOfStockCount: 0 },
      shippingStatus: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
      trendingProducts: []
    });
    const recentOrders = ref([]);

    const fetchAnalytics = async () => {
      loading.value = true;
      try {
        const statsRes = await fetch('/api/v1/analytics');
        if (statsRes.ok) {
          stats.value = await statsRes.json();
        } else {
          showToast('Failed to load dashboard metrics', 'error');
        }

        const ordersRes = await fetch('/api/v1/orders');
        if (ordersRes.ok) {
          const allOrders = await ordersRes.json();
          // Sort descending by date, slice top 5
          recentOrders.value = allOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        }
      } catch (err) {
        showToast('Network error loading admin telemetry', 'error');
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchAnalytics);

    // Compute SVG lines
    const chartPoints = computed(() => {
      const data = stats.value.monthlySales || [];
      if (data.length === 0) return [];
      
      const width = 500;
      const height = 220;
      const paddingX = 40;
      const paddingY = 30;
      
      const chartWidth = width - paddingX * 2;
      const chartHeight = height - paddingY * 2;

      // Find max sales to scale Y
      const maxSales = Math.max(...data.map(d => d.sales), 1000);
      
      return data.map((d, idx) => {
        const x = paddingX + (idx / (data.length - 1)) * chartWidth;
        const y = height - paddingY - (d.sales / maxSales) * chartHeight;
        return {
          x,
          y,
          label: d.month,
          val: d.sales
        };
      });
    });

    const chartPath = computed(() => {
      const pts = chartPoints.value;
      if (pts.length === 0) return '';
      return pts.reduce((acc, p, idx) => {
        if (idx === 0) return `M ${p.x} ${p.y}`;
        return `${acc} L ${p.x} ${p.y}`;
      }, '');
    });

    const chartAreaPath = computed(() => {
      const pts = chartPoints.value;
      if (pts.length === 0) return '';
      const startX = pts[0].x;
      const endX = pts[pts.length - 1].x;
      const bottomY = 190; // Align with chart bounds
      return `${chartPath.value} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
    });

    const getStatusBadge = (status) => {
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
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      loading,
      stats,
      recentOrders,
      chartPoints,
      chartPath,
      chartAreaPath,
      fetchAnalytics,
      getStatusBadge,
      formatDate
    };
  }
};
</script>

<style scoped>
.dashboard-view {
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

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
}

.stat-details {
  flex-grow: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.05em;
  display: block;
}

.stat-val {
  font-size: 24px;
  font-weight: 700;
  margin: 2px 0 4px;
  color: var(--text-primary);
}

.stat-trend {
  font-size: 11px;
}

.stat-trend.green {
  color: var(--color-success);
}

.stat-trend.red {
  color: var(--color-danger);
}

.stat-trend.muted {
  color: var(--text-muted);
}

.text-danger {
  color: var(--color-danger) !important;
}

/* Insights layout */
.insights-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-wrapper {
  flex-grow: 1;
  min-height: 200px;
}

.line-chart {
  width: 100%;
  height: 200px;
  overflow: visible;
}

.chart-circle {
  transition: r 0.2s ease;
}

.chart-circle:hover {
  r: 7;
}

/* Alert list */
.alerts-card {
  display: flex;
  flex-direction: column;
}

.card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 2px 0 16px;
}

.alerts-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  flex-grow: 1;
  color: var(--text-secondary);
}

.shield-check {
  font-size: 36px;
  color: var(--color-success);
  margin-bottom: 8px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-md);
}

.alert-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  max-width: 70%;
}

.item-name {
  font-weight: 500;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* Recent orders section */
.recent-orders {
  margin-top: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.view-all-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

.customer-info {
  line-height: 1.3;
}

.cust-name {
  font-weight: 600;
}

.cust-email {
  font-size: 11px;
  color: var(--text-muted);
}

.amount-cell {
  font-weight: 700;
  font-family: var(--font-mono);
}

.empty-table {
  text-align: center;
  padding: 40px;
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

@media (max-width: 992px) {
  .insights-row {
    grid-template-columns: 1fr;
  }
}

/* Conditions Row Styles */
.conditions-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.condition-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.condition-metrics {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-grow: 1;
  padding: 10px 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.metric-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

/* Shipping Grid */
.shipping-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
  justify-content: center;
  margin-top: 8px;
}

.ship-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.status-icon {
  font-size: 16px;
  margin-right: 8px;
}

.status-name {
  flex-grow: 1;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
}

/* Trending List */
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
  justify-content: center;
  margin-top: 8px;
}

.trending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.trending-info {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 70%;
}

.trending-rank {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-accent);
}

.trending-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trending-sku {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

</style>
