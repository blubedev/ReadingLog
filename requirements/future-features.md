# 将来追加予定の機能

## 1. 概要

この読書管理アプリケーションに将来的に追加予定の機能の詳細です。

### 1.1 追加予定の機能

1. **Notionデータベースへの読書記録エクスポート・インポート**
2. **読書記録のCSVエクスポート・インポート**

---

## 2. Notionデータベースへの読書記録エクスポート・インポート

### 2.1 機能概要

Notionのデータベースと読書記録を連携し、データのエクスポート・インポートを可能にする機能です。

#### 2.1.1 エクスポート機能
- 読書管理アプリの読書記録をNotionデータベースにエクスポート
- **既存データの更新**: 既存のNotionデータベースのデータは更新する仕様
- 新規データベースの作成も可能
- **データ識別キー**: 既存データの識別に使用するキーは別途検討（ISBN、タイトル+著者名の組み合わせなど）

#### 2.1.2 インポート機能
- Notionデータベースの読書記録を読書管理アプリにインポート
- 既存のデータとマージ、または新規データとして追加

### 2.2 ユースケース

- **データのバックアップ**: Notionに読書記録をバックアップ
- **データの移行**: 既存のNotionデータベースから読書記録を移行
- **Notionでの管理**: Notionの強力な機能（フィルタ、ソート、ビュー）を活用
- **データの共有**: Notionの共有機能で読書記録を共有

### 2.3 技術的な検討事項

#### 2.3.1 Notion API

**Notion API v2**を使用します。

- **公式サイト**: https://developers.notion.com/
- **ドキュメント**: https://developers.notion.com/reference
- **認証**: OAuth 2.0（ユーザー認証が必要）
- **価格**: 無料プランあり

#### 2.3.2 必要な権限

- **データベースの読み取り**: インポート機能
- **データベースの書き込み**: エクスポート機能
- **ページの作成**: 新規データベースの作成

#### 2.3.3 データマッピング

読書管理アプリのデータ構造とNotionデータベースのプロパティのマッピング：

| 読書管理アプリ | Notionデータベース |
|--------------|------------------|
| タイトル | Title（タイトル） |
| 著者名 | Text（テキスト） |
| ISBN | Text（テキスト） |
| 出版社 | Text（テキスト） |
| 総ページ数 | Number（数値） |
| 現在のページ数 | Number（数値） |
| 読書状況 | Select（選択肢） |
| 評価 | Number（数値）またはSelect（選択肢） |
| 読了日 | Date（日付） |
| カバー画像URL | Files（ファイル）またはURL（URL） |
| メモ | Text（テキスト）またはPage（ページ） |
| 登録日時 | Created time（作成日時） |
| 更新日時 | Last edited time（最終更新日時） |

#### 2.3.4 データ識別キー（別途検討）

既存データを更新するために使用する識別キーは別途検討します。

**検討候補：**
- ISBN（一意性が高いが、ISBNがない場合がある）
- タイトル + 著者名の組み合わせ（重複の可能性あり）
- タイトル + 著者名 + 出版社の組み合わせ
- カスタムID（Notionデータベースに専用のIDプロパティを追加）

**実装時の考慮事項：**
- 識別キーの一意性の確保
- データの重複を防ぐ仕組み
- 更新対象の明確化

### 2.4 実装方針

#### 2.4.1 エクスポート機能の実装

