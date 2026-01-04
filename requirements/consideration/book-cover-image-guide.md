# 書籍カバー画像取得方法

## 1. 概要

書籍のカバー画像を取得する方法の検討です。Open Library APIを主に使用し、補完的な方法も検討します。

### 1.1 要件

- 書籍登録時にカバー画像を自動取得
- ISBNまたはタイトルからカバー画像を取得
- 画像が取得できない場合のフォールバック
- 画像の品質とサイズの考慮

---

## 2. Open Library APIでのカバー画像取得

### 2.1 基本的な取得方法

Open Library APIでは、書籍情報に`cover_i`（カバー画像ID）が含まれる場合があります。このIDを使用してカバー画像URLを生成できます。

#### 2.1.1 画像URLの形式

```
https://covers.openlibrary.org/b/id/{cover_i}-{size}.jpg
```

**サイズオプション:**
- `S` (Small): 小さいサイズ
- `M` (Medium): 中サイズ
- `L` (Large): 大サイズ

#### 2.1.2 ISBN検索での取得

```javascript
// ISBN検索のレスポンス例
{
  "ISBN:9784774163666": {
    "title": "書籍タイトル",
    "authors": [{"name": "著者名"}],
    "cover": {
      "large": "https://covers.openlibrary.org/b/id/123456-L.jpg",
      "medium": "https://covers.openlibrary.org/b/id/123456-M.jpg",
      "small": "https://covers.openlibrary.org/b/id/123456-S.jpg"
    }
  }
}
```

#### 2.1.3 タイトル検索での取得

```javascript
// タイトル検索のレスポンス例
{
  "numFound": 10,
  "docs": [
    {
      "title": "書籍タイトル",
      "cover_i": 123456,
      "isbn": ["9784774163666"]
    }
  ]
}
```

`cover_i`から画像URLを生成：
```javascript
const coverImageUrl = `https://covers.openlibrary.org/b/id/${cover_i}-L.jpg`;
```

### 2.2 実装例

```javascript
// backend/api/services/openLibraryService.js
const axios = require('axios');

class OpenLibraryService {
  constructor() {
    this.baseUrl = 'https://openlibrary.org';
  }

  /**
   * ISBNから書籍情報とカバー画像を取得
   */
  async getBookByISBN(isbn) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/books`,
        {
          params: {
            bibkeys: `ISBN:${isbn}`,
            format: 'json',
            jscmd: 'data'
          }
        }
      );

      const bookData = response.data[`ISBN:${isbn}`];
      if (!bookData) {
        return null;
      }

      // カバー画像URLの取得
      let coverImageUrl = null;
      if (bookData.cover) {
        // coverオブジェクトから直接取得
        coverImageUrl = bookData.cover.large || bookData.cover.medium || bookData.cover.small;
      } else if (bookData.cover_i) {
        // cover_iからURLを生成
        coverImageUrl = `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg`;
      }

      return {
        title: bookData.title,
        authors: bookData.authors?.map(a => a.name) || [],
        isbn: isbn,
        publisher: bookData.publishers?.[0]?.name || '',
        publishDate: bookData.publish_date || '',
        totalPages: bookData.number_of_pages || null,
        coverImageUrl: coverImageUrl,
        description: bookData.description?.value || bookData.description || '',
      };
    } catch (error) {
      console.error('Open Library API エラー:', error);
      throw error;
    }
  }

  /**
   * タイトルから書籍情報とカバー画像を取得
   */
  async searchBooksByTitle(title) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search.json`,
        {
          params: {
            title: title,
            limit: 10
          }
        }
      );

      return response.data.docs.map(doc => {
        // カバー画像URLの生成
        let coverImageUrl = null;
        if (doc.cover_i) {
          coverImageUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        }

        return {
          title: doc.title,
          authors: doc.author_name || [],
          isbn: doc.isbn?.[0] || '',
          publisher: doc.publisher?.[0] || '',
          publishDate: doc.publish_date?.[0] || '',
          totalPages: doc.number_of_pages_median || null,
          coverImageUrl: coverImageUrl,
        };
      });
    } catch (error) {
      console.error('Open Library API エラー:', error);
      throw error;
    }
  }
}

