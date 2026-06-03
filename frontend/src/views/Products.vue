<template>
  <div class="products-list-view">
    <div class="view-header">
      <div>
        <h1>Products Management</h1>
        <p class="subtitle">Maintain inventory item metadata and catalog pricing</p>
      </div>
      <router-link to="/admin/products/new" class="btn-primary">
        <span>➕</span> Add New Product
      </router-link>
    </div>

    <!-- Controls Row -->
    <div class="controls-card glass-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Filter catalog by name, category, or SKU..." 
        />
      </div>

      <div class="filter-group">
        <span class="filter-label">Filter Category:</span>
        <select v-model="selectedCategory">
          <option value="All">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Syncing catalog data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="empty-state glass-card">
      <p>No products match your filters. Add some items or clear filters!</p>
    </div>

    <!-- Products Table -->
    <div v-else class="table-card glass-card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>SKU Code</th>
              <th>Price</th>
              <th>Inventory Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in filteredProducts" :key="prod.id">
              <td class="img-cell">
                <img :src="prod.imageUrl" :alt="prod.name" class="table-thumbnail" />
              </td>
              <td>
                <div class="details-cell">
                  <p class="prod-name">{{ prod.name }}</p>
                  <p class="prod-desc-text">{{ truncate(prod.description, 60) }}</p>
                </div>
              </td>
              <td><span class="category-tag">{{ prod.category }}</span></td>
              <td><code class="sku-code">{{ prod.sku }}</code></td>
              <td class="price-cell">${{ prod.price.toFixed(2) }}</td>
              <td>
                <div class="stock-cell">
                  <span :class="['badge', getStockBadgeClass(prod.stock)]">
                    {{ prod.stock === 0 ? 'Out of Stock' : prod.stock + ' units' }}
                  </span>
                  <span v-if="prod.stock > 0 && prod.stock < 5" class="critical-text">Low stock warning</span>
                </div>
              </td>
              <td>
                <div class="actions-cell">
                  <router-link :to="'/admin/products/edit/' + prod.id" class="edit-btn">
                    ✏️ Edit
                  </router-link>
                  <button class="delete-btn" @click="confirmDelete(prod)">
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to permanently delete <strong>{{ productToDelete?.name }}</strong>?</p>
        <p class="modal-warning">This action is irreversible and will remove the item from the catalog.</p>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="deleteProduct">Delete Product</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { showToast } from '../toast';

export default {
  name: 'Products',
  setup() {
    const products = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const selectedCategory = ref('All');
    
    const categories = ref(['Electronics', 'Sports', 'Accessories', 'Home & Living', 'Office']);
    
    // Modal state
    const showDeleteModal = ref(false);
    const productToDelete = ref(null);

    const fetchProducts = async () => {
      loading.value = true;
      try {
        const res = await fetch('/api/v1/products');
        if (res.ok) {
          products.value = await res.ok ? await res.json() : [];
        } else {
          showToast('Failed to load products list', 'error');
        }
      } catch (err) {
        showToast('Network error loading product catalog', 'error');
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchProducts);

    const filteredProducts = computed(() => {
      return products.value.filter(p => {
        const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                              p.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                              p.category.toLowerCase().includes(searchQuery.value.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    });

    const getStockBadgeClass = (stock) => {
      if (stock === 0) return 'badge-danger';
      if (stock < 5) return 'badge-warning';
      return 'badge-success';
    };

    const confirmDelete = (product) => {
      productToDelete.value = product;
      showDeleteModal.value = true;
    };

    const deleteProduct = async () => {
      if (!productToDelete.value) return;
      try {
        const res = await fetch(`/api/v1/products/${productToDelete.value.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast(`${productToDelete.value.name} deleted successfully`, 'success');
          products.value = products.value.filter(p => p.id !== productToDelete.value.id);
        } else {
          showToast('Failed to delete product', 'error');
        }
      } catch (err) {
        showToast('Network error during deletion', 'error');
      } finally {
        showDeleteModal.value = false;
        productToDelete.value = null;
      }
    };

    const truncate = (str, len) => {
      if (!str) return '';
      return str.length > len ? str.substring(0, len - 3) + '...' : str;
    };

    return {
      products,
      loading,
      searchQuery,
      selectedCategory,
      categories,
      filteredProducts,
      showDeleteModal,
      productToDelete,
      getStockBadgeClass,
      confirmDelete,
      deleteProduct,
      truncate
    };
  }
};
</script>

<style scoped>
.products-list-view {
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

/* Controls Grid */
.controls-card {
  display: grid;
  grid-template-columns: 1fr 280px;
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

.img-cell {
  width: 80px;
  padding-right: 0;
}

.table-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: #0f172a;
  border: 1px solid var(--border-color);
}

.details-cell {
  max-width: 250px;
}

.prod-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.prod-desc-text {
  font-size: 12px;
  color: var(--text-muted);
}

.category-tag {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.sku-code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-accent);
}

.price-cell {
  font-weight: 700;
  font-family: var(--font-mono);
}

.stock-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.critical-text {
  font-size: 10px;
  color: var(--color-warning);
  font-weight: 500;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
}

.edit-btn:hover {
  background: var(--color-primary);
  color: white;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.delete-btn:hover {
  background: var(--color-danger);
  color: white;
}

/* Modal Overlay */
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
  max-width: 450px;
  width: 100%;
  text-align: center;
  animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.modal-warning {
  color: var(--color-danger);
  font-size: 12px;
  margin-top: 8px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
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
}
</style>
