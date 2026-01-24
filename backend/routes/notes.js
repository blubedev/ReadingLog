const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

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
        error: '本が見つかりません',
        message: '指定された本は存在しないか、アクセス権限がありません'
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
        error: '入力エラー',
        message: '無効な本のIDです'
      });
    }
    
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'メモの取得中にエラーが発生しました'
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
        error: '入力エラー',
        message: 'メモの内容を入力してください'
      });
    }

    // 本の存在確認と所有権チェック
    const book = await Book.findOne({
      _id: bookId,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: '本が見つかりません',
        message: '指定された本は存在しないか、アクセス権限がありません'
      });
    }

    const note = new Note({
      userId: req.userId,
      bookId,
      content: content.trim()
    });

    await note.save();

    res.status(201).json({
      message: 'メモを追加しました',
      note
    });
  } catch (error) {
    console.error('メモ追加エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: '入力エラー',
        message: '無効な本のIDです'
      });
    }
    
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'メモの追加中にエラーが発生しました'
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
        error: 'メモが見つかりません',
        message: '指定されたメモは存在しないか、アクセス権限がありません'
      });
    }

    res.json({ note });
  } catch (error) {
    console.error('メモ詳細取得エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: '入力エラー',
        message: '無効なメモのIDです'
      });
    }
    
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'メモの取得中にエラーが発生しました'
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
        error: '入力エラー',
        message: 'メモの内容を入力してください'
      });
    }

    // メモの存在確認と所有権チェック
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({
        error: 'メモが見つかりません',
        message: '指定されたメモは存在しないか、アクセス権限がありません'
      });
    }

    note.content = content.trim();
    await note.save();

    res.json({
      message: 'メモを更新しました',
      note
    });
  } catch (error) {
    console.error('メモ更新エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: '入力エラー',
        message: '無効なメモのIDです'
      });
    }
    
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'メモの更新中にエラーが発生しました'
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
        error: 'メモが見つかりません',
        message: '指定されたメモは存在しないか、アクセス権限がありません'
      });
    }

    res.json({
      message: 'メモを削除しました',
      note
    });
  } catch (error) {
    console.error('メモ削除エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: '入力エラー',
        message: '無効なメモのIDです'
      });
    }
    
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'メモの削除中にエラーが発生しました'
    });
  }
});

module.exports = router;
