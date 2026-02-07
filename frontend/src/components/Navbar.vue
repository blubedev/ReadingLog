<template>
  <nav class="bg-white shadow-lg relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <!-- ドロワー開閉ボタン（左端） -->
          <button
            type="button"
            class="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#34C759]"
            aria-label="メニューを開く"
            @click="drawerOpen = true"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex-shrink-0 flex items-center ml-2">
            <router-link to="/" class="text-xl font-bold text-[#34C759]">
              ReadTracker
            </router-link>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <router-link
              to="/books"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-[#34C759] text-gray-900"
            >
              書籍一覧
            </router-link>
            <router-link
              to="/books/new"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-[#34C759] text-gray-900"
            >
              書籍登録
            </router-link>
          </div>
        </div>
        <div class="flex items-center">
          <span v-if="authStore.user" class="text-gray-700 mr-4">{{ authStore.user.username }}</span>
          <button
            @click="handleLogout"
            class="bg-[#34C759] hover:bg-[#2db34d] text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>

    <!-- ドロワー オーバーレイ -->
    <Transition name="fade">
      <div
        v-show="drawerOpen"
        class="fixed inset-0 z-40 bg-black/50"
        aria-hidden="true"
        @click="drawerOpen = false"
      />
    </Transition>

    <!-- ドロワー パネル（左からスライド） -->
    <Transition name="drawer">
      <aside
        v-show="drawerOpen"
        class="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl"
        aria-label="メニュー"
      >
        <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <span class="text-lg font-bold text-[#34C759]">メニュー</span>
          <button
            type="button"
            class="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="メニューを閉じる"
            @click="drawerOpen = false"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav class="py-4 px-2">
          <router-link
            to="/"
            class="flex items-center px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              active-class="bg-green-50 text-[#34C759]"
            @click="drawerOpen = false"
          >
            ホーム
          </router-link>
          <router-link
            to="/books"
            class="flex items-center px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              active-class="bg-green-50 text-[#34C759]"
            @click="drawerOpen = false"
          >
            書籍一覧
          </router-link>
          <router-link
            to="/books/new"
            class="flex items-center px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              active-class="bg-green-50 text-[#34C759]"
            @click="drawerOpen = false"
          >
            書籍登録
          </router-link>
          <div class="border-t border-gray-200 mt-4 pt-4">
            <button
              type="button"
              class="w-full flex items-center px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100 text-left"
              @click="handleLogout"
            >
              ログアウト
            </button>
          </div>
        </nav>
      </aside>
    </Transition>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const drawerOpen = ref(false);

const handleLogout = async () => {
  drawerOpen.value = false;
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}
</style>
