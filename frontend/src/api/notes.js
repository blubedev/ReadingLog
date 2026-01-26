import client from './client';

export const notesApi = {
  // メモ一覧取得（本に紐づく）
  getNotes: async (bookId) => {
    const response = await client.get(`/books/${bookId}/notes`);
    return response.data;
  },

  // メモ追加
  createNote: async (bookId, content) => {
    const response = await client.post(`/books/${bookId}/notes`, {
      content,
    });
    return response.data;
  },

  // メモ詳細取得
  getNote: async (id) => {
    const response = await client.get(`/notes/${id}`);
    return response.data;
  },

  // メモ更新
  updateNote: async (id, content) => {
    const response = await client.put(`/notes/${id}`, {
      content,
    });
    return response.data;
  },

  // メモ削除
  deleteNote: async (id) => {
    const response = await client.delete(`/notes/${id}`);
    return response.data;
  },
};
