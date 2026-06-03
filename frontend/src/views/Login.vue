<template>
  <div class="login-view">
    <div class="login-card glass-card">
      <div class="card-header">
        <span class="logo-icon">🛍️</span>
        <h2>Welcome Back</h2>
        <p class="subtitle">Log in to your BeliAja.com account</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="you@example.com" 
            required 
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••" 
            required 
            class="form-control"
          />
        </div>

        <button type="submit" class="btn-primary w-100" :disabled="loading">
          <span v-if="loading">Logging in...</span>
          <span v-else>Log In</span>
        </button>
      </form>

      <div class="card-footer">
        <p>Don't have an account? <router-link to="/register">Register here</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from '../toast';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const router = useRouter();

    const handleLogin = async () => {
      loading.value = true;
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.value,
            password: password.value
          })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('user', JSON.stringify({
            id: data.id,
            name: data.name,
            email: data.email,
            token: data.token
          }));
          window.dispatchEvent(new Event('auth-change'));
          showToast(`Welcome back, ${data.name}!`, 'success');
          router.push('/');
        } else {
          showToast(data.error || 'Invalid credentials', 'error');
        }
      } catch (err) {
        showToast('Network error during login', 'error');
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      loading,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  min-height: 70vh;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 32px;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.card-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-control {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.05);
}

.w-100 {
  width: 100%;
}

.card-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.card-footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.card-footer a:hover {
  text-decoration: underline;
}
</style>
