const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publishDate: {
    type: String,
    trim: true
  },
  totalPages: {
    type: Number,
    min: 0
  },
  currentPage: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['未読', '読書中', '読了', '中断'],
    default: '未読'
  },
  rating: {
    type: Number,
    min: 0.5,
    max: 5.0,
    validate: {
      validator: function(value) {
        if (value === null || value === undefined) return true;
        // 0.5刻みの検証
        return (value * 2) % 1 === 0;
      },
      message: '評価は0.5刻みで入力してください'
    }
  },
  coverImageUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true // createdAt と updatedAt を自動生成
});

// インデックスの設定
bookSchema.index({ userId: 1 });
bookSchema.index({ userId: 1, status: 1 });
bookSchema.index({ userId: 1, title: 1 });

module.exports = mongoose.model('Book', bookSchema);

