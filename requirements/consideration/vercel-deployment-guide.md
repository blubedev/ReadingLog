# Vercelデプロイ手順書

## 1. 概要

この読書管理アプリケーションをVercelにデプロイするための手順書です。

### 1.1 Vercelを選定した理由

- ✅ **無料プランあり**（個人開発・小規模運用に適している）
- ✅ **簡単なデプロイ**（GitHub連携で自動デプロイ）
- ✅ **フロントエンドとバックエンドの両方をサポート**
- ✅ **自動SSL証明書**（HTTPS対応）
- ✅ **CDN配信**（高速なアクセス）
- ✅ **サーバーレス関数**（バックエンドAPI）
- ✅ **環境変数の簡単な管理**
- ✅ **プレビューデプロイ**（PRごとに自動デプロイ）

### 1.2 アーキテクチャ概要

```
[ユーザー]
    ↓
[Vercel CDN]
    ↓
[Vercel] ← [GitHub] (自動デプロイ)
    ├─ フロントエンド (Vue.js)
    └─ バックエンド (Node.js + Express)
         ↓
    [MongoDB Atlas] (データベース)
```

---

## 2. 前提条件

- [ ] GitHubアカウント
- [ ] Vercelアカウント（無料で作成可能）
- [ ] MongoDB Atlasアカウント（無料プラン利用可能）
- [ ] Node.js 18以上がインストールされていること

---

## 3. Phase 1: プロジェクトの準備

### 3.1 プロジェクト構造の確認

Vercelでデプロイするため、以下のようなプロジェクト構造を推奨します：

```
reading-app/
├── frontend/          # Vue.js フロントエンド
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Node.js + Express バックエンド
│   ├── api/
│   ├── index.js
│   └── package.json
├── vercel.json        # Vercel設定ファイル
└── package.json       # ルートパッケージ（オプション）
```

### 3.2 モノレポ構成 vs 別リポジトリ

#### オプション1: モノレポ構成（推奨）
- フロントエンドとバックエンドを同じリポジトリで管理
- `vercel.json`でルーティングを設定

#### オプション2: 別リポジトリ
- フロントエンドとバックエンドを別々のリポジトリで管理
- それぞれ別のVercelプロジェクトとしてデプロイ

---

## 4. Phase 2: MongoDB Atlasの設定

### 4.1 MongoDB Atlasアカウントの作成

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)にアクセス
2. アカウントを作成（無料プランで開始可能）
3. クラスターを作成
   - プロバイダー: AWS
   - リージョン: ap-northeast-1 (Tokyo)
   - クラスター名: `reading-app-cluster`
   - インスタンスサイズ: M0（無料枠）

### 4.2 データベースユーザーの作成

1. Database Access に移動
2. "Add New Database User" をクリック
3. ユーザー名とパスワードを設定
4. 権限: "Atlas admin" または "Read and write to any database"

### 4.3 ネットワークアクセスの設定

1. Network Access に移動
2. "Add IP Address" をクリック
3. "Allow Access from Anywhere" を選択（開発環境）
   - 本番環境では特定のIPアドレスのみ許可を推奨

### 4.4 接続文字列の取得

1. Clusters に移動
2. "Connect" をクリック
3. "Connect your application" を選択
4. 接続文字列をコピー
   - 例: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

---

## 5. Phase 3: バックエンドの設定

### 5.1 バックエンドディレクトリの作成

```bash
mkdir backend
cd backend
npm init -y
```

### 5.2 必要なパッケージのインストール

```bash
npm install express mongoose jsonwebtoken bcryptjs cors dotenv
npm install -D nodemon
```

### 5.3 Expressアプリケーションの設定

`backend/index.js` の例：

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// ルート
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// APIルート
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/books', require('./api/routes/books'));

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### 5.4 環境変数の設定

`backend/.env` ファイルを作成：

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
PORT=3000
NODE_ENV=production
```

**重要**: `.env`ファイルは`.gitignore`に追加してください。

---

## 6. Phase 4: フロントエンドの設定

### 6.1 Vue.jsプロジェクトの作成

```bash
cd frontend
npm create vue@latest .
# または
npm create vite@latest . -- --template vue
```

### 6.2 必要なパッケージのインストール

```bash
npm install axios vue-router
npm install tesseract.js html5-qrcode
```

### 6.3 環境変数の設定

`frontend/.env.production` ファイルを作成：

```env
VITE_API_URL=https://your-app.vercel.app/api
```

`frontend/.env.development` ファイルを作成：

```env
VITE_API_URL=http://localhost:3000/api
```

### 6.4 APIクライアントの設定

`frontend/src/api/client.js` の例：

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（JWTトークンを追加）
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // トークンリフレッシュの処理
      // またはログインページにリダイレクト
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 7. Phase 5: Vercel設定ファイルの作成

### 7.1 vercel.jsonの作成

プロジェクトルートに `vercel.json` を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 7.2 フロントエンドのビルド設定

`frontend/package.json` にビルドスクリプトを追加：

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

### 7.3 バックエンドの設定

`backend/package.json` にエントリーポイントを確認：

```json
{
  "main": "index.js"
}
```

---

## 8. Phase 6: GitHubリポジトリの準備

### 8.1 .gitignoreの作成

プロジェクトルートに `.gitignore` を作成：

```
# 依存関係
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 環境変数
.env
.env.local
.env.production
.env.development

# ビルド出力
dist/
build/
.vercel/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### 8.2 GitHubリポジトリの作成

