const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const ProgressHistory = require('../models/ProgressHistory');
const auth = require('../middleware/auth');
const { SUCCESS_MESSAGES, ERROR_TYPES, VALIDATION_MESSAGES, ERROR_MESSAGES, VALID_STATUSES, DEFAULT_STATUS, BOOK_STATUS } = require('../constants');

// すべてのルートで認証を必須にする
router.use(auth);

/**
 * GET /api/books/search
 * 外部API（Open Library API）から書籍情報を検索
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.SEARCH_QUERY_REQUIRED
      });
    }

    // ISBNかタイトルかを判定
    const isISBN = /^[\d-]+$/.test(q.replace(/-/g, ''));
    let searchUrl;

    if (isISBN) {
      // ISBNで検索（ハイフンを除去）
      const isbn = q.replace(/-/g, '');
      searchUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    } else {
      // タイトルで検索
      searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=10`;
    }

    const response = await fetch(searchUrl);
    const data = await response.json();

    let books = [];

    if (isISBN) {
      // ISBN検索の結果を処理
      const key = `ISBN:${q.replace(/-/g, '')}`;
      if (data[key]) {
        const bookData = data[key];
        books.push({
          title: bookData.title,
          author: bookData.authors?.map(a => a.name).join(', ') || '',
          isbn: q.replace(/-/g, ''),
          publisher: bookData.publishers?.[0]?.name || '',
          publishDate: bookData.publish_date || '',
          totalPages: bookData.number_of_pages || null,
          coverImageUrl: bookData.cover?.medium || bookData.cover?.small || '',
          description: bookData.notes || ''
        });
      }
    } else {
      // タイトル検索の結果を処理
      if (data.docs && data.docs.length > 0) {
        books = data.docs.slice(0, 10).map(doc => ({
          title: doc.title,
          author: doc.author_name?.join(', ') || '',
          isbn: doc.isbn?.[0] || '',
          publisher: doc.publisher?.[0] || '',
          publishDate: doc.first_publish_year?.toString() || '',
          totalPages: doc.number_of_pages_median || null,
          coverImageUrl: doc.cover_i 
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : '',
          description: ''
        }));
      }
    }

    res.json({
      query: q,
      count: books.length,
      books
    });
  } catch (error) {
    console.error('書籍検索エラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_SEARCH_ERROR
    });
  }
});

/**
 * GET /api/books/stats
 * 読書統計を返す（総冊数、読書中/読みたい/読了の件数、総読書ページ数、平均進捗率）
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;

    const [totalBooks, readingCount, wantCount, finishedCount, books] = await Promise.all([
      Book.countDocuments({ userId }),
      Book.countDocuments({ userId, status: '読書中' }),
      Book.countDocuments({ userId, status: '未読' }),
      Book.countDocuments({ userId, status: '読了' }),
      Book.find({ userId }).select('currentPage totalPages')
    ]);

    const totalPagesRead = books.reduce((sum, b) => sum + (b.currentPage || 0), 0);
    const withTotal = books.filter((b) => b.totalPages && b.totalPages > 0);
    const averageProgress =
      withTotal.length > 0
        ? Math.round(
            withTotal.reduce((sum, b) => sum + ((b.currentPage || 0) / b.totalPages) * 100, 0) / withTotal.length
          )
        : 0;

    res.json({
      totalBooks,
      readingCount,
      wantCount,
      finishedCount,
      totalPagesRead,
      averageProgress
    });
  } catch (error) {
    console.error('読書統計取得エラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_LIST_ERROR
    });
  }
});

/**
 * GET /api/books
 * 本の一覧取得（自分の本のみ）
 * クエリパラメータ: search, status, rating, page, limit, sortBy, sortOrder
 */
