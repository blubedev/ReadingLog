import { defineStore } from 'pinia';
import { booksApi } from '@/api/books';

export const useBooksStore = defineStore('books', {
  state: () => ({
    books: [],
    currentBook: null,
    searchResults: [],
    progressHistory: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
    filters: {
      search: '',
      status: '',
      rating: '',
    },
    isLoading: false,
    error: null,
  }),

  actions: {
    async searchBooks(query) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.search(query);
        this.searchResults = data.books || [];
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '検索に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBooks(params = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const queryParams = {
          ...this.filters,
          ...params,
        };
        const data = await booksApi.getBooks(queryParams);
        this.books = data.books || [];
        this.pagination = data.pagination || this.pagination;
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '書籍一覧の取得に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBook(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.getBook(id);
        this.currentBook = data.book;
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '書籍詳細の取得に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createBook(bookData) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.createBook(bookData);
        await this.fetchBooks(); // 一覧を再取得
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '書籍の登録に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateBook(id, bookData) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.updateBook(id, bookData);
        if (this.currentBook?._id === id) {
          this.currentBook = data.book;
        }
        await this.fetchBooks(); // 一覧を再取得
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '書籍の更新に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteBook(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.deleteBook(id);
        await this.fetchBooks(); // 一覧を再取得
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '書籍の削除に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateProgress(id, currentPage) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.updateProgress(id, currentPage);
        if (this.currentBook?._id === id) {
          this.currentBook = data.book;
        }
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '進捗の更新に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProgressHistory(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await booksApi.getProgressHistory(id);
        this.progressHistory = data.progressHistory || [];
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || '進捗履歴の取得に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = {
        search: '',
        status: '',
        rating: '',
      };
    },
  },
});
