<template>
  <div class="product-form-view">
    <div class="view-header">
      <div>
        <h1>{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h1>
        <p class="subtitle">{{ isEdit ? 'Modify existing catalog specifications' : 'Create a new catalog item' }}</p>
      </div>
      <router-link to="/admin/products" class="btn-secondary">
        ← Cancel & Back
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading && isEdit" class="loading-state">
      <div class="spinner"></div>
      <p>Retrieving product specifications...</p>
    </div>

    <!-- Form content -->
    <div v-else class="form-container glass-card">
      <form @submit.prevent="submitForm">
        <div class="form-grid">
          <!-- Left Column: Inputs -->
          <div class="inputs-column">
            <!-- Product Name -->
            <div class="form-group">
              <label for="prod-name">Product Name *</label>
              <input 
                id="prod-name" 
                v-model="form.name" 
                type="text" 
                placeholder="e.g. Quantum Noise-Cancelling Headphones" 
                required
              />
            </div>

            <!-- SKU & Category Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="prod-sku">SKU Code *</label>
                <input 
                  id="prod-sku" 
                  v-model="form.sku" 
                  type="text" 
                  placeholder="e.g. ELC-QNTM-01" 
                  required
                />
              </div>

              <div class="form-group">
                <label for="prod-category">Category *</label>
                <select id="prod-category" v-model="form.category" required>
                  <option value="" disabled>Select Category</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
            </div>

            <!-- Price & Stock Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="prod-price">Retail Price ($) *</label>
                <input 
                  id="prod-price" 
                  v-model.number="form.price" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  placeholder="199.99" 
                  required
                />
              </div>

              <div class="form-group">
                <label for="prod-stock">Initial Stock *</label>
                <input 
                  id="prod-stock" 
                  v-model.number="form.stock" 
                  type="number" 
                  min="0" 
                  placeholder="15" 
                  required
                />
              </div>
            </div>

            <!-- Image URL -->
            <div class="form-group">
              <label for="prod-image">Image URL</label>
              <input 
                id="prod-image" 
                v-model="form.imageUrl" 
                type="url" 
                placeholder="https://example.com/image.jpg" 
              />
              <p class="input-tip">Leave blank to use category-specific presets</p>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="prod-desc">Product Description</label>
              <textarea 
                id="prod-desc" 
                v-model="form.description" 
                rows="4" 
                placeholder="Describe features, materials, warranty details..."
              ></textarea>
            </div>
          </div>

          <!-- Right Column: Live Card Preview -->
          <div class="preview-column">
            <h3>Live Preview</h3>
            <div class="preview-card-wrapper">
              <div class="preview-card glass-card">
                <div class="preview-img-container">
                  <img :src="computedImageUrl" alt="Preview Image" class="preview-image" />
                  <span class="preview-badge">{{ form.category || 'Category' }}</span>
                </div>
                <div class="preview-details">
                  <h4 class="preview-name">{{ form.name || 'Product Title Placeholder' }}</h4>
                  <p class="preview-sku">SKU: <code>{{ form.sku || 'SKU-XXXX-XX' }}</code></p>
                  <p class="preview-price">${{ (form.price || 0).toFixed(2) }}</p>
                  <div class="preview-stock-status">
                    <span v-if="form.stock === 0" class="badge badge-danger">Out of Stock</span>
                    <span v-else-if="form.stock < 5" class="badge badge-warning">Low Stock ({{ form.stock || 0 }} left)</span>
                    <span v-else class="badge badge-success">In Stock ({{ form.stock || 0 }} units)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Submit Button -->
        <div class="form-actions">
          <router-link to="/admin/products" class="btn-secondary">Cancel</router-link>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Publish Product') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from '../toast';

export default {
  name: 'ProductForm',
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    
    const isEdit = computed(() => !!props.id);
    const loading = ref(false);
    const submitting = ref(false);
    
    const categories = ref(['Electronics', 'Sports', 'Accessories', 'Home & Living', 'Office']);

    const form = ref({
      name: '',
      sku: '',
      category: '',
      price: null,
      stock: null,
      imageUrl: '',
      description: ''
    });

    // Preset images map
    const presets = {
      'Electronics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
      'Sports': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
      'Accessories': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      'Home & Living': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60',
      'Office': 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=500&auto=format&fit=crop&q=60',
      'General': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
    };

    const computedImageUrl = computed(() => {
      if (form.value.imageUrl) return form.value.imageUrl;
      return presets[form.value.category] || presets['General'];
    });

    const loadProduct = async () => {
      if (!isEdit.value) return;
      loading.value = true;
      try {
        const res = await fetch(`/api/v1/products/${props.id}`);
        if (res.ok) {
          const data = await res.json();
          form.value = {
            name: data.name,
            sku: data.sku,
            category: data.category,
            price: data.price,
            stock: data.stock,
            imageUrl: data.imageUrl || '',
            description: data.description || ''
          };
        } else {
          showToast('Product not found', 'error');
          router.push('/admin/products');
        }
      } catch (err) {
        showToast('Network error loading product info', 'error');
        router.push('/admin/products');
      } finally {
        loading.value = false;
      }
    };

    onMounted(loadProduct);

    const submitForm = async () => {
      // Validate Client-Side
      if (form.value.price <= 0) {
        showToast('Price must be greater than 0', 'warning');
        return;
      }
      if (form.value.stock < 0) {
        showToast('Stock cannot be negative', 'warning');
        return;
      }

      submitting.value = true;
      try {
        const payload = {
          ...form.value,
          imageUrl: computedImageUrl.value
        };

        const url = isEdit.value ? `/api/v1/products/${props.id}` : '/api/v1/products';
        const method = isEdit.value ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(
            isEdit.value ? 'Product updated successfully' : 'Product created successfully',
            'success'
          );
          router.push('/admin/products');
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to save product details', 'error');
        }
      } catch (err) {
        showToast('Network error submitting specifications', 'error');
      } finally {
        submitting.value = false;
      }
    };

    return {
      isEdit,
      loading,
      submitting,
      categories,
      form,
      computedImageUrl,
      submitForm
    };
  }
};
</script>

<style scoped>
.product-form-view {
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

.form-container {
  background: var(--bg-card);
}

.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
}

/* Row elements */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
}

.input-tip {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Live Preview Column */
.preview-column h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.preview-card-wrapper {
  display: flex;
  justify-content: center;
}

.preview-card {
  width: 100%;
  max-width: 280px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}

.preview-img-container {
  position: relative;
  height: 160px;
  background: #0f172a;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(15,23,42,0.8);
  border: 1px solid var(--border-color);
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
}

.preview-details {
  padding: 16px;
}

.preview-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.preview-sku {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.preview-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.preview-stock-status {
  font-size: 11px;
}

/* Actions Row */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
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
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