module.exports = new OpenLibraryService();
```

### 2.3 画像URLの検証

取得した画像URLが有効かどうかを確認する処理：

```javascript
async function validateImageUrl(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
```

---

## 3. 補完的なカバー画像取得方法

Open Library APIで画像が取得できない場合のフォールバック方法です。

### 3.1 OpenBD API（日本の書籍）

#### 概要
- **URL**: https://openbd.jp/
- **特徴**: 日本の書籍の書影を提供
- **APIキー**: 不要

#### 実装例

```javascript
async function getCoverFromOpenBD(isbn) {
  try {
    const response = await axios.get(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    const data = response.data[0];
    
    if (data && data.summary && data.summary.cover) {
      return data.summary.cover;
    }
    return null;
  } catch (error) {
    console.error('OpenBD API エラー:', error);
    return null;
  }
}
```

### 3.2 OpenCover API

#### 概要
- **URL**: https://opencover.jp/
- **特徴**: ISBNからカバー画像を取得
- **APIキー**: 不要

#### 実装例

```javascript
function getCoverFromOpenCover(isbn) {
  // ISBN-13に変換（必要に応じて）
  const isbn13 = convertToISBN13(isbn);
  
  // カバー画像URLを生成
  return `https://image.opencover.jp/v1/cover/spine/${isbn13}.webp`;
}
```

### 3.3 Google Books API

#### 概要
- **URL**: https://developers.google.com/books
- **特徴**: カバー画像を提供
- **APIキー**: 必要

#### 実装例

```javascript
async function getCoverFromGoogleBooks(isbn) {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/books/v1/volumes',
      {
        params: {
          q: `isbn:${isbn}`,
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      }
    );

    if (response.data.items && response.data.items.length > 0) {
      const volumeInfo = response.data.items[0].volumeInfo;
      return volumeInfo.imageLinks?.thumbnail || 
             volumeInfo.imageLinks?.smallThumbnail || 
             null;
    }
    return null;
  } catch (error) {
    console.error('Google Books API エラー:', error);
    return null;
  }
}
```

---

## 4. 推奨実装方針

### 4.1 フォールバックチェーンの実装

カバー画像を取得する際は、以下の順序で試行することを推奨します：

1. **Open Library API**（プライマリ）
   - 国際的な書籍に対応
   - 無料でAPIキー不要

2. **OpenBD API**（日本の書籍の補完）
   - 日本の書籍でOpen Library APIに画像がない場合

3. **OpenCover API**（ISBNベースの補完）
   - ISBNがある場合の最終手段

4. **デフォルト画像**（すべて失敗した場合）
   - プレースホルダー画像を表示

### 4.2 実装例（フォールバックチェーン）

```javascript
async function getBookCoverImage(isbn, title) {
  let coverImageUrl = null;

  // 1. Open Library APIを試行
  try {
    const bookData = await openLibraryService.getBookByISBN(isbn);
    if (bookData && bookData.coverImageUrl) {
      const isValid = await validateImageUrl(bookData.coverImageUrl);
      if (isValid) {
        return bookData.coverImageUrl;
      }
    }
  } catch (error) {
    console.error('Open Library API エラー:', error);
  }

  // 2. OpenBD APIを試行（日本の書籍の場合）
  try {
    coverImageUrl = await getCoverFromOpenBD(isbn);
    if (coverImageUrl) {
      const isValid = await validateImageUrl(coverImageUrl);
      if (isValid) {
        return coverImageUrl;
      }
    }
  } catch (error) {
    console.error('OpenBD API エラー:', error);
  }

  // 3. OpenCover APIを試行
  try {
    coverImageUrl = getCoverFromOpenCover(isbn);
    if (coverImageUrl) {
      const isValid = await validateImageUrl(coverImageUrl);
      if (isValid) {
        return coverImageUrl;
      }
    }
  } catch (error) {
    console.error('OpenCover API エラー:', error);
  }

  // 4. デフォルト画像を返す
  return '/images/default-book-cover.png';
}
```

---

## 5. 画像の最適化

### 5.1 画像サイズの選択

- **一覧表示**: 中サイズ（M）または小サイズ（S）
- **詳細表示**: 大サイズ（L）
- **サムネイル**: 小サイズ（S）

### 5.2 画像のキャッシュ

- 取得した画像URLをデータベースに保存
- 同じISBNで再検索する際は、保存されたURLを使用
- 画像URLの有効期限を考慮（定期的な検証）

### 5.3 画像のCDN配信

- VercelのCDNを活用
- 画像の最適化（WebP形式への変換など）

---

## 6. エラーハンドリング

### 6.1 よくあるエラー

1. **画像が存在しない**
   - デフォルト画像を表示
   - ユーザーに手動で画像をアップロードするオプションを提供

2. **APIのレート制限**
   - リトライロジックの実装
   - キャッシュの活用

3. **ネットワークエラー**
   - タイムアウト設定
   - エラーメッセージの表示

---

## 7. 実装の優先順位

### Phase 1: Open Library APIの実装
- 基本的なカバー画像取得機能
- ISBN検索とタイトル検索の両方に対応

### Phase 2: フォールバック機能の追加
- OpenBD APIの統合
- OpenCover APIの統合

### Phase 3: 画像の最適化
- 画像サイズの最適化
- キャッシュ機能の実装

---

## 8. 参考資料

- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers)
- [OpenBD API](https://openbd.jp/)
- [OpenCover API](https://opencover.jp/)
- [Google Books API](https://developers.google.com/books)

---

この手順書に従って、書籍カバー画像の取得機能を実装していきます。

