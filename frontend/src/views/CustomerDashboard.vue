<template>
  <div class="customer-dashboard">
    <!-- Welcome Header -->
    <header class="dashboard-header glass-card">
      <div class="welcome-section">
        <span class="user-avatar">👤</span>
        <div>
          <h1>Halo, {{ user?.name || 'Pelanggan' }}! 👋</h1>
          <p class="subtitle">Selamat datang kembali di panel personalisasi Anda. Pantau pesanan dan pengiriman Anda di sini.</p>
        </div>
      </div>
      <div class="badge badge-success membership-badge">{{ memberLevel }} Member</div>
    </header>

    <!-- Stats Section -->
    <section class="stats-row" v-if="!loading">
      <div class="stat-card glass-card">
        <div class="stat-icon font-emoji">🛍️</div>
        <div class="stat-details">
          <span class="stat-label">Total Pesanan</span>
          <h2 class="stat-val">{{ orders.length }}</h2>
          <p class="stat-subtitle">Semua transaksi Anda</p>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-icon font-emoji">🚚</div>
        <div class="stat-details">
          <span class="stat-label">Pesanan Aktif</span>
          <h2 class="stat-val">{{ activeOrdersCount }}</h2>
          <p class="stat-subtitle">Sedang dalam proses/pengiriman</p>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-icon font-emoji">💰</div>
        <div class="stat-details">
          <span class="stat-label">Total Belanja</span>
          <h2 class="stat-val">${{ totalSpent.toFixed(2) }}</h2>
          <p class="stat-subtitle">Investasi produk berkualitas</p>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat data dashboard Anda...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="empty-state glass-card">
      <span class="empty-icon">🎒</span>
      <h3>Belum Ada Pesanan</h3>
      <p>Anda belum melakukan pemesanan apapun. Temukan produk premium di storefront kami!</p>
      <router-link to="/" class="btn-primary">Mulai Belanja 🛍️</router-link>
    </div>

    <!-- Active Orders Tracking & Recent Orders -->
    <div v-else class="dashboard-content-grid">
      <!-- Active / Recent Orders Tracker -->
      <section class="orders-section glass-card">
        <div class="section-header">
          <h3>Pelacakan Pesanan Terbaru</h3>
          <router-link to="/my-orders" class="view-all-link">Lihat Semua Pesanan →</router-link>
        </div>

        <div class="recent-orders-list">
          <div v-for="order in recentOrders" :key="order.id" class="recent-order-item">
            <div class="order-meta-info">
              <div>
                <span class="meta-label">Nomor Pesanan</span>
                <span class="meta-val font-mono">{{ order.orderNumber }}</span>
              </div>
              <div>
                <span class="meta-label">Tanggal Pembelian</span>
                <span class="meta-val">{{ formatDate(order.createdAt) }}</span>
              </div>
              <div>
                <span class="meta-label">Total Pembayaran</span>
                <span class="meta-val amount">${{ order.totalAmount.toFixed(2) }}</span>
              </div>
              <span :class="['badge', getStatusBadgeClass(order.status)]">
                {{ translateStatus(order.status) }}
              </span>
            </div>

            <!-- Mini Tracking Timeline -->
            <div class="tracking-timeline-mini" v-if="order.status !== 'Cancelled'">
              <div class="timeline-bar">
                <div class="timeline-fill" :style="{ width: getTimelineProgress(order.status) }"></div>
              </div>
              <div class="timeline-steps">
                <div 
                  v-for="step in steps" 
                  :key="step.name"
                  :class="['step-point', getStepClass(order.status, step.name)]"
                >
                  <div class="step-dot"></div>
                  <span class="step-text">{{ step.label }}</span>
                </div>
              </div>
            </div>

            <div class="cancelled-banner-mini" v-else>
              <span>❌ Pesanan ini telah dibatalkan</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Account / Profile Personalization -->
      <section class="profile-card glass-card">
        <h3>Profil & Informasi Akun</h3>
        <p class="profile-desc">Detail akun terdaftar Anda untuk pengiriman otomatis.</p>
        
        <div class="profile-details-list">
          <div class="profile-field">
            <span class="field-label">Nama Lengkap</span>
            <span class="field-value">{{ user?.name }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">Alamat Email</span>
            <span class="field-value">{{ user?.email }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">ID Akun</span>
            <span class="field-value font-mono">{{ user?.id }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">Status Keanggotaan</span>
            <span class="field-value membership-highlight">{{ memberLevel }} Member</span>
          </div>
        </div>

        <div class="profile-actions">
          <router-link to="/" class="btn-primary w-100 text-center">Beli Produk Lagi 🛒</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { showToast } from '../toast';
import { apiGet } from '../api';

export default {
  name: 'CustomerDashboard',
  setup() {
    const orders = ref([]);
    const loading = ref(true);
    const user = ref(JSON.parse(localStorage.getItem('user')));

    const steps = [
      { name: 'Pending', label: 'Menunggu' },
      { name: 'Processing', label: 'Dipacking' },
      { name: 'Shipped', label: 'Dikirim' },
      { name: 'Delivered', label: 'Sampai' }
    ];

    const fetchOrders = async () => {
      if (!user.value) return;
      loading.value = true;
      try {
        const res = await apiGet(`/api/v1/orders/customer?email=${encodeURIComponent(user.value.email)}`);
        if (res.ok) {
          const data = await res.json();
          orders.value = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
          showToast('Gagal memuat histori pesanan', 'error');
        }
      } catch (err) {
        showToast('Kesalahan jaringan memuat pesanan', 'error');
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchOrders);

    const activeOrdersCount = computed(() => {
      return orders.value.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length;
    });

    const totalSpent = computed(() => {
      return orders.value
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    });

    const memberLevel = computed(() => {
      const spent = totalSpent.value;
      if (spent >= 1000) return 'Gold';
      if (spent >= 300) return 'Silver';
      return 'Bronze';
    });

    const recentOrders = computed(() => {
      return orders.value.slice(0, 3);
    });

    const translateStatus = (status) => {
      switch (status) {
        case 'Pending': return 'Menunggu Pembayaran';
        case 'Processing': return 'Dipacking';
        case 'Shipped': return 'Dikirim';
        case 'Delivered': return 'Sampai';
        case 'Cancelled': return 'Dibatalkan';
        default: return status;
      }
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
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return {
      user,
      orders,
      loading,
      steps,
      activeOrdersCount,
      totalSpent,
      memberLevel,
      recentOrders,
      translateStatus,
      getStatusBadgeClass,
      getTimelineProgress,
      getStepClass,
      formatDate
    };
  }
};
</script>

<style scoped>
.customer-dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
}

.welcome-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  font-size: 48px;
  background: rgba(255,255,255,0.05);
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border-color);
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.membership-badge {
  font-size: 13px;
  padding: 8px 16px;
  letter-spacing: 0.05em;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
}

/* Stats cards layout */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
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
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  display: block;
}

.stat-val {
  font-size: 28px;
  font-weight: 700;
  margin: 2px 0 4px;
  color: var(--text-primary);
}

.stat-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

/* Dashboard main content grid */
.dashboard-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.orders-section {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 700;
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

.recent-orders-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.recent-order-item {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
}

.order-meta-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  padding-bottom: 16px;
}

.meta-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 2px;
}

.meta-val {
  font-size: 13px;
  font-weight: 600;
}

.meta-val.amount {
  color: var(--color-accent);
}

/* Timeline design */
.tracking-timeline-mini {
  margin-top: 20px;
  padding: 0 10px;
}

.timeline-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  position: relative;
  margin-bottom: 12px;
}