router.get('/', async (req, res) => {
  try {
    const { search, status, rating, page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    const userId = req.userId;

    // クエリ条件の構築
    const query = { userId };

    // タイトル・著者名での検索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // 読書状況でのフィルタ
    if (status) {
      query.status = status;
    }

    // 評価でのフィルタ（指定値以上）
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // ソート条件（sortBy: createdAt, updatedAt, title / sortOrder: asc, desc）
    const validSortFields = ['createdAt', 'updatedAt', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortOption = { [sortField]: sortDir };

    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 本の取得
    const [books, total] = await Promise.all([
      Book.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Book.countDocuments(query)
    ]);

    res.json({
      books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('本の一覧取得エラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_LIST_ERROR
    });
  }
});

/**
 * GET /api/books/:id
 * 本の詳細取得（自分の本のみ）
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    res.json({ book });
  } catch (error) {
    console.error('本の詳細取得エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_DETAIL_ERROR
    });
  }
});

/**
 * POST /api/books
 * 本の登録
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      publisher,
      publishDate,
      totalPages,
      coverImageUrl,
      description,
      status = DEFAULT_STATUS
    } = req.body;

    // バリデーション（タイトルは必須）
    if (!title) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.TITLE_REQUIRED
      });
    }

    // ステータスのバリデーション
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_STATUS
      });
    }

    const book = new Book({
      userId: req.userId,
      title,
      author,
      isbn,
      publisher,
      publishDate,
      totalPages,
      coverImageUrl,
      description,
      status
    });

    await book.save();

    res.status(201).json({
      message: SUCCESS_MESSAGES.BOOK_CREATED,
      book
    });
  } catch (error) {
    console.error('本の登録エラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_CREATE_ERROR
    });
  }
});

/**
 * PUT /api/books/:id
 * 本の更新（自分の本のみ）
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      publisher,
      publishDate,
      totalPages,
      currentPage,
      status,
      rating,
      coverImageUrl,
      description,
      completedDate
    } = req.body;

    // 本の存在確認と所有権チェック
    const book = await Book.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    // ステータスのバリデーション
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: ERROR_TYPES.INPUT_ERROR,
          message: VALIDATION_MESSAGES.INVALID_STATUS
        });
      }
    }

    // 評価のバリデーション
    if (rating !== undefined && rating !== null) {
      if (rating < 0.5 || rating > 5.0 || (rating * 2) % 1 !== 0) {
        return res.status(400).json({
          error: ERROR_TYPES.INPUT_ERROR,
          message: VALIDATION_MESSAGES.INVALID_RATING
        });
      }
    }

    // 更新データの構築
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (publisher !== undefined) updateData.publisher = publisher;
    if (publishDate !== undefined) updateData.publishDate = publishDate;
    if (totalPages !== undefined) updateData.totalPages = totalPages;
    if (currentPage !== undefined) updateData.currentPage = currentPage;
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (description !== undefined) updateData.description = description;
    if (completedDate !== undefined) updateData.completedDate = completedDate;

    // ステータスが「読了」に変更された場合、読了日を自動設定
    if (status === BOOK_STATUS.COMPLETED && book.status !== BOOK_STATUS.COMPLETED && !completedDate) {
      updateData.completedDate = new Date();
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: SUCCESS_MESSAGES.BOOK_UPDATED,
      book: updatedBook
    });
  } catch (error) {
    console.error('本の更新エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_UPDATE_ERROR
    });
  }
});

/**
 * DELETE /api/books/:id
 * 本の削除（自分の本のみ）
 */
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    // 関連する進捗履歴も削除
    await ProgressHistory.deleteMany({ bookId: req.params.id });

    res.json({
      message: SUCCESS_MESSAGES.BOOK_DELETED,
      book
    });
  } catch (error) {
    console.error('本の削除エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.BOOK_DELETE_ERROR
    });
  }
});

/**
 * PUT /api/books/:id/progress
 * 進捗更新（ページ数、進捗率）
 */
router.put('/:id/progress', async (req, res) => {
  try {
    const { currentPage } = req.body;

    if (currentPage === undefined || currentPage === null) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.CURRENT_PAGE_REQUIRED
      });
    }

    if (currentPage < 0) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.PAGE_NUMBER_NON_NEGATIVE
      });
    }

    // 本の存在確認と所有権チェック
    const book = await Book.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    // 進捗率の計算
    let progress = 0;
    if (book.totalPages && book.totalPages > 0) {
      progress = Math.min(100, Math.round((currentPage / book.totalPages) * 100));
    }

    // 本の進捗を更新
    book.currentPage = currentPage;
    await book.save();

    // 進捗履歴を記録
    const progressHistory = new ProgressHistory({
      userId: req.userId,
      bookId: book._id,
      page: currentPage,
      progress,
      recordedAt: new Date()
    });
    await progressHistory.save();

    res.json({
      message: SUCCESS_MESSAGES.PROGRESS_UPDATED,
      book,
      progress,
      progressHistory
    });
  } catch (error) {
    console.error('進捗更新エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.PROGRESS_UPDATE_ERROR
    });
  }
});

/**
 * GET /api/books/:id/progress-history
 * 進捗履歴取得
 */
router.get('/:id/progress-history', async (req, res) => {
  try {
    // 本の存在確認と所有権チェック
    const book = await Book.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!book) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.BOOK_NOT_FOUND
      });
    }

    const progressHistory = await ProgressHistory.find({
      bookId: req.params.id,
      userId: req.userId
    }).sort({ recordedAt: -1 });

    res.json({
      bookId: req.params.id,
      progressHistory
    });
  } catch (error) {
    console.error('進捗履歴取得エラー:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_BOOK_ID
      });
    }
    
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.PROGRESS_HISTORY_ERROR
    });
  }
});

module.exports = router;
