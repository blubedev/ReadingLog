const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { SUCCESS_MESSAGES, ERROR_TYPES, VALIDATION_MESSAGES, ERROR_MESSAGES } = require('../constants');

// 環境変数
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * ユーザー登録
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // バリデーション
    if (!username || !email || !password) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.USERNAME_EMAIL_PASSWORD_REQUIRED
      });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.INVALID_EMAIL
      });
    }

    // パスワードの長さチェック
    if (password.length < 6) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH
      });
    }

    // 既存ユーザーのチェック（メールアドレス）
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        error: ERROR_TYPES.REGISTER_ERROR,
        message: VALIDATION_MESSAGES.EMAIL_ALREADY_EXISTS
      });
    }

    // 既存ユーザーのチェック（ユーザー名）
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        error: ERROR_TYPES.REGISTER_ERROR,
        message: VALIDATION_MESSAGES.USERNAME_ALREADY_EXISTS
      });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ユーザーの作成
    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    // JWTトークンの生成
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);

    // MongoDB のバリデーション / 一意制約などのエラー内容をクライアント側で確認できるようにする
    if (error.name === 'MongoServerError' || error.name === 'MongoError' || error.name === 'ValidationError') {
      return res.status(500).json({
        error: ERROR_TYPES.SERVER_ERROR,
        message: ERROR_MESSAGES.REGISTER_ERROR,
        detail: error.message,
        code: error.code
      });
    }

    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.REGISTER_ERROR
    });
  }
});

/**
 * POST /api/auth/login
 * ログイン
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({
        error: ERROR_TYPES.INPUT_ERROR,
        message: VALIDATION_MESSAGES.EMAIL_PASSWORD_REQUIRED
      });
    }

    // ユーザーの検索
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: ERROR_TYPES.AUTH_ERROR,
        message: VALIDATION_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // パスワードの検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: ERROR_TYPES.AUTH_ERROR,
        message: VALIDATION_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // JWTトークンの生成
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.LOGIN_ERROR
    });
  }
});

/**
 * POST /api/auth/logout
 * ログアウト（クライアント側でトークンを削除するのみ）
 */
router.post('/logout', auth, (req, res) => {
  // JWTはステートレスなので、サーバー側での処理は不要
  // クライアント側でトークンを削除することでログアウトを実現
  res.json({
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS
  });
});

/**
 * GET /api/auth/me
 * 現在のユーザー情報取得
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.USER_NOT_FOUND
      });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.USER_INFO_ERROR
    });
  }
});

/**
 * POST /api/auth/refresh
 * トークンリフレッシュ
 */
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        error: ERROR_TYPES.NOT_FOUND,
        message: VALIDATION_MESSAGES.USER_NOT_FOUND
      });
    }

    // 新しいトークンを生成
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: SUCCESS_MESSAGES.TOKEN_REFRESH_SUCCESS,
      token
    });
  } catch (error) {
    console.error('トークンリフレッシュエラー:', error);
    res.status(500).json({
      error: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.TOKEN_REFRESH_ERROR
    });
  }
});

module.exports = router;
