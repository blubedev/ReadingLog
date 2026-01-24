const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

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
        error: '入力エラー',
        message: 'ユーザー名、メールアドレス、パスワードは必須です'
      });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: '入力エラー',
        message: '有効なメールアドレスを入力してください'
      });
    }

    // パスワードの長さチェック
    if (password.length < 6) {
      return res.status(400).json({
        error: '入力エラー',
        message: 'パスワードは6文字以上で入力してください'
      });
    }

    // 既存ユーザーのチェック（メールアドレス）
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        error: '登録エラー',
        message: 'このメールアドレスは既に登録されています'
      });
    }

    // 既存ユーザーのチェック（ユーザー名）
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        error: '登録エラー',
        message: 'このユーザー名は既に使用されています'
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
      message: 'ユーザー登録が完了しました',
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
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'ユーザー登録中にエラーが発生しました'
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
        error: '入力エラー',
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // ユーザーの検索
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: '認証エラー',
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // パスワードの検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '認証エラー',
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // JWTトークンの生成
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'ログインに成功しました',
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
      error: 'サーバーエラー',
      message: 'ログイン中にエラーが発生しました'
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
    message: 'ログアウトしました'
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
        error: 'ユーザーが見つかりません',
        message: 'ログインしているユーザーが存在しません'
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
      error: 'サーバーエラー',
      message: 'ユーザー情報の取得中にエラーが発生しました'
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
        error: 'ユーザーが見つかりません',
        message: 'ログインしているユーザーが存在しません'
      });
    }

    // 新しいトークンを生成
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'トークンを更新しました',
      token
    });
  } catch (error) {
    console.error('トークンリフレッシュエラー:', error);
    res.status(500).json({
      error: 'サーバーエラー',
      message: 'トークンの更新中にエラーが発生しました'
    });
  }
});

module.exports = router;
