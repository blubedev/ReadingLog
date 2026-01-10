# API設計書

## 1. 認証

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得
- `POST /api/auth/refresh` - トークンリフレッシュ（任意）

## 2. 書籍情報検索（認証必須）

- `GET /api/books/search?q=タイトルまたはISBN` - 外部APIから書籍情報を検索
  - タイトルまたはISBNで検索
  - 複数の候補を返す（ユーザーが選択可能）
  - レスポンス: 書籍情報の配列

## 3. 本の管理（認証必須）

- `GET /api/books` - 本の一覧取得（自分の本のみ）
- `GET /api/books/:id` - 本の詳細取得（自分の本のみ）
- `POST /api/books` - 本の登録（書籍情報を含む）
- `PUT /api/books/:id` - 本の更新（自分の本のみ）
- `DELETE /api/books/:id` - 本の削除（自分の本のみ）

## 4. 検索・フィルタ（認証必須）

- `GET /api/books?search=キーワード` - タイトル・著者名で検索
- `GET /api/books?status=読書中` - 読書状況でフィルタ
- `GET /api/books?rating=4` - 評価でフィルタ（4以上など）
- `GET /api/books?search=キーワード&status=読書中&rating=4` - 複数条件の組み合わせ

## 5. メモ管理（認証必須）

- `GET /api/books/:id/notes` - メモ一覧取得（自分の本のメモのみ）
- `POST /api/books/:id/notes` - メモ追加
- `PUT /api/notes/:id` - メモ更新（自分のメモのみ）
- `DELETE /api/notes/:id` - メモ削除（自分のメモのみ）

## 6. 進捗管理（認証必須）

- `PUT /api/books/:id/progress` - 進捗更新（ページ数、進捗率）
- `GET /api/books/:id/progress-history` - 進捗履歴取得（任意）
