<template>
  <div class="register-view">
    <div class="register-card glass-card">
      <div class="card-header">
        <span class="logo-icon">📝</span>
        <h2>Create Account</h2>
        <p class="subtitle">Join BeliAja.com storefront today</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            type="text" 
            id="name" 
            v-model="name" 
            placeholder="John Doe" 
            required 
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="john@example.com" 
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
            placeholder="Min 6 characters" 
            required 
            class="form-control"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="Repeat password" 
            required 
            class="form-control"
          />
        </div>

        <button type="submit" class="btn-primary w-100" :disabled="loading">
          <span v-if="loading">Creating account...</span>
          <span v-else>Register</span>
        </button>
      </form>

      <div class="card-footer">
        <p>Already have an account? <router-link to="/login">Log in here</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from '../toast';

export default {
  name: 'Register',
  setup() {
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const loading = ref(false);
    const router = useRouter();

    const handleRegister = async () => {
      if (password.value !== confirmPassword.value) {
        showToast('Passwords do not match', 'error');
        return;
      }

      loading.value = true;
      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.value,
            email: email.value,
            password: password.value
          })
        });

        const data = await response.json();

        if (response.ok) {
          showToast('Account registered successfully! Please log in.', 'success');
          router.push('/login');
        } else {
          showToast(data.error || 'Failed to register', 'error');
        }
      } catch (err) {
        showToast('Network error during registration', 'error');
      } finally {
        loading.value = false;
      }
    };

    return {
      name,
      email,
      password,
      confirmPassword,
      loading,
      handleRegister
    };
  }
};
</script>

<style scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  min-height: 80vh;
}

.register-card {
  width: 100%;
  max-width: 445px;
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

.register-form {
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
