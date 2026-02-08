<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />
    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">
          {{ isEdit ? '書籍編集' : '書籍登録' }}
        </h1>

        <!-- 書籍検索セクション -->
        <div v-if="!isEdit" class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">書籍を検索</h2>

          <!-- バーコードスキャン -->
          <div class="mb-4">
            <BarcodeScanner
              @barcode-scanned="handleBarcodeScanned"
              @switch-to-manual="handleSwitchToManual"
            />
          </div>

          <div class="flex items-center gap-4 my-4">
            <span class="text-sm text-gray-500">または</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>

          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="タイトルまたはISBNを入力"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              @keyup.enter="handleSearch"
            />
            <button
              @click="handleSearch"
              :disabled="booksStore.isLoading"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              検索
            </button>
          </div>

          <!-- 検索結果 -->
          <div v-if="booksStore.searchResults.length > 0" class="mt-4 space-y-2">
            <div
              v-for="book in booksStore.searchResults"
              :key="book.isbn || book.title"
              class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              @click="selectBook(book)"
            >
              <div class="flex gap-4">
                <img
                  v-if="book.coverImageUrl"
                  :src="book.coverImageUrl"
                  :alt="book.title"
                  class="w-20 h-28 object-cover rounded"
                />
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900">{{ book.title }}</h3>
                  <p class="text-sm text-gray-600">{{ book.author }}</p>
                  <p v-if="book.publisher" class="text-xs text-gray-500">
                    {{ book.publisher }} {{ book.publishDate }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- エラーメッセージ -->
        <div v-if="booksStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {{ booksStore.error }}
        </div>

        <!-- 登録フォーム -->
        <form @submit.prevent="handleSubmit" class="bg-white shadow rounded-lg p-6">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                タイトル <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                著者
              </label>
              <input
                v-model="form.author"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  ISBN
                </label>
                <input
                  v-model="form.isbn"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  読書状況
                </label>
                <select
                  v-model="form.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="未読">未読</option>
                  <option value="読書中">読書中</option>
                  <option value="読了">読了</option>
                  <option value="中断">中断</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  出版社
                </label>
                <input
                  v-model="form.publisher"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  出版日
                </label>
                <input
                  v-model="form.publishDate"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  総ページ数
                </label>
                <input
                  v-model.number="form.totalPages"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  現在のページ
                </label>
                <input
                  v-model.number="form.currentPage"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                評価
              </label>
              <select
                v-model.number="form.rating"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option :value="null">評価なし</option>
                <option :value="0.5">0.5</option>
                <option :value="1">1</option>
                <option :value="1.5">1.5</option>
                <option :value="2">2</option>
                <option :value="2.5">2.5</option>
                <option :value="3">3</option>
                <option :value="3.5">3.5</option>
                <option :value="4">4</option>
                <option :value="4.5">4.5</option>
                <option :value="5">5</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                表紙画像URL
              </label>
              <input
                v-model="form.coverImageUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                v-model="form.description"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-4">
              <button
                type="button"
                @click="$router.push('/books')"
                class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                :disabled="booksStore.isLoading"
                class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50"
              >
                {{ booksStore.isLoading ? '保存中...' : isEdit ? '更新' : '登録' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBooksStore } from '@/stores/books';
import Navbar from '@/components/Navbar.vue';
import BarcodeScanner from '@/components/BarcodeScanner.vue';

const route = useRoute();
const router = useRouter();
const booksStore = useBooksStore();

const isEdit = computed(() => route.name === 'BookEdit');
const searchQuery = ref('');

const form = ref({
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  publishDate: '',
  totalPages: null,
  currentPage: 0,
  status: '未読',
  rating: null,
  coverImageUrl: '',
  description: '',
});

onMounted(async () => {
  if (isEdit.value) {
    await booksStore.fetchBook(route.params.id);
    if (booksStore.currentBook) {
      form.value = {
        title: booksStore.currentBook.title || '',
        author: booksStore.currentBook.author || '',
        isbn: booksStore.currentBook.isbn || '',
        publisher: booksStore.currentBook.publisher || '',
        publishDate: booksStore.currentBook.publishDate || '',
        totalPages: booksStore.currentBook.totalPages || null,
        currentPage: booksStore.currentBook.currentPage || 0,
        status: booksStore.currentBook.status || '未読',
        rating: booksStore.currentBook.rating || null,
        coverImageUrl: booksStore.currentBook.coverImageUrl || '',
        description: booksStore.currentBook.description || '',
      };
    }
  }
});

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;
  try {
    await booksStore.searchBooks(searchQuery.value);
  } catch (error) {
    // エラーはストアで処理される
  }
};

const handleBarcodeScanned = async (isbn) => {
  // スキャン成功時は常にISBNフィールドに自動入力
  form.value.isbn = isbn;

  try {
    await booksStore.searchBooks(isbn);
    // 検索結果があれば、タイトル・著者・ページ数などをフォームに自動入力
    if (booksStore.searchResults.length > 0) {
      selectBook(booksStore.searchResults[0]);
    }
  } catch (error) {
    // エラーはストアで処理される（ISBNは既に入力済み）
  }
};

const handleSwitchToManual = () => {
  // スキャナーが閉じられ、手動入力にフォーカス
  searchQuery.value = '';
};

const selectBook = (book) => {
  form.value = {
    title: book.title || '',
    author: book.author || '',
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    publishDate: book.publishDate || '',
    totalPages: book.totalPages || null,
    currentPage: 0,
    status: '未読',
    rating: null,
    coverImageUrl: book.coverImageUrl || '',
    description: book.description || '',
  };
  booksStore.searchResults = [];
  searchQuery.value = '';
};

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await booksStore.updateBook(route.params.id, form.value);
      router.push(`/books/${route.params.id}`);
    } else {
      const data = await booksStore.createBook(form.value);
      router.push(`/books/${data.book._id}`);
    }
  } catch (error) {
    // エラーはストアで処理される
  }
};
</script>