```javascript
// backend/api/routes/notion-export.js
const { Client } = require('@notionhq/client');

async function exportToNotion(userId, notionDatabaseId, identifierKey = 'isbn') {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  // ユーザーの読書記録を取得
  const books = await Book.find({ userId });

  // 既存のNotionデータベースのデータを取得
  const existingPages = await notion.databases.query({
    database_id: notionDatabaseId,
  });

  // 既存データのマップを作成（識別キーでインデックス化）
  const existingMap = new Map();
  for (const page of existingPages.results) {
    const props = page.properties;
    let key;
    
    // 識別キーに応じてキーを生成（別途検討）
    if (identifierKey === 'isbn' && props['ISBN']) {
      key = props['ISBN'].rich_text[0]?.text?.content || '';
    } else if (identifierKey === 'title-author') {
      const title = props['タイトル']?.title[0]?.text?.content || '';
      const author = props['著者名']?.rich_text[0]?.text?.content || '';
      key = `${title}|${author}`;
    }
    
    if (key) {
      existingMap.set(key, page.id);
    }
  }

  // 読書記録をエクスポート（既存データは更新、新規データは作成）
  for (const book of books) {
    // 識別キーを生成（別途検討）
    let identifier;
    if (identifierKey === 'isbn' && book.isbn) {
      identifier = book.isbn;
    } else if (identifierKey === 'title-author') {
      identifier = `${book.title}|${book.author || ''}`;
    }

    const properties = {
      'タイトル': {
        title: [
          {
            text: {
              content: book.title,
            },
          },
        ],
      },
      '著者名': {
        rich_text: [
          {
            text: {
              content: book.author || '',
            },
          },
        ],
      },
      'ISBN': {
        rich_text: [
          {
            text: {
              content: book.isbn || '',
            },
          },
        ],
      },
      '読書状況': {
        select: {
          name: book.status,
        },
      },
      '評価': {
        number: book.rating || null,
      },
      '読了日': {
        date: book.completedDate ? {
          start: book.completedDate.toISOString().split('T')[0],
        } : null,
      },
    };

    // 既存データがある場合は更新、ない場合は作成
    if (identifier && existingMap.has(identifier)) {
      // 既存データを更新
      await notion.pages.update({
        page_id: existingMap.get(identifier),
        properties: properties,
      });
    } else {
      // 新規データを作成
      await notion.pages.create({
        parent: {
          database_id: notionDatabaseId,
        },
        properties: properties,
      });
    }
  }
}
```

#### 2.4.2 インポート機能の実装

```javascript
// backend/api/routes/notion-import.js
const { Client } = require('@notionhq/client');

async function importFromNotion(userId, notionDatabaseId) {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  // Notionデータベースからデータを取得
  const response = await notion.databases.query({
    database_id: notionDatabaseId,
  });

  // 読書管理アプリにインポート
  for (const page of response.results) {
    const properties = page.properties;

    await Book.create({
      userId,
      title: properties['タイトル']?.title[0]?.text?.content || '',
      author: properties['著者名']?.rich_text[0]?.text?.content || '',
      isbn: properties['ISBN']?.rich_text[0]?.text?.content || '',
      status: properties['読書状況']?.select?.name || '未読',
      rating: properties['評価']?.number || null,
      completedDate: properties['読了日']?.date?.start || null,
    });
  }
}
```

#### 2.4.3 OAuth認証の実装

```javascript
// backend/api/routes/notion-auth.js
const express = require('express');
const router = express.Router();

// Notion OAuth認証の開始
router.get('/notion/auth', (req, res) => {
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&redirect_uri=${process.env.NOTION_REDIRECT_URI}&response_type=code`;
  res.redirect(authUrl);
});

