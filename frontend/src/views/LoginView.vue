<template>
  <div class="min-h-screen flex items-center justify-center bg-[#ffebc0] py-12 px-4 sm:px-6 lg:px-8 relative">
    <!-- ヘルプアイコン（右下） -->
    <button
      type="button"
      class="absolute bottom-6 right-6 p-1 text-gray-300 hover:text-gray-500 focus:outline-none"
      aria-label="ヘルプ"
    >
      <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
      </svg>
    </button>

    <!-- ログインカード -->
    <div class="w-full max-w-md rounded-2xl border border-green-200 bg-white p-8 shadow-sm">
      <!-- ブランド・見出し -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2 mb-6">
          <svg class="h-8 w-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
          <span class="text-xl font-bold text-gray-900">ReadTracker</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">ログイン</h1>
        <p class="mt-2 text-sm text-gray-500">アカウントにログインしてください</p>
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <!-- メールアドレス -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white sm:text-sm"
            />
          </div>
        </div>

        <!-- パスワード -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              placeholder="・・・・・・"
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white sm:text-sm"
            />
          </div>
        </div>

        <!-- エラーメッセージ -->
        <div v-if="authStore.error" class="text-red-600 text-sm text-center">
          {{ authStore.error }}
        </div>

        <!-- ログインボタン -->
        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full flex justify-center py-3 px-4 rounded-lg text-base font-bold text-white bg-[#34C759] hover:bg-[#2db34d] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ authStore.isLoading ? 'ログイン中...' : 'ログイン' }}
        </button>

        <!-- 新規登録リンク -->
        <p class="text-center text-sm text-gray-500">
          アカウントをお持ちでない方は
          <router-link
            to="/register"
            class="font-medium text-[#34C759] hover:text-[#2db34d] hover:underline"
          >
            新規登録
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  } catch (error) {
    // エラーはストアで処理される
  }
};
</script>
