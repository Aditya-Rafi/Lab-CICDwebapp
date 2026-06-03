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
    component: Dashboard
  },
  {
    path: '/admin/products',
    name: 'Products',
    component: Products
  },
  {
    path: '/admin/products/new',
    name: 'CreateProduct',
    component: ProductForm
  },
  {
    path: '/admin/products/edit/:id',
    name: 'EditProduct',
    component: ProductForm,
    props: true
  },
  {
    path: '/admin/orders',
    name: 'Orders',
    component: Orders
  },
  {
    path: '/admin/system',
    name: 'SystemInfo',
    component: SystemInfo
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
