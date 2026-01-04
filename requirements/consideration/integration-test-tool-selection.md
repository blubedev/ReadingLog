# 結合テスト（統合テスト）ツール選定

## 1. 概要

この読書管理アプリケーションの結合テスト（統合テスト）を自動で構築するためのツール選定です。

### 1.1 結合テストの範囲

- **APIとデータベースの統合**: Express APIとMongoDBの統合テスト
- **APIエンドポイントの統合**: 複数のAPIエンドポイントを組み合わせたテスト
- **外部APIとの統合**: Open Library APIとの連携テスト（モック使用）
- **認証フローの統合**: JWT認証を含む一連のフロー

### 1.2 要件

- **Jestとの統合**: 既にJestをユニットテストに使用しているため、統合しやすい
- **Express APIのテスト**: Node.js + ExpressのバックエンドAPIをテスト
- **データベースのテスト**: MongoDBとの統合をテスト
- **モック機能**: 外部API（Open Library API）のモック
- **CI/CD統合**: GitHub Actionsで自動実行可能

---

## 2. 検討したツール

### 2.1 Jest + Supertest（推奨）

#### 概要
- **Jest**: 既に選定済みのテストフレームワーク
- **Supertest**: ExpressアプリケーションのHTTPリクエストをテストするライブラリ
- **公式サイト**: https://github.com/visionmedia/supertest
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **Jestとの完全統合**（既存のテスト環境を活用）
- ✅ **Express APIに特化**（HTTPリクエストのテストが容易）
- ✅ **データベース統合テスト**（MongoDBとの統合が容易）
- ✅ **モック機能**（Jestのモック機能を活用）
- ✅ **アサーション機能**（Jestのアサーションを使用）
- ✅ **設定が簡単**（追加の設定が最小限）
- ✅ **CI/CD統合**（GitHub Actionsで実行可能）

#### 実装例
```javascript
// __tests__/integration/books.test.js
const request = require('supertest');
const app = require('../../backend/index');
const mongoose = require('mongoose');
const User = require('../../backend/models/User');
const Book = require('../../backend/models/Book');

describe('Books API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // テスト用データベースに接続
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await User.deleteMany({});
    await Book.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // テストユーザーの作成と認証
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    userId = user._id;

    // ログインしてトークンを取得
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = response.body.token;
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '9781234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Test Book');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'Test Book',
          author: 'Test Author'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/books', () => {
    it('should return user\'s books', async () => {
      // テストデータの作成
      await Book.create({
        userId,
        title: 'Book 1',
        author: 'Author 1'
      });

      const response = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
```

#### コスト
- **無料**（オープンソース）

---

### 2.2 Mocha + Chai + Supertest

#### 概要
- **Mocha**: テストフレームワーク
- **Chai**: アサーションライブラリ
- **Supertest**: HTTPリクエストテスト
- **公式サイト**: https://mochajs.org/, https://www.chaijs.com/
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **柔軟な設定**（カスタマイズ性が高い）
- ✅ **豊富なプラグイン**
- ✅ **Supertestとの統合**
- ⚠️ **Jestとは別のフレームワーク**（既存のJest環境と統合が必要）
- ⚠️ **設定がやや複雑**

#### 実装例
```javascript
const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('Books API', () => {
  it('should create a book', (done) => {
    request(app)
      .post('/api/books')
      .send({ title: 'Test Book' })
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('title', 'Test Book');
        done();
      });
  });
});
```

#### コスト
- **無料**（オープンソース）

---

### 2.3 Postman + Newman

#### 概要
- **Postman**: APIテストツール（GUI）
- **Newman**: Postmanのコマンドライン実行ツール
- **公式サイト**: https://www.postman.com/, https://github.com/postmanlabs/newman
- **価格**: 無料プランあり

#### 特徴
- ✅ **GUIでテスト作成**（視覚的にテストを作成）
- ✅ **コレクション管理**（テストの整理が容易）
- ✅ **環境変数の管理**
- ✅ **CI/CD統合**（Newmanで自動実行）
- ⚠️ **Jestとは別ツール**（統合がやや複雑）
- ⚠️ **データベースの直接テストが困難**

#### 実装例
```json
// postman_collection.json
{
  "info": {
    "name": "Books API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Book",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"title\": \"Test Book\", \"author\": \"Test Author\"}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/books",
          "host": ["{{baseUrl}}"],
          "path": ["api", "books"]
        }
      }
    }
  ]
}
```

```bash
# Newmanで実行
newman run postman_collection.json -e postman_environment.json
```

#### コスト
- **無料プラン**: 基本的な機能は無料
- **有料プラン**: $12/月から

