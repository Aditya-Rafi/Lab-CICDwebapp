<template>
  <div class="app-layout">
    <!-- Toasts Notifications -->
    <div class="toasts-wrapper">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast-item', toast.type]"
      >
        <span class="toast-icon">
          <svg v-if="toast.type === 'success'" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg>
          <svg v-else width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>
        </span>
        <span class="toast-text">{{ toast.message }}</span>
      </div>
    </div>

    <!-- Navigation structure -->
    <div class="main-wrapper" :class="{ 'admin-mode': isAdminPage }">
      <!-- Admin Sidebar -->
      <aside v-if="isAdminPage" class="admin-sidebar glass-card">
        <div class="brand-section">
          <div class="logo">
            <span class="logo-icon">🚀</span>
            <span class="logo-text">BeliAja<span class="highlight">.com</span></span>
          </div>
          <span class="badge badge-info">Admin Console</span>
        </div>

        <nav class="sidebar-nav">
          <router-link to="/admin" class="nav-item" exact-active-class="active">
            <span class="nav-icon">📊</span> Dashboard
          </router-link>
          <router-link to="/admin/products" class="nav-item" active-class="active">
            <span class="nav-icon">📦</span> Products CRUD
          </router-link>
          <router-link to="/admin/orders" class="nav-item" active-class="active">
            <span class="nav-icon">🛒</span> Orders Tracker
          </router-link>
          <router-link to="/admin/system" class="nav-item" active-class="active">
            <span class="nav-icon">⚙️</span> System Version
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <router-link to="/" class="storefront-link">
            <span>👈</span> Back to Storefront
          </router-link>
          <div class="version-info">
            <p>System Version: <code>v1.0.0</code></p>
            <p class="status-indicator"><span class="dot green"></span> Running Stable</p>
          </div>
        </div>
      </aside>

      <!-- Storefront Navbar -->
      <header v-else class="storefront-header">
        <div class="header-container">
          <router-link to="/" class="logo">
            <span class="logo-icon">🛍️</span>
            <span class="logo-text">BeliAja<span class="highlight">.com</span></span>
          </router-link>
          
          <nav class="header-nav">
            <router-link to="/" class="header-nav-item" active-class="active">Storefront</router-link>
            
            <template v-if="user">
              <router-link to="/dashboard" class="header-nav-item" active-class="active">Dashboard</router-link>
              <router-link to="/my-orders" class="header-nav-item" active-class="active">My Orders</router-link>
              <span class="user-display">👤 {{ user.name }}</span>
              <button class="btn-logout" @click="handleLogout">Logout</button>
            </template>
            <template v-else>
              <router-link to="/login" class="header-nav-item" active-class="active">Login</router-link>
              <router-link to="/register" class="header-nav-item" active-class="active">Register</router-link>
            </template>

            <router-link to="/admin" class="header-nav-item admin-button">Admin Panel ⚙️</router-link>
          </nav>
        </div>
      </header>

      <!-- Main View Content -->
      <main class="content-container">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toasts } from './toast';

export default {
  name: 'App',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const user = ref(null);

    const checkUser = () => {
      user.value = JSON.parse(localStorage.getItem('user'));
    };

    const handleLogout = () => {
      localStorage.removeItem('user');
      checkUser();
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    };
    
    // Check if the current route is part of the admin panel
    const isAdminPage = computed(() => {
      return route.path.startsWith('/admin');
    });

    onMounted(() => {
      checkUser();
      window.addEventListener('auth-change', checkUser);
    });

    onUnmounted(() => {
      window.removeEventListener('auth-change', checkUser);
    });

    return {
      toasts,
      isAdminPage,
      user,
      handleLogout
    };
  }
};
</script>


<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-wrapper.admin-mode {
  flex-direction: row;
}

/* Sidebar Styling */
.admin-sidebar {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  position: sticky;
  top: 0;
  border-radius: 0;
  border-top: none;
  border-bottom: none;
  border-left: none;
  display: flex;
  flex-direction: column;
  padding: 32px 24px;
  background: rgba(15, 23, 42, 0.8);
}

.brand-section {
  margin-bottom: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.logo-text {
  letter-spacing: -0.5px;
}

.highlight {
  color: var(--color-primary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.15));
  color: var(--text-primary);
  border-left: 3px solid var(--color-primary);
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
}

.storefront-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 16px;
  transition: color 0.2s;
}

.storefront-link:hover {
  color: var(--color-primary);
}

.version-info {
  font-size: 12px;
  color: var(--text-muted);
}

.version-info code {
  color: var(--color-accent);
  font-family: var(--font-mono);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.green {
  background-color: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
}

/* Storefront Header */
.storefront-header {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-nav-item {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  transition: color 0.2s;
}

.header-nav-item:hover, .header-nav-item.active {
  color: var(--text-primary);
}

.admin-button {
  padding: 8px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.admin-button:hover {
  background: rgba(255,255,255,0.1);
}

/* Content Container */
.content-container {
  flex-grow: 1;
  padding: 40px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  min-height: 100vh;
}

.admin-mode .content-container {
  max-width: none;
  margin: 0;
}

@media (max-width: 768px) {
  .main-wrapper.admin-mode {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 20px;
  }
  
  .content-container {
    padding: 20px;
  }
}

.user-display {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-logout {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

</style>
