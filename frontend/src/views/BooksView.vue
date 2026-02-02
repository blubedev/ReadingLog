<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <div class="flex-1 max-w-7xl mx-auto w-full py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- 検索・フィルタ -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                検索
              </label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="タイトル・著者名"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @input="handleSearch"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                読書状況
              </label>
              <select
                v-model="statusFilter"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @change="handleFilter"
              >
                <option value="">すべて</option>
                <option value="未読">未読</option>
                <option value="読書中">読書中</option>
                <option value="読了">読了</option>
                <option value="中断">中断</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                評価
              </label>
              <select
                v-model="ratingFilter"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @change="handleFilter"
              >
                <option value="">すべて</option>
                <option value="3">3以上</option>
                <option value="4">4以上</option>
                <option value="5">5</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="clearFilters"
                class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                フィルタリセット
              </button>
            </div>
          </div>
        </div>

        <!-- エラーメッセージ -->
        <div v-if="booksStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {{ booksStore.error }}
        </div>

        <!-- 書籍一覧 -->
        <div v-if="booksStore.isLoading" class="text-center py-12">
          <div class="text-gray-500">読み込み中...</div>
        </div>

        <div v-else-if="booksStore.books.length === 0" class="text-center py-12">
          <div class="text-gray-500">書籍が登録されていません</div>
          <router-link
            to="/books/new"
            class="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            書籍を登録する
          </router-link>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="book in booksStore.books"
            :key="book._id"
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            @click="$router.push(`/books/${book._id}`)"
          >
            <div v-if="book.coverImageUrl" class="h-48 bg-gray-200">
              <img
                :src="book.coverImageUrl"
                :alt="book.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ book.title }}
              </h3>
              <p class="text-sm text-gray-600 mb-2">{{ book.author }}</p>
              <div class="flex items-center justify-between">
                <span
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="getStatusClass(book.status)"
                >
                  {{ book.status }}
                </span>
                <div v-if="book.rating" class="text-yellow-500">
                  ★ {{ book.rating }}
                </div>
              </div>
              <div v-if="book.totalPages" class="mt-2 text-sm text-gray-500">
                進捗: {{ book.currentPage || 0 }} / {{ book.totalPages }} ページ
                ({{ Math.round(((book.currentPage || 0) / book.totalPages) * 100) }}%)
              </div>
            </div>
          </div>
        </div>

        <!-- ページネーション -->
        <div
          v-if="booksStore.pagination.totalPages > 1"
          class="mt-6 flex justify-center space-x-2"
        >
          <button
            @click="changePage(booksStore.pagination.page - 1)"
            :disabled="booksStore.pagination.page === 1"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            前へ
          </button>
          <span class="px-4 py-2 text-sm text-gray-700">
            {{ booksStore.pagination.page }} / {{ booksStore.pagination.totalPages }}
          </span>
          <button
            @click="changePage(booksStore.pagination.page + 1)"
            :disabled="booksStore.pagination.page === booksStore.pagination.totalPages"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      </div>
    </div>

    <!-- フッター -->
    <footer class="mt-auto border-t border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-500">
          <p>ReadTracker — 読書進捗管理アプリ</p>
          <p class="mt-1">© {{ new Date().getFullYear() }} ReadTracker</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useBooksStore } from '@/stores/books';
import Navbar from '@/components/Navbar.vue';

const booksStore = useBooksStore();
const searchQuery = ref('');
const statusFilter = ref('');
const ratingFilter = ref('');

onMounted(async () => {
  await booksStore.fetchBooks();
});

const handleSearch = () => {
  booksStore.setFilters({ search: searchQuery.value });
  booksStore.fetchBooks({ page: 1 });
};

const handleFilter = () => {
  booksStore.setFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    rating: ratingFilter.value,
  });
  booksStore.fetchBooks({ page: 1 });
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  ratingFilter.value = '';
  booksStore.clearFilters();
  booksStore.fetchBooks({ page: 1 });
};

const changePage = (page) => {
  booksStore.fetchBooks({ page });
};

const getStatusClass = (status) => {
  const classes = {
    未読: 'bg-gray-100 text-gray-800',
    読書中: 'bg-blue-100 text-blue-800',
    読了: 'bg-green-100 text-green-800',
    中断: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};
</script>
