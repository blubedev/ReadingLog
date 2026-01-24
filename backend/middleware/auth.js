const jwt = require('jsonwebtoken');

// JWT認証ミドルウェア
const auth = async (req, res, next) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: '認証が必要です',
        message: 'アクセストークンが見つかりません'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を追加
    req.userId = decoded.userId;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'トークンの有効期限が切れています',
        message: '再度ログインしてください'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: '無効なトークンです',
        message: '正しいトークンで再度お試しください'
      });
    }
    
    console.error('認証エラー:', error);
    res.status(500).json({ 
      error: '認証処理中にエラーが発生しました',
      message: error.message
    });
  }
};

module.exports = auth;