---

### 2.4 Cypress

#### 概要
- **公式サイト**: https://www.cypress.io/
- **ドキュメント**: https://docs.cypress.io/
- **価格**: 無料プランあり

#### 特徴
- ✅ **E2Eテストに特化**（ブラウザベース）
- ✅ **統合テストにも使用可能**
- ✅ **視覚的なテスト実行**
- ✅ **デバッグが容易**
- ⚠️ **主にフロントエンド向け**（バックエンドAPIの直接テストは困難）
- ⚠️ **Jestとは別のフレームワーク**

#### 実装例
```javascript
// cypress/integration/books.spec.js
describe('Books API Integration', () => {
  it('should create a book', () => {
    cy.request({
      method: 'POST',
      url: '/api/books',
      headers: {
        'Authorization': 'Bearer token'
      },
      body: {
        title: 'Test Book',
        author: 'Test Author'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('title', 'Test Book');
    });
  });
});
```

#### コスト
- **無料プラン**: 基本的な機能は無料
- **有料プラン**: $75/月から

---

### 2.5 Jest + MSW (Mock Service Worker)

#### 概要
- **Jest**: 既に選定済み
- **MSW**: APIモッキングライブラリ
- **公式サイト**: https://mswjs.io/
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **Jestとの完全統合**
- ✅ **APIモッキング**（外部APIのモックが容易）
- ✅ **ブラウザとNode.jsの両方で動作**
- ✅ **リアルなHTTPリクエストのモック**
- ⚠️ **Supertestと組み合わせる必要がある**（APIテスト用）

#### 実装例
```javascript
// __tests__/integration/books-with-mock.test.js
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import request from 'supertest';
import app from '../../backend/index';

const server = setupServer(
  rest.get('https://openlibrary.org/api/books', (req, res, ctx) => {
    return res(
      ctx.json({
        'ISBN:9781234567890': {
          title: 'Mock Book',
          authors: [{ name: 'Mock Author' }]
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Books API with External API Mock', () => {
  it('should fetch book info from Open Library API', async () => {
    const response = await request(app)
      .get('/api/books/search?q=9781234567890')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Mock Book');
  });
});
```

#### コスト
- **無料**（オープンソース）

---

## 3. 比較表

| 項目 | Jest + Supertest | Mocha + Chai + Supertest | Postman + Newman | Cypress | Jest + MSW |
|------|-----------------|-------------------------|------------------|---------|------------|
| **Jestとの統合** | ✅ 完全統合 | ⚠️ 別フレームワーク | ⚠️ 別ツール | ⚠️ 別フレームワーク | ✅ 完全統合 |
| **Express APIテスト** | ✅ 特化 | ✅ 対応 | ✅ 対応 | ⚠️ 限定的 | ✅ 対応 |
| **データベース統合** | ✅ 容易 | ✅ 容易 | ⚠️ 困難 | ⚠️ 困難 | ✅ 容易 |
| **外部APIモック** | ✅ Jestモック | ✅ プラグイン | ⚠️ 限定的 | ⚠️ 限定的 | ✅ 特化 |
| **設定の簡潔さ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **CI/CD統合** | ✅ 容易 | ✅ 容易 | ✅ 容易 | ✅ 容易 | ✅ 容易 |
| **コスト** | 無料 | 無料 | 無料〜$12/月 | 無料〜$75/月 | 無料 |
| **学習コスト** | 低い | 中程度 | 低い | 中程度 | 中程度 |

---

## 4. 選定結果

### 推奨: **Jest + Supertest + MSW**

**選定理由：**

1. **Jestとの完全統合**
   - 既にJestをユニットテストに使用しているため、統合が容易
   - 同じテスト環境でユニットテストと結合テストを実行可能
   - 設定の重複を避けられる

2. **Express APIに特化**
   - SupertestはExpressアプリケーションのテストに最適化
   - HTTPリクエストのテストが簡単
   - レスポンスの検証が容易

3. **データベース統合テスト**
   - MongoDBとの統合テストが容易
   - テスト用データベースのセットアップが簡単
   - テストデータのクリーンアップが容易

4. **外部APIのモック**
   - MSWを使用してOpen Library APIをモック
   - リアルなHTTPリクエストのモックが可能
   - テストの安定性が向上

5. **コスト効率**
   - すべて無料（オープンソース）
   - 追加のツールやサービスが不要

6. **CI/CD統合**
   - GitHub Actionsで簡単に実行可能
   - 既存のCI/CDパイプラインに統合しやすい

**補完として検討すべき場合：**
- GUIでテストを作成したい場合: Postman + Newman
- より高度なE2Eテストが必要な場合: Cypress

