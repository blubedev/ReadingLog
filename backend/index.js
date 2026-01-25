// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { SUCCESS_MESSAGES, ERROR_TYPES, VALIDATION_MESSAGES } = require('./constants');

// ルートのインポート
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const noteRoutes = require('./routes/notes');

const app = express();

// CORS設定
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Viteのデフォルトポート
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// データベース接続
connectDB().catch(err => {
  console.error('データベース接続エラー:', err);
  process.exit(1);
});

// ヘルスチェック用エンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: SUCCESS_MESSAGES.SERVER_RUNNING });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/notes', noteRoutes);

// 本に紐づくメモ取得・追加用ルート（/api/books/:bookId/notes）
// notes.js内で定義されているが、/api/notesにマウントしているため
// ここで別途/api経由でアクセスできるようにマウント
app.use('/api', noteRoutes);

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: ERROR_TYPES.NOT_FOUND,
    message: VALIDATION_MESSAGES.ENDPOINT_NOT_FOUND
  });
});

// グローバルエラーハンドラー
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err);
  res.status(500).json({
    error: ERROR_TYPES.INTERNAL_SERVER_ERROR,
    message: VALIDATION_MESSAGES.INTERNAL_ERROR
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  - GET  /health');
  console.log('  - POST /api/auth/register');
  console.log('  - POST /api/auth/login');
  console.log('  - POST /api/auth/logout');
  console.log('  - GET  /api/auth/me');
  console.log('  - POST /api/auth/refresh');
  console.log('  - GET  /api/books/search');
  console.log('  - GET  /api/books');
  console.log('  - GET  /api/books/:id');
  console.log('  - POST /api/books');
  console.log('  - PUT  /api/books/:id');
  console.log('  - DELETE /api/books/:id');
  console.log('  - PUT  /api/books/:id/progress');
  console.log('  - GET  /api/books/:id/progress-history');
  console.log('  - GET  /api/books/:bookId/notes');
  console.log('  - POST /api/books/:bookId/notes');
  console.log('  - GET  /api/notes/:id');
  console.log('  - PUT  /api/notes/:id');
  console.log('  - DELETE /api/notes/:id');
});
