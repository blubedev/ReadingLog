import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/BooksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/books',
      name: 'Books',
      component: () => import('@/views/BooksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/books/new',
      name: 'BookNew',
      component: () => import('@/views/BookFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/books/:id',
      name: 'BookDetail',
      component: () => import('@/views/BookDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/books/:id/edit',
      name: 'BookEdit',
      component: () => import('@/views/BookFormView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// 認証ガード
router.beforeEach(async (to, from, next) => {
  try {
    // ストアを動的にインポート（循環依存を避けるため）
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
      next({ name: 'Home' });
    } else {
      next();
    }
  } catch (error) {
    console.error('Router navigation error:', error);
    // エラーが発生した場合はログインページへ（ログインページ自体の場合はそのまま進む）
    if (to.name !== 'Login' && to.name !== 'Register') {
      next({ name: 'Login' });
    } else {
      next();
    }
  }
});

export default router;
