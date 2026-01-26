import { defineStore } from 'pinia';
import { notesApi } from '@/api/notes';

export const useNotesStore = defineStore('notes', {
  state: () => ({
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchNotes(bookId) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await notesApi.getNotes(bookId);
        this.notes = data.notes || [];
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || 'メモ一覧の取得に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchNote(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await notesApi.getNote(id);
        this.currentNote = data.note;
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || 'メモ詳細の取得に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createNote(bookId, content) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await notesApi.createNote(bookId, content);
        await this.fetchNotes(bookId); // 一覧を再取得
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || 'メモの追加に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateNote(id, content) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await notesApi.updateNote(id, content);
        const noteIndex = this.notes.findIndex((n) => n._id === id);
        if (noteIndex !== -1) {
          this.notes[noteIndex] = data.note;
        }
        if (this.currentNote?._id === id) {
          this.currentNote = data.note;
        }
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || 'メモの更新に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteNote(id, bookId) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await notesApi.deleteNote(id);
        await this.fetchNotes(bookId); // 一覧を再取得
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || 'メモの削除に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
