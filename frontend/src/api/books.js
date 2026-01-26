import client from './client';

export const booksApi = {
  // 書籍検索（Open Library API）
  search: async (query) => {
    const response = await client.get('/books/search', {
      params: { q: query },
    });
    return response.data;
  },

  // 書籍一覧取得
  getBooks: async (params = {}) => {
    const response = await client.get('/books', { params });
    return response.data;
  },

  // 書籍詳細取得
  getBook: async (id) => {
    const response = await client.get(`/books/${id}`);
    return response.data;
  },

  // 書籍登録
  createBook: async (bookData) => {
    const response = await client.post('/books', bookData);
    return response.data;
  },

  // 書籍更新
  updateBook: async (id, bookData) => {
    const response = await client.put(`/books/${id}`, bookData);
    return response.data;
  },

  // 書籍削除
  deleteBook: async (id) => {
    const response = await client.delete(`/books/${id}`);
    return response.data;
  },

  // 進捗更新
  updateProgress: async (id, currentPage) => {
    const response = await client.put(`/books/${id}/progress`, {
      currentPage,
    });
    return response.data;
  },

  // 進捗履歴取得
  getProgressHistory: async (id) => {
    const response = await client.get(`/books/${id}/progress-history`);
    return response.data;
  },
};
