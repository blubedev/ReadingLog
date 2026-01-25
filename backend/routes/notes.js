const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { SUCCESS_MESSAGES, ERROR_TYPES, VALIDATION_MESSAGES, ERROR_MESSAGES } = require('../constants');

// すべてのルートで認証を必須にする
router.use(auth);

/**
 * GET /api/books/:bookId/notes
 * 本に紐づくメモ一覧取得（自分の本のメモのみ）
 */
router.get('/books/:bookId/notes', async (req, res) => {
  try {
    const { bookId } = req.params;

    // 本の存在確認と所有権チェック
    const book = await Book.findOne({
      _id: bookId,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    const notes = await Note.find({
      bookId,
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.json({
      bookId,
      notes
    });
  } catch (error) {
    console.error('メモ一覧取得エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.NOTE_LIST_ERROR
    });
  }
});

/**
 * POST /api/books/:bookId/notes
 * メモ追加
 */
router.post('/books/:bookId/notes', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { content } = req.body;

    // バリデーション
    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.NOTE_CONTENT_REQUIRED
      });
    }

    // 本の存在確認と所有権チェック
    const book = await Book.findOne({
      _id: bookId,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    const note = new Note({
      userId: req.userId,
      bookId,
      content: content.trim()
    });

    await note.save();

    res.status(201).json({
      message: SUCCESS_MESSAGES.NOTE_CREATED,
      note
    });
  } catch (error) {
    console.error('メモ追加エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.NOTE_CREATE_ERROR
    });
  }
});

/**
 * GET /api/notes/:id
 * メモ詳細取得（自分のメモのみ）
 */
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('bookId', 'title author');

    if (!note) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.NOTE_NOT_FOUND
      });
    }

    res.json({ note });
  } catch (error) {
    console.error('メモ詳細取得エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_NOTE_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.NOTE_DETAIL_ERROR
    });
  }
});

/**
 * PUT /api/notes/:id
 * メモ更新（自分のメモのみ）
 */
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;

    // バリデーション
    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.NOTE_CONTENT_REQUIRED
      });
    }

    // メモの存在確認と所有権チェック
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.NOTE_NOT_FOUND
      });
    }

    note.content = content.trim();
    await note.save();

    res.json({
      message: SUCCESS_MESSAGES.NOTE_UPDATED,
      note
    });
  } catch (error) {
    console.error('メモ更新エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_NOTE_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.NOTE_UPDATE_ERROR
    });
  }
});

/**
 * DELETE /api/notes/:id
 * メモ削除（自分のメモのみ）
 */
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.NOTE_NOT_FOUND
      });
    }

    res.json({
      message: SUCCESS_MESSAGES.NOTE_DELETED,
      note
    });
  } catch (error) {
    console.error('メモ削除エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_NOTE_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.NOTE_DELETE_ERROR
    });
  }
});

module.exports = router;
