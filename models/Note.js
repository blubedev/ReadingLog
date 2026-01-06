const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // createdAt と updatedAt を自動生成
});

// インデックスの設定
noteSchema.index({ userId: 1 });
noteSchema.index({ bookId: 1 });
noteSchema.index({ userId: 1, bookId: 1 });

module.exports = mongoose.model('Note', noteSchema);