---

## 5. 実装方針

### 5.1 テストの階層構造

```
テスト
├── ユニットテスト (Jest)
│   ├── コンポーネントテスト
│   ├── ユーティリティ関数テスト
│   └── モデルテスト
├── 結合テスト (Jest + Supertest + MSW)
│   ├── APIエンドポイントテスト
│   ├── データベース統合テスト
│   ├── 認証フローテスト
│   └── 外部APIモックテスト
└── E2Eテスト (Selenium)
    ├── ユーザーフローテスト
    └── ブラウザテスト
```

### 5.2 テスト環境の設定

#### 5.2.1 パッケージのインストール

```bash
npm install --save-dev supertest msw
```

#### 5.2.2 Jest設定の拡張

`jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/integration/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

#### 5.2.3 テスト用データベースの設定

`jest.setup.js`:

```javascript
const mongoose = require('mongoose');

// テスト用データベースに接続
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/reading-app-test';
  await mongoose.connect(mongoUri);
});

// 各テスト後にデータベースをクリーンアップ
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// すべてのテスト後に接続を閉じる
afterAll(async () => {
  await mongoose.connection.close();
});
```

### 5.3 テストの実装例

#### 5.3.1 基本的なAPI統合テスト

```javascript
// __tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../backend/index');
const User = require('../../backend/models/User');

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 for duplicate email', async () => {
      // 既存ユーザーの作成
      await User.create({
        username: 'existing',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });
  });
});
```

#### 5.3.2 外部APIモックを使用したテスト

```javascript
// __tests__/integration/books-search.test.js
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import request from 'supertest';
import app from '../../backend/index';

const server = setupServer(
  rest.get('https://openlibrary.org/api/books', (req, res, ctx) => {
    const isbn = req.url.searchParams.get('bibkeys');
    return res(
      ctx.json({
        [`${isbn}`]: {
          title: 'Test Book Title',
          authors: [{ name: 'Test Author' }],
          publishers: [{ name: 'Test Publisher' }],
          number_of_pages: 300,
          cover: {
            large: 'https://example.com/cover.jpg'
          }
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Books Search API with External API Mock', () => {
  let authToken;

  beforeEach(async () => {
    // 認証トークンの取得
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = loginResponse.body.token;
  });

  it('should search books using Open Library API', async () => {
    const response = await request(app)
      .get('/api/books/search?q=9781234567890')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Test Book Title');
    expect(response.body[0].author).toBe('Test Author');
  });
});
```

---

## 6. CI/CD統合

### 6.1 GitHub Actionsワークフロー

`.github/workflows/integration-test.yml`:

```yaml
name: Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          MONGODB_TEST_URI: mongodb://localhost:27017/reading-app-test
          NODE_ENV: test
```

### 6.2 package.jsonのスクリプト

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathIgnorePatterns=integration",
    "test:integration": "jest --testPathPattern=integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 7. コスト

### 7.1 ツールのコスト

- **Jest**: 無料
- **Supertest**: 無料
- **MSW**: 無料
- **合計**: 無料

### 7.2 CI/CDコスト

- **GitHub Actions**: 無料プラン（2000分/月）で十分
- **MongoDBテスト用**: GitHub Actionsのサービスコンテナを使用（無料）

---

## 8. セキュリティのベストプラクティス

### 8.1 テストデータの管理

- ✅ テスト用データベースを使用（本番データベースとは分離）
- ✅ テスト後にデータをクリーンアップ
- ✅ 機密情報を含むテストデータは使用しない

### 8.2 環境変数の管理

- ✅ テスト用の環境変数を設定
- ✅ 本番環境の認証情報を使用しない

---

## 9. 結論

この読書管理アプリには**Jest + Supertest + MSWを推奨**します。

**主な理由：**
- ✅ Jestとの完全統合（既存環境を活用）
- ✅ Express APIのテストに最適
- ✅ データベース統合テストが容易
- ✅ 外部APIのモックが容易（MSW）
- ✅ すべて無料
- ✅ CI/CD統合が容易

**実装の優先順位：**
1. Supertestの導入と基本的なAPI統合テスト
2. データベース統合テストの実装
3. MSWを使用した外部APIモックテスト
4. CI/CDパイプラインへの統合

---

## 10. 参考資料

- [Supertest公式ドキュメント](https://github.com/visionmedia/supertest)
- [MSW公式ドキュメント](https://mswjs.io/)
- [Jest公式ドキュメント](https://jestjs.io/)
- [Express Testing Best Practices](https://expressjs.com/en/guide/testing.html)

---

この手順書に従って、結合テストを構築していきます。


