// index.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./db');

const app = express();

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// データベース接続
connectDB().catch(err => {
  console.error('データベース接続エラー:', err);
  process.exit(1);
});

// ルート
app.get('/hello', (req, res) => {
  res.send('Hello Express!');
});

// APIルート（今後追加予定）
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/books', require('./routes/books'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