// Notion OAuth認証のコールバック
router.get('/notion/callback', async (req, res) => {
  const { code } = req.query;
  
  // アクセストークンを取得
  const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
    }),
  });

  const { access_token } = await tokenResponse.json();
  
  // ユーザー情報にNotionトークンを保存
  await User.findByIdAndUpdate(req.user.id, {
    notionToken: access_token,
  });

  res.redirect('/settings/notion');
});
```

### 2.5 API設計

#### 2.5.1 エクスポートAPI

- `POST /api/notion/export` - Notionデータベースにエクスポート（既存データは更新）
  - リクエストボディ:
    ```json
    {
      "databaseId": "notion-database-id",
      "bookIds": ["book-id-1", "book-id-2"], // オプション: 特定の本のみ
      "identifierKey": "isbn" // オプション: データ識別キー（別途検討、デフォルト: "isbn"）
    }
    ```
  - レスポンス:
    ```json
    {
      "success": true,
      "createdCount": 5,
      "updatedCount": 5,
      "totalCount": 10,
      "message": "10件の読書記録をエクスポートしました（5件を新規作成、5件を更新）"
    }
    ```
  - **注意**: 既存データは更新する仕様。データ識別キーは別途検討。

#### 2.5.2 インポートAPI

- `POST /api/notion/import` - Notionデータベースからインポート
  - リクエストボディ:
    ```json
    {
      "databaseId": "notion-database-id",
      "mergeMode": "skip" // "skip": 既存データをスキップ, "update": 既存データを更新, "create": すべて新規作成
    }
    ```
  - レスポンス:
    ```json
    {
      "success": true,
      "importedCount": 5,
      "skippedCount": 3,
      "message": "5件の読書記録をインポートしました（3件はスキップ）"
    }
    ```

#### 2.5.3 認証API

- `GET /api/notion/auth` - Notion認証の開始
- `GET /api/notion/callback` - Notion認証のコールバック
- `GET /api/notion/databases` - ユーザーのNotionデータベース一覧取得
- `DELETE /api/notion/disconnect` - Notion連携の解除

### 2.6 必要なパッケージ

```bash
npm install @notionhq/client
```

### 2.7 セキュリティ考慮事項

- **OAuth 2.0認証**: ユーザーが明示的に認証を行う
- **トークンの安全な保存**: 暗号化してデータベースに保存
- **スコープの最小化**: 必要な権限のみを要求
- **トークンの有効期限管理**: リフレッシュトークンの実装

### 2.8 エラーハンドリング

- Notion APIのレート制限対応
- ネットワークエラーの処理
- データ形式の不一致エラー
- 認証トークンの有効期限切れ

---

## 3. 読書記録のCSVエクスポート・インポート

### 3.1 機能概要

読書記録をCSV形式でエクスポート・インポートする機能です。

#### 3.1.1 エクスポート機能
- 読書記録をCSVファイルとしてダウンロード
- フィルタ条件（読書状況、評価など）でエクスポート可能

#### 3.1.2 インポート機能
- CSVファイルをアップロードして読書記録をインポート
- 既存データとのマージ、または新規データとして追加

### 3.2 ユースケース

- **データのバックアップ**: CSVファイルとしてバックアップ
- **データの移行**: 他のアプリからデータを移行
- **データの分析**: ExcelやGoogleスプレッドシートで分析
- **一括登録**: 複数の読書記録を一度に登録

### 3.3 CSV形式の定義

#### 3.3.1 エクスポート形式

```csv
タイトル,著者名,ISBN,出版社,総ページ数,現在のページ数,読書状況,評価,読了日,カバー画像URL,メモ,登録日時,更新日時
テスト本1,著者1,9781234567890,出版社1,300,150,読書中,4.5,2024-01-15,https://example.com/cover1.jpg,メモ内容1,2024-01-01T00:00:00Z,2024-01-15T00:00:00Z
テスト本2,著者2,9781234567891,出版社2,250,250,読了,5.0,2024-01-20,https://example.com/cover2.jpg,メモ内容2,2024-01-05T00:00:00Z,2024-01-20T00:00:00Z
```

#### 3.3.2 インポート形式

- エクスポート形式と同じ形式をサポート
- 必須項目: タイトル
- オプション項目: その他すべて

### 3.4 実装方針

#### 3.4.1 エクスポート機能の実装

```javascript
// backend/api/routes/csv-export.js
const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');