.timeline-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.timeline-steps {
  display: flex;
  justify-content: space-between;
}

.step-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid var(--border-color);
  margin-top: -17px;
  z-index: 10;
  transition: all 0.3s;
}

.step-text {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
  font-weight: 500;
}

.step-point.active .step-dot {
  border-color: var(--color-primary);
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
}

.step-point.active .step-text {
  color: var(--text-primary);
  font-weight: 600;
}

.step-point.completed .step-dot {
  border-color: var(--color-success);
  background: var(--color-success);
}

.step-point.completed .step-text {
  color: var(--color-success);
}

.cancelled-banner-mini {
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-danger);
  font-weight: 500;
}

/* Profile Card Styling */
.profile-card {
  height: fit-content;
}

.profile-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.profile-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.profile-details-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.profile-field {
  display: flex;
  flex-direction: column;
  border-bottom: 1px dashed rgba(255,255,255,0.04);
  padding-bottom: 12px;
}

.profile-field:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.field-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.membership-highlight {
  color: var(--color-success);
}

.text-center {
  text-align: center;
}

.w-100 {
  width: 100%;
}

.loading-state {
  text-align: center;
  padding: 100px 20px;
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

.empty-state {
  text-align: center;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-icon {
  font-size: 48px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  color: var(--text-secondary);
  max-width: 450px;
  font-size: 14px;
}

@media (max-width: 992px) {
  .dashboard-content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
