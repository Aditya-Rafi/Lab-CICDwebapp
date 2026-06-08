import { createRouter, createWebHistory } from 'vue-router';
import Storefront from './views/Storefront.vue';
import Dashboard from './views/Dashboard.vue';
import Products from './views/Products.vue';
import ProductForm from './views/ProductForm.vue';
import Orders from './views/Orders.vue';
import SystemInfo from './views/SystemInfo.vue';

const routes = [
  {
    path: '/',
    name: 'Storefront',
    component: Storefront
  },
  {
    path: '/admin',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/products',
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/products/new',
    name: 'CreateProduct',
    component: ProductForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/products/edit/:id',
    name: 'EditProduct',
    component: ProductForm,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/system',
    name: 'SystemInfo',
    component: SystemInfo,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('./views/Register.vue')
  },
  {
    path: '/my-orders',
    name: 'MyOrders',
    component: () => import('./views/MyOrders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'CustomerDashboard',
    component: () => import('./views/CustomerDashboard.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user) {
      next({ name: 'Login' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

