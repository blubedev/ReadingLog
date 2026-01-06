const mongoose = require('mongoose');

const progressHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  page: {
    type: Number,
    required: true,
    min: 0
  },
  progress: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true // createdAt と updatedAt を自動生成
});

// インデックスの設定
progressHistorySchema.index({ userId: 1 });
progressHistorySchema.index({ bookId: 1 });
progressHistorySchema.index({ userId: 1, bookId: 1 });

module.exports = mongoose.model('ProgressHistory', progressHistorySchema);

