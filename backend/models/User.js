const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true // createdAt と updatedAt を自動生成
});

// emailは既にunique: trueでインデックスが作成されるため、追加のインデックス定義は不要

module.exports = mongoose.model('User', userSchema);

