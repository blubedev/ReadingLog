<template>
  <div class="min-h-screen bg-[#ffebc0]">
    <Navbar />
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- 戻るボタン -->
        <button
          @click="$router.push('/books')"
          class="mb-4 text-indigo-600 hover:text-indigo-800"
        >
          ← 一覧に戻る
        </button>

        <!-- エラーメッセージ -->
        <div v-if="booksStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {{ booksStore.error }}
        </div>

        <!-- 読み込み中 -->
        <div v-if="booksStore.isLoading" class="text-center py-12">
          <div class="text-gray-500">読み込み中...</div>
        </div>

        <!-- 書籍詳細 -->
        <div v-else-if="booksStore.currentBook" class="bg-white shadow rounded-lg overflow-hidden">
          <div class="md:flex">
            <div v-if="booksStore.currentBook.coverImageUrl" class="md:w-1/3">
              <img
                :src="booksStore.currentBook.coverImageUrl"
                :alt="booksStore.currentBook.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="md:w-2/3 p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {{ booksStore.currentBook.title }}
                  </h1>
                  <p class="text-xl text-gray-600 mb-4">
                    {{ booksStore.currentBook.author }}
                  </p>
                </div>
                <div class="flex space-x-2">
                  <router-link
                    :to="`/books/${booksStore.currentBook._id}/edit`"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    編集
                  </router-link>
                  <button
                    @click="handleDelete"
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    削除
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span class="text-sm font-medium text-gray-500">読書状況</span>
                  <p class="text-lg">{{ booksStore.currentBook.status }}</p>
                </div>
                <div v-if="booksStore.currentBook.rating">
                  <span class="text-sm font-medium text-gray-500">評価</span>
                  <p class="text-lg text-yellow-500">★ {{ booksStore.currentBook.rating }}</p>
                </div>
                <div v-if="booksStore.currentBook.totalPages">
                  <span class="text-sm font-medium text-gray-500">総ページ数</span>
                  <p class="text-lg">{{ booksStore.currentBook.totalPages }} ページ</p>
                </div>
                <div v-if="booksStore.currentBook.completedDate">
                  <span class="text-sm font-medium text-gray-500">読了日</span>
                  <p class="text-lg">{{ formatDate(booksStore.currentBook.completedDate) }}</p>
                </div>
              </div>

              <div v-if="booksStore.currentBook.totalPages" class="mb-4">
                <div class="flex justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">進捗</span>
                  <span class="text-sm text-gray-600">
                    {{ booksStore.currentBook.currentPage || 0 }} / {{ booksStore.currentBook.totalPages }} ページ
                    ({{ Math.round(((booksStore.currentBook.currentPage || 0) / booksStore.currentBook.totalPages) * 100) }}%)
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    class="bg-indigo-600 h-2.5 rounded-full"
                    :style="{ width: `${Math.round(((booksStore.currentBook.currentPage || 0) / booksStore.currentBook.totalPages) * 100)}%` }"
                  ></div>
                </div>
                <div class="mt-4">
                  <input
                    v-model.number="currentPageInput"
                    type="number"
                    min="0"
                    :max="booksStore.currentBook.totalPages"
                    class="w-32 px-3 py-2 border border-gray-300 rounded-md mr-2"
                    placeholder="ページ数"
                  />
                  <button
                    @click="updateProgress"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    進捗を更新
                  </button>
                </div>
              </div>

              <div v-if="booksStore.currentBook.description" class="mb-4">
                <span class="text-sm font-medium text-gray-500">説明</span>
                <p class="text-gray-700 mt-1">{{ booksStore.currentBook.description }}</p>
              </div>

              <div class="text-sm text-gray-500">
                <p v-if="booksStore.currentBook.isbn">ISBN: {{ booksStore.currentBook.isbn }}</p>
                <p v-if="booksStore.currentBook.publisher">出版社: {{ booksStore.currentBook.publisher }}</p>
                <p v-if="booksStore.currentBook.publishDate">出版日: {{ booksStore.currentBook.publishDate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- メモセクション -->
        <div class="mt-6 bg-white shadow rounded-lg p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">メモ・感想</h2>
          
          <!-- メモ追加フォーム -->
          <div class="mb-6">
            <textarea
              v-model="newNoteContent"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="メモや感想を入力してください"
            ></textarea>
            <button
              @click="addNote"
              :disabled="!newNoteContent.trim() || notesStore.isLoading"
              class="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              メモを追加
            </button>
          </div>

          <!-- メモ一覧 -->
          <div v-if="notesStore.isLoading" class="text-center py-4">
            <div class="text-gray-500">読み込み中...</div>
          </div>
          <div v-else-if="notesStore.notes.length === 0" class="text-center py-4 text-gray-500">
            メモがありません
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="note in notesStore.notes"
              :key="note._id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm text-gray-500">
                  {{ formatDate(note.createdAt) }}
                </span>
                <button
                  @click="deleteNote(note._id)"
                  class="text-red-600 hover:text-red-800 text-sm"
                >
                  削除
                </button>
              </div>
              <p class="text-gray-700 whitespace-pre-wrap">{{ note.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBooksStore } from '@/stores/books';
import { useNotesStore } from '@/stores/notes';
import Navbar from '@/components/Navbar.vue';

const route = useRoute();
const router = useRouter();
const booksStore = useBooksStore();
const notesStore = useNotesStore();

const currentPageInput = ref(0);
const newNoteContent = ref('');

const bookId = computed(() => route.params.id);

onMounted(async () => {
  await booksStore.fetchBook(bookId.value);
  await notesStore.fetchNotes(bookId.value);
  if (booksStore.currentBook) {
    currentPageInput.value = booksStore.currentBook.currentPage || 0;
  }
});

const updateProgress = async () => {
  if (currentPageInput.value < 0) {
    alert('ページ数は0以上で入力してください');
    return;
  }
  try {
    await booksStore.updateProgress(bookId.value, currentPageInput.value);
    alert('進捗を更新しました');
  } catch (error) {
    alert('進捗の更新に失敗しました');
  }
};

const addNote = async () => {
  if (!newNoteContent.value.trim()) return;
  try {
    await notesStore.createNote(bookId.value, newNoteContent.value);
    newNoteContent.value = '';
  } catch (error) {
    alert('メモの追加に失敗しました');
  }
};

const deleteNote = async (noteId) => {
  if (!confirm('このメモを削除しますか？')) return;
  try {
    await notesStore.deleteNote(noteId, bookId.value);
  } catch (error) {
    alert('メモの削除に失敗しました');
  }
};

const handleDelete = async () => {
  if (!confirm('この書籍を削除しますか？')) return;
  try {
    await booksStore.deleteBook(bookId.value);
    router.push('/books');
  } catch (error) {
    alert('書籍の削除に失敗しました');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
};
</script>