1. GitHubで新しいリポジトリを作成
2. ローカルでGitを初期化：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/reading-app.git
git push -u origin main
```

---

## 9. Phase 7: Vercelへのデプロイ

### 9.1 Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. "Sign Up" をクリック
3. GitHubアカウントでログイン（推奨）

### 9.2 プロジェクトのインポート

1. Vercelダッシュボードで "Add New Project" をクリック
2. GitHubリポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Other
   - **Root Directory**: プロジェクトルート
   - **Build Command**: （自動検出）
   - **Output Directory**: （自動検出）

### 9.3 環境変数の設定

Vercelダッシュボードで環境変数を設定：

1. プロジェクト設定 → Environment Variables
2. 以下の環境変数を追加：

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
NODE_ENV=production
```

**重要**: 
- Production, Preview, Development の各環境で設定
- 本番環境では強力な秘密鍵を使用

### 9.4 デプロイの実行

1. "Deploy" をクリック
2. デプロイが完了するまで待機（通常1-3分）
3. デプロイURLが表示される（例: `https://reading-app.vercel.app`）

---

## 10. Phase 8: カスタムドメインの設定（オプション）

### 10.1 ドメインの追加

1. Vercelダッシュボード → Settings → Domains
2. ドメイン名を入力
3. DNS設定の指示に従う

### 10.2 DNS設定

ドメインプロバイダーで以下のDNSレコードを追加：

- **Type**: CNAME
- **Name**: @ または www
- **Value**: cname.vercel-dns.com

---

## 11. Phase 9: 動作確認

### 11.1 ヘルスチェック

```bash
curl https://your-app.vercel.app/api/health
```

期待されるレスポンス：
```json
{"status":"ok"}
```

### 11.2 フロントエンドの確認

ブラウザで `https://your-app.vercel.app` にアクセス
- フロントエンドが正常に表示されることを確認

### 11.3 APIの確認

```bash
# ユーザー登録のテスト
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'
```

---

## 12. Phase 10: CI/CDの設定

### 12.1 自動デプロイ

Vercelはデフォルトで以下を自動実行：
- **mainブランチへのpush**: 本番環境にデプロイ
- **PRの作成**: プレビュー環境にデプロイ
- **コミットごと**: プレビューデプロイ

### 12.2 デプロイフック（オプション）

特定のイベントでデプロイをトリガーする場合：

1. Settings → Git
2. Deploy Hooks で設定

---

## 13. トラブルシューティング

### 13.1 よくある問題

#### ビルドエラー
- **原因**: 依存関係の問題、ビルドスクリプトの誤り
- **解決策**: ローカルで `npm run build` を実行して確認

#### 環境変数が読み込まれない
- **原因**: 環境変数の設定ミス
- **解決策**: Vercelダッシュボードで環境変数を再確認

#### MongoDB接続エラー
- **原因**: ネットワークアクセス設定、接続文字列の誤り
- **解決策**: MongoDB AtlasのNetwork Accessを確認

#### CORSエラー
- **原因**: フロントエンドとバックエンドのドメインが異なる
- **解決策**: `cors`ミドルウェアで適切なオリジンを設定

### 13.2 ログの確認

1. Vercelダッシュボード → Deployments
2. デプロイを選択
3. "Functions" タブでログを確認

---

## 14. コスト

### 14.1 Vercel無料プラン

- **帯域幅**: 100GB/月
- **サーバーレス関数**: 100GB時間/月
- **ビルド時間**: 6000分/月
- **個人プロジェクト**: 無制限

### 14.2 MongoDB Atlas無料プラン

- **ストレージ**: 512MB
- **RAM**: 共有
- **接続数**: 500

### 14.3 合計コスト

**無料プランで開始可能**
- 小規模な運用であれば無料プランで十分
- ユーザー数が増えた場合は有料プランにアップグレード

---

## 15. セキュリティのベストプラクティス

### 15.1 環境変数の管理

- ✅ 機密情報は環境変数で管理
- ✅ `.env`ファイルをGitにコミットしない
- ✅ Vercelの環境変数機能を使用

### 15.2 JWTトークンの管理

- ✅ 強力な秘密鍵を使用
- ✅ トークンの有効期限を適切に設定
- ✅ HttpOnly Cookieの使用を検討

### 15.3 MongoDB Atlasのセキュリティ

- ✅ 強力なパスワードを使用
- ✅ IPホワイトリストを設定（本番環境）
- ✅ 定期的なパスワード変更

---

## 16. パフォーマンス最適化

### 16.1 フロントエンド

- コード分割（Code Splitting）
- 画像の最適化
- キャッシュの活用

### 16.2 バックエンド

- データベースクエリの最適化
- インデックスの適切な設定
- レスポンスのキャッシュ

---

## 17. チェックリスト

### デプロイ前
- [ ] MongoDB Atlasの設定が完了
- [ ] 環境変数が正しく設定されている
- [ ] ローカルで動作確認が完了
- [ ] `.gitignore`に機密情報が含まれていない

### デプロイ後
- [ ] ヘルスチェックが成功
- [ ] フロントエンドが正常に表示される
- [ ] APIが正常に動作する
- [ ] 認証機能が正常に動作する
- [ ] カスタムドメインが設定されている（オプション）

---

## 18. 参考資料

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel Node.jsサンプル](https://github.com/vercel/examples/tree/main/nodejs)
- [MongoDB Atlasドキュメント](https://docs.atlas.mongodb.com/)
- [Vue.jsデプロイガイド](https://vuejs.org/guide/scaling-up/deployment.html)

---

この手順書に従って、Vercelにデプロイしていきます。