router.get('/csv/export', async (req, res) => {
  const userId = req.user.id;
  const { status, rating } = req.query;

  // フィルタ条件で読書記録を取得
  const filter = { userId };
  if (status) filter.status = status;
  if (rating) filter.rating = { $gte: parseFloat(rating) };

  const books = await Book.find(filter).populate('notes');

  // CSV形式に変換
  const fields = [
    'title',
    'author',
    'isbn',
    'publisher',
    'totalPages',
    'currentPage',
    'status',
    'rating',
    'completedDate',
    'coverImageUrl',
    'notes',
    'createdAt',
    'updatedAt',
  ];

  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(books.map(book => ({
    title: book.title,
    author: book.author || '',
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    totalPages: book.totalPages || '',
    currentPage: book.currentPage || 0,
    status: book.status,
    rating: book.rating || '',
    completedDate: book.completedDate ? book.completedDate.toISOString().split('T')[0] : '',
    coverImageUrl: book.coverImageUrl || '',
    notes: book.notes.map(note => note.content).join(' | '),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  })));

  // CSVファイルをダウンロード
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=reading-records-${Date.now()}.csv`);
  res.send('\ufeff' + csv); // BOMを追加してExcelで正しく表示
});
```

#### 3.4.2 インポート機能の実装

```javascript
// backend/api/routes/csv-import.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/csv/import', upload.single('file'), async (req, res) => {
  const userId = req.user.id;
  const { mergeMode = 'skip' } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'CSVファイルがアップロードされていません' });
  }

  const results = [];
  const errors = [];

  // CSVファイルをパース
  const stream = Readable.from(req.file.buffer.toString('utf-8'));
  
  stream
    .pipe(csv())
    .on('data', async (row) => {
      try {
        // データの検証
        if (!row.タイトル && !row.title) {
          errors.push({ row, error: 'タイトルが必須です' });
          return;
        }

        const bookData = {
          userId,
          title: row.タイトル || row.title,
          author: row.著者名 || row.author || '',
          isbn: row.ISBN || row.isbn || '',
          publisher: row.出版社 || row.publisher || '',
          totalPages: row.総ページ数 || row.totalPages ? parseInt(row.総ページ数 || row.totalPages) : null,
          currentPage: row.現在のページ数 || row.currentPage ? parseInt(row.現在のページ数 || row.currentPage) : 0,
          status: row.読書状況 || row.status || '未読',
          rating: row.評価 || row.rating ? parseFloat(row.評価 || row.rating) : null,
          completedDate: row.読了日 || row.completedDate ? new Date(row.読了日 || row.completedDate) : null,
          coverImageUrl: row.カバー画像URL || row.coverImageUrl || '',
        };

        // マージモードに応じて処理
        if (mergeMode === 'skip') {
          // 既存データをスキップ
          const existing = await Book.findOne({ userId, title: bookData.title });
          if (existing) {
            errors.push({ row, error: '既存のデータが存在します（スキップ）' });
            return;
          }
        } else if (mergeMode === 'update') {
          // 既存データを更新
          const existing = await Book.findOne({ userId, title: bookData.title });
          if (existing) {
            await Book.findByIdAndUpdate(existing._id, bookData);
            results.push({ action: 'updated', book: existing });
            return;
          }
        }

        // 新規作成
        const book = await Book.create(bookData);
        results.push({ action: 'created', book });
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    })
    .on('end', () => {
      res.json({
        success: true,
        importedCount: results.filter(r => r.action === 'created').length,
        updatedCount: results.filter(r => r.action === 'updated').length,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // 最初の10件のエラーのみ返す
      });
    });
});
```

### 3.5 API設計

#### 3.5.1 エクスポートAPI

- `GET /api/csv/export` - CSVファイルをダウンロード
  - クエリパラメータ:
    - `status`: 読書状況でフィルタ（オプション）
    - `rating`: 評価でフィルタ（オプション）
  - レスポンス: CSVファイル（ダウンロード）

#### 3.5.2 インポートAPI

- `POST /api/csv/import` - CSVファイルをアップロードしてインポート
  - リクエスト:
    - `file`: CSVファイル（multipart/form-data）
    - `mergeMode`: マージモード（"skip", "update", "create"）
  - レスポンス:
    ```json
    {
      "success": true,
      "importedCount": 10,
      "updatedCount": 2,
      "errorCount": 1,
      "errors": [
        {
          "row": 5,
          "error": "タイトルが必須です"
        }
      ]
    }
    ```

### 3.6 必要なパッケージ

```bash
npm install json2csv csv-parser multer
```

### 3.7 フロントエンド実装

#### 3.7.1 エクスポート機能

```vue
<template>
  <div class="csv-export">
    <button @click="exportCSV" class="btn btn-primary">
      CSVエクスポート
    </button>
  </div>
</template>

<script>
import apiClient from '@/api/client';

export default {
  methods: {
    async exportCSV() {
      try {
        const response = await apiClient.get('/api/csv/export', {
          responseType: 'blob',
        });

        // ファイルをダウンロード
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reading-records-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('エクスポートエラー:', error);
        alert('エクスポートに失敗しました');
      }
    },
  },
};
</script>
```

#### 3.7.2 インポート機能

```vue
<template>
  <div class="csv-import">
    <input
      type="file"
      accept=".csv"
      @change="handleFileSelect"
      ref="fileInput"
    />
    <select v-model="mergeMode">
      <option value="skip">既存データをスキップ</option>
      <option value="update">既存データを更新</option>
      <option value="create">すべて新規作成</option>
    </select>
    <button @click="importCSV" :disabled="!selectedFile">
      CSVインポート
    </button>
  </div>
</template>

<script>
import apiClient from '@/api/client';

export default {
  data() {
    return {
      selectedFile: null,
      mergeMode: 'skip',
    };
  },
  methods: {
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
    },
    async importCSV() {
      if (!this.selectedFile) return;

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('mergeMode', this.mergeMode);

      try {
        const response = await apiClient.post('/api/csv/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        alert(
          `${response.data.importedCount}件をインポートしました。` +
          `${response.data.updatedCount}件を更新しました。` +
          (response.data.errorCount > 0
            ? `${response.data.errorCount}件のエラーがありました。`
            : '')
        );
      } catch (error) {
        console.error('インポートエラー:', error);
        alert('インポートに失敗しました');
      }
    },
  },
};
</script>
```

### 3.8 エラーハンドリング

- CSV形式の検証
- 必須項目のチェック
- データ型の検証（数値、日付など）
- 文字エンコーディングの処理（UTF-8、Shift-JIS対応）
- ファイルサイズの制限

### 3.9 セキュリティ考慮事項

- ファイルサイズの制限（例: 10MB以下）
- ファイル形式の検証（CSVファイルのみ許可）
- 悪意のあるコードの実行防止
- データのサニタイズ

---

## 4. その他の追加機能（検討事項）

### 4.1 パスワードリセット機能

#### 4.1.1 機能概要
ユーザーがパスワードを忘れた場合に、メールアドレス経由でパスワードをリセットできる機能です。

#### 4.1.2 実装方針
- メールアドレスを入力してリセットリクエストを送信
- メールにリセットトークンを含むリンクを送信
- リンクから新しいパスワードを設定

#### 4.1.3 必要な技術
- メール送信サービス（SendGrid、AWS SES、Nodemailerなど）
- リセットトークンの生成と管理
- トークンの有効期限管理

#### 4.1.4 実装の優先度
- **優先度**: 中
- **実装時期**: Phase 2以降

---

### 4.2 統計・分析機能（読書量の可視化）

#### 4.2.1 機能概要
読書の進捗や統計を可視化する機能です。

#### 4.2.2 主な機能
- **読書量の可視化**
  - 月別・年別の読書冊数
  - 読書ページ数の推移
  - 読了冊数のグラフ表示
- **読書傾向の分析**
  - ジャンル別の読書傾向
  - 評価の分布
  - 読書速度の分析
- **目標設定と達成状況**
  - 年間読書目標の設定
  - 目標達成率の表示

#### 4.2.3 実装方針
- フロントエンド: チャートライブラリ（Chart.js、Rechartsなど）を使用
- バックエンド: 集計クエリで統計データを生成
- データのキャッシュ（パフォーマンス向上）

#### 4.2.4 実装の優先度
- **優先度**: 低
- **実装時期**: Phase 6以降

---

### 4.3 Notionデータベースのデータ識別キー（検討事項）

#### 4.3.1 概要
Notionデータベースへのエクスポート時に、既存データを更新するために使用する識別キーの検討事項です。

#### 4.3.2 検討候補

1. **ISBN**
   - **メリット**: 一意性が高い、国際標準
   - **デメリット**: ISBNがない書籍がある
   - **適用条件**: ISBNが存在する場合のみ

2. **タイトル + 著者名**
   - **メリット**: ほとんどの書籍に存在する情報
   - **デメリット**: 重複の可能性（同名の書籍、翻訳版など）
   - **適用条件**: タイトルと著者名が存在する場合

3. **タイトル + 著者名 + 出版社**
   - **メリット**: より高い一意性
   - **デメリット**: 出版社情報がない場合がある
   - **適用条件**: 3つの情報がすべて存在する場合

4. **カスタムID**
   - **メリット**: 確実な一意性
   - **デメリット**: Notionデータベースに専用プロパティを追加する必要がある
   - **適用条件**: ユーザーがNotionデータベースを準備する際に設定

#### 4.3.3 推奨アプローチ

**段階的な識別キーの使用**を推奨します：

1. まずISBNで検索（ISBNが存在する場合）
2. ISBNがない、または一致しない場合、タイトル+著者名で検索
3. それでも一致しない場合、新規データとして作成

このアプローチにより、最大限のデータ更新率を実現できます。

---

### 4.4 画像アップロード機能（カバー画像）

#### 4.4.1 機能概要
ユーザーがカバー画像を手動でアップロードできる機能です。Open Library APIで画像が取得できない場合や、より高品質な画像を使用したい場合に使用します。

#### 4.4.2 実装方針
- **画像ストレージ**: Vercel Blob Storage、AWS S3、Cloudinaryなど
- **画像形式**: JPEG、PNG、WebP
- **画像サイズ制限**: 5MB以下
- **画像のリサイズ**: アップロード時に自動リサイズ（推奨サイズ: 800x1200px）

#### 4.4.3 必要な技術
- ファイルアップロードライブラリ（multer、formidableなど）
- 画像処理ライブラリ（sharp、jimpなど）
- クラウドストレージサービス

#### 4.4.4 実装の優先度
- **優先度**: 低
- **実装時期**: Phase 6以降
- **補足**: Open Library APIでカバー画像を自動取得するため、手動アップロードは補完的な機能

#### 4.4.5 カバー画像取得の優先順位
1. **Open Library API**（自動取得、推奨）
   - 詳細は `book-cover-image-guide.md` を参照
2. **手動アップロード**（補完）
   - Open Library APIで画像が取得できない場合

---

## 5. 実装の優先順位

### Phase 1: CSVエクスポート・インポート（優先度高）
- 実装が比較的簡単
- 汎用的な機能
- ユーザーの要望が高い可能性

### Phase 2: Notion連携（優先度中）
- OAuth認証の実装が必要
- Notion APIの理解が必要
- より高度な機能

### Phase 3: パスワードリセット機能（優先度中）
- セキュリティ向上
- ユーザビリティの向上

### Phase 4: 統計・分析機能（優先度低）
- 読書習慣の可視化
- ユーザーのモチベーション向上

---

## 5. 参考資料

- [Notion API公式ドキュメント](https://developers.notion.com/)
- [Notion APIリファレンス](https://developers.notion.com/reference)
- [json2csv公式ドキュメント](https://github.com/zemirco/json2csv)
- [csv-parser公式ドキュメント](https://github.com/mafintosh/csv-parser)
- [multer公式ドキュメント](https://github.com/expressjs/multer)

---

これらの機能は、基本機能の実装が完了した後に追加開発を検討します。

