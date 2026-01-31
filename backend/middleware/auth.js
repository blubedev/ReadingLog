const jwt = require('jsonwebtoken');
const { ERROR_TYPES, VALIDATION_MESSAGES, ERROR_MESSAGES } = require('../constants');

// JWT認証ミドルウェア
const auth = async (req, res, next) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: ERROR_TYPES.AUTH_REQUIRED,
        message: VALIDATION_MESSAGES.TOKEN_NOT_FOUND
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // トークンの検証（auth ルートと同じフォールバックを使用）
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を追加
    req.userId = decoded.userId;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: VALIDATION_MESSAGES.TOKEN_EXPIRED,
        message: VALIDATION_MESSAGES.TOKEN_EXPIRED_ACTION
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: VALIDATION_MESSAGES.INVALID_TOKEN,
        message: VALIDATION_MESSAGES.INVALID_TOKEN_ACTION
      });
    }
    
    console.error('認証エラー:', error);
    res.status(500).json({ 
      error: VALIDATION_MESSAGES.AUTH_PROCESS_ERROR,
      message: error.message
    });
  }
};

module.exports = auth;
