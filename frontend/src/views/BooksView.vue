<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <div class="flex-1 max-w-7xl mx-auto w-full py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- 導入テキスト -->
        <p class="text-gray-600 mb-6">
          読書の進捗を記録して、読書習慣を可視化しましょう
        </p>

        <!-- 統計カード -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative">
            <div class="absolute top-3 right-3 text-gray-300">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p class="text-sm text-gray-500 mb-1">総冊数</p>
            <p class="text-2xl font-bold text-gray-900">{{ booksStore.stats.totalBooks }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative">
            <div class="absolute top-3 right-3 text-gray-300">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
              </svg>
            </div>
            <p class="text-sm text-gray-500 mb-1">読書中</p>
            <p class="text-2xl font-bold text-gray-900">{{ booksStore.stats.readingCount }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative">
            <div class="absolute top-3 right-3 text-gray-300">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-sm text-gray-500 mb-1">読了</p>
            <p class="text-2xl font-bold text-gray-900">{{ booksStore.stats.finishedCount }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative">
            <div class="absolute top-3 right-3 text-gray-300">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p class="text-sm text-gray-500 mb-1">総読書ページ</p>
            <p class="text-2xl font-bold text-gray-900">{{ booksStore.stats.totalPagesRead }}</p>
            <p class="text-xs text-gray-500 mt-1">平均進捗率 {{ booksStore.stats.averageProgress }}%</p>
          </div>
        </div>

        <!-- タブ・ソート・表示切り替え -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <!-- ステータスタブ -->
          <div class="flex border-b border-gray-200">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              type="button"
              :class="[
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.value
                  ? 'border-[#34C759] text-[#34C759]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
              @click="selectTab(tab.value)"
            >
              {{ tab.label }} ({{ tab.count }})
            </button>
          </div>

          <!-- ソート・表示切り替え -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <select
                v-model="sortBy"
                class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                @change="handleSortChange"
              >
                <option value="updatedAt">登録日時</option>
                <option value="createdAt">登録日時（新規）</option>
                <option value="title">タイトル</option>
              </select>
              <button
                type="button"
                class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                :class="sortOrder === 'desc' ? 'text-[#34C759]' : 'text-gray-400'"
                @click="toggleSortOrder"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <span class="text-sm text-gray-500">{{ sortOrder === 'desc' ? '降順' : '昇順' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                :class="['p-2 rounded-lg', viewMode === 'list' ? 'text-[#34C759] bg-green-50' : 'text-gray-400 hover:bg-gray-100']"
                @click="viewMode = 'list'"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                :class="['p-2 rounded-lg', viewMode === 'grid' ? 'text-[#34C759] bg-green-50' : 'text-gray-400 hover:bg-gray-100']"
                @click="viewMode = 'grid'"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- エラーメッセージ -->
        <div v-if="booksStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {{ booksStore.error }}
        </div>

        <!-- 書籍一覧 -->
        <div v-if="booksStore.isLoading" class="text-center py-12">
          <div class="text-gray-500">読み込み中...</div>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div class="text-gray-500">書籍が登録されていません</div>
          <router-link
            to="/books/new"
            class="mt-4 inline-block bg-[#34C759] hover:bg-[#2db34d] text-white px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            書籍を登録する
          </router-link>
        </div>

        <div v-else :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
          <div
            v-for="book in filteredBooks"
            :key="book._id"
            :class="[
              'bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow',
              viewMode === 'grid' ? '' : 'flex'
            ]"
          >
            <!-- 書籍カード クリックで詳細へ -->
            <div
              :class="['cursor-pointer flex-1 min-w-0', viewMode === 'grid' ? '' : 'flex']"
              @click="$router.push(`/books/${book._id}`)"
            >
              <div :class="['bg-gray-200 flex-shrink-0 relative', viewMode === 'grid' ? 'aspect-square w-full' : 'w-24 h-32']">
                <span
                  class="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded z-10"
                  :class="getStatusClass(book.status)"
                >
                  {{ getStatusLabel(book.status) }}
                </span>
                <img
                  v-if="book.coverImageUrl"
                  :src="book.coverImageUrl"
                  :alt="book.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                  </svg>
                </div>
              </div>
              <div :class="['p-4 flex-1 flex flex-col min-w-0', viewMode === 'list' ? 'text-left' : '']">
                <h3 class="text-lg font-semibold text-gray-900 truncate">{{ book.title }}</h3>
                <p class="text-sm text-gray-500 truncate">{{ book.author || '著者なし' }}</p>
                <div v-if="book.totalPages" class="mt-2">
                  <div class="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>{{ book.currentPage || 0 }} / {{ book.totalPages }} ページ</span>
                    <span>{{ Math.round(((book.currentPage || 0) / book.totalPages) * 100) }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      class="bg-[#34C759] h-1.5 rounded-full"
                      :style="{ width: `${Math.min(100, Math.round(((book.currentPage || 0) / book.totalPages) * 100))}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- アクションボタン -->
            <div class="flex items-center gap-2 p-4 border-t border-gray-100">
              <router-link
                :to="`/books/${book._id}/edit`"
                class="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                @click.stop
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                編集
              </router-link>
              <button
                type="button"
                class="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                aria-label="削除"
                @click.stop="handleDelete(book._id)"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
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
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            前へ
          </button>
          <span class="px-4 py-2 text-sm text-gray-700">
            {{ booksStore.pagination.page }} / {{ booksStore.pagination.totalPages }}
          </span>
          <button
            @click="changePage(booksStore.pagination.page + 1)"
            :disabled="booksStore.pagination.page === booksStore.pagination.totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
import { ref, computed, onMounted } from 'vue';
import { useBooksStore } from '@/stores/books';
import Navbar from '@/components/Navbar.vue';

const booksStore = useBooksStore();
const activeTab = ref('all');
const sortBy = ref('updatedAt');
const sortOrder = ref('desc');
const viewMode = ref('grid');

// 読みたい = 未読
const statusMap = { all: '', reading: '読書中', want: '未読', finished: '読了' };

// タブの件数はAPIから取得した統計を使用
const statusTabs = computed(() => [
  { value: 'all', label: 'すべて', count: booksStore.stats.totalBooks },
  { value: 'reading', label: '読書中', count: booksStore.stats.readingCount },
  { value: 'want', label: '読みたい', count: booksStore.stats.wantCount },
  { value: 'finished', label: '読了', count: booksStore.stats.finishedCount },
]);

// タブ選択時にAPIでフィルタしているため、表示は booksStore.books をそのまま使用
const filteredBooks = computed(() => booksStore.books);

onMounted(async () => {
  await booksStore.fetchBooks();
});

const selectTab = (value) => {
  activeTab.value = value;
  const status = statusMap[value];
  booksStore.setFilters({ status });
  booksStore.fetchBooks({ page: 1 });
};

const handleSortChange = () => {
  booksStore.setFilters({ sortBy: sortBy.value, sortOrder: sortOrder.value });
  booksStore.fetchBooks({ page: 1 });
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  booksStore.setFilters({ sortBy: sortBy.value, sortOrder: sortOrder.value });
  booksStore.fetchBooks({ page: 1 });
};

const changePage = (page) => {
  booksStore.fetchBooks({ page });
};

const handleDelete = async (id) => {
  if (!confirm('この書籍を削除しますか？')) return;
  try {
    await booksStore.deleteBook(id);
  } catch (error) {
    // エラーはストアで処理
  }
};

const getStatusLabel = (status) => {
  const labels = { 未読: '読みたい', 読書中: '読書中', 読了: '読了', 中断: '中断' };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    未読: 'bg-gray-100 text-gray-700',
    読書中: 'bg-green-100 text-green-700',
    読了: 'bg-green-100 text-green-700',
    中断: 'bg-gray-100 text-gray-600',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};
</script>
