# CI/CDツール選定

## 1. 概要

この読書管理アプリケーションに最適なCI/CDツールを選定するための比較検討です。

### 1.1 要件

- **自動テスト**: Jest（ユニットテスト）とSelenium（E2Eテスト）を実行
- **自動デプロイ**: Vercelへの自動デプロイ
- **GitHub連携**: GitHubリポジトリと統合
- **コスト**: 無料プランまたは低コスト
- **設定の簡潔さ**: 開発初期から簡単に導入可能

---

## 2. 検討したCI/CDツール

### 2.1 GitHub Actions

#### 概要
- **公式サイト**: https://github.com/features/actions
- **ドキュメント**: https://docs.github.com/actions
- **価格**: 無料プランあり（制限あり）

#### 特徴
- ✅ **GitHubと完全統合**（追加設定不要）
- ✅ **無料プラン**（パブリックリポジトリ: 無制限、プライベート: 2000分/月）
- ✅ **設定が簡単**（YAMLファイルのみ）
- ✅ **豊富なアクション**（コミュニティが提供）
- ✅ **Vercelとの統合**（公式アクションあり）
- ✅ **マトリックスビルド**（複数バージョンでのテスト）
- ✅ **セルフホストランナー対応**
- ⚠️ **実行時間制限**（無料プラン: 20分/ジョブ、有料プラン: 360分/ジョブ）

#### 実装例
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

#### コスト
- **無料プラン**:
  - パブリックリポジトリ: 無制限
  - プライベートリポジトリ: 2000分/月
- **有料プラン**: $4/月（追加の実行時間）

---

### 2.2 CircleCI

#### 概要
- **公式サイト**: https://circleci.com/
- **ドキュメント**: https://circleci.com/docs/
- **価格**: 無料プランあり

#### 特徴
- ✅ **無料プラン**（2500クレジット/週）
- ✅ **並列実行**（無料プラン: 1並列、有料: 複数並列）
- ✅ **Dockerサポート**
- ✅ **キャッシュ機能**
- ⚠️ **設定がやや複雑**（.circleci/config.yml）
- ⚠️ **GitHub統合は追加設定が必要**

#### 実装例
```yaml
# .circleci/config.yml
version: 2.1
jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

#### コスト
- **無料プラン**: 2500クレジット/週（約400分/週）
- **有料プラン**: $15/月（10,000クレジット/週）

---

### 2.3 GitLab CI/CD

#### 概要
- **公式サイト**: https://about.gitlab.com/features/gitlab-ci-cd/
- **ドキュメント**: https://docs.gitlab.com/ee/ci/
- **価格**: 無料プランあり

#### 特徴
- ✅ **GitLabと完全統合**
- ✅ **無料プラン**（2000分/月）
- ✅ **Dockerサポート**
- ✅ **セルフホストランナー対応**
- ⚠️ **GitHubを使用している場合、別途GitLabが必要**
- ⚠️ **GitHubからGitLabへの移行が必要**

#### 実装例
```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test
    - npm run test:e2e
```

#### コスト
- **無料プラン**: 2000分/月
- **有料プラン**: $4/月（10,000分/月）

---

### 2.4 Jenkins

#### 概要
- **公式サイト**: https://www.jenkins.io/
- **ドキュメント**: https://www.jenkins.io/doc/
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **完全無料**（オープンソース）
- ✅ **高いカスタマイズ性**
- ✅ **豊富なプラグイン**
- ⚠️ **セルフホストが必要**（サーバーが必要）
- ⚠️ **設定が複雑**
- ⚠️ **メンテナンスが必要**
- ⚠️ **初期セットアップに時間がかかる**

#### コスト
- **無料**（ただし、サーバーコストが必要）

---

### 2.5 Travis CI

#### 概要
- **公式サイト**: https://www.travis-ci.com/
- **ドキュメント**: https://docs.travis-ci.com/
- **価格**: 有料（無料プラン廃止）

#### 特徴
- ⚠️ **無料プラン廃止**（2021年）
- ✅ **設定が簡単**（.travis.yml）
- ✅ **GitHub統合**
- ⚠️ **有料プラン**: $69/月から

#### コスト
- **有料プラン**: $69/月から

---

### 2.6 Vercel（ビルド・デプロイのみ）

#### 概要
- **公式サイト**: https://vercel.com/
- **ドキュメント**: https://vercel.com/docs
- **価格**: 無料プランあり

#### 特徴
- ✅ **自動デプロイ**（GitHub連携）
- ✅ **プレビューデプロイ**（PRごと）
- ✅ **無料プラン**
- ⚠️ **テスト実行は非対応**（ビルドとデプロイのみ）
- ⚠️ **CI/CDツールとしては不完全**

#### コスト
- **無料プラン**: 個人プロジェクト無制限

---

## 3. 比較表

| 項目 | GitHub Actions | CircleCI | GitLab CI/CD | Jenkins | Travis CI | Vercel |
|------|---------------|----------|--------------|---------|-----------|--------|
| **無料プラン** | ✅（2000分/月） | ✅（2500クレジット/週） | ✅（2000分/月） | ✅（セルフホスト） | ❌ | ✅ |
| **GitHub統合** | ✅ 完全統合 | ✅ | ⚠️ GitLab必要 | ✅ | ✅ | ✅ |
| **設定の簡潔さ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **テスト実行** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **自動デプロイ** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vercel連携** | ✅ 容易 | ⚠️ 可能 | ⚠️ 可能 | ⚠️ 可能 | ⚠️ 可能 | ✅ 完全統合 |
| **セットアップ時間** | 短い | 中程度 | 中程度 | 長い | 中程度 | 最短 |
| **メンテナンス** | 不要 | 不要 | 不要 | 必要 | 不要 | 不要 |
| **コスト** | 無料〜$4/月 | 無料〜$15/月 | 無料〜$4/月 | サーバーコスト | $69/月〜 | 無料 |

---

## 4. 選定結果

### 推奨: **GitHub Actions**

**選定理由：**

1. **GitHubとの完全統合**
   - GitHubリポジトリと完全統合
   - 追加の設定やアカウント作成が不要
   - PRごとに自動テスト実行

2. **無料プランで十分**
   - プライベートリポジトリ: 2000分/月
   - パブリックリポジトリ: 無制限
   - 小規模プロジェクトには十分

3. **設定が簡単**
   - YAMLファイルのみで設定
   - 豊富なコミュニティアクション
   - 学習コストが低い

4. **Vercelとの連携が容易**
   - Vercel公式アクションあり
   - テスト成功後に自動デプロイ可能

5. **テスト実行とデプロイの両方に対応**
   - Jest（ユニットテスト）の実行
   - Selenium（E2Eテスト）の実行
   - Vercelへの自動デプロイ

6. **マトリックスビルド**
   - 複数のNode.jsバージョンでテスト可能
   - 複数のOSでテスト可能

**補完として検討すべき場合：**
- より多くの並列実行が必要: CircleCI
- セルフホストが必要: Jenkins
- GitLabを使用している場合: GitLab CI/CD

---

## 5. 実装方針

### 5.1 CI/CDパイプラインの構成

```
[GitHub Push/PR]
    ↓
[GitHub Actions トリガー]
    ↓
[依存関係のインストール]
    ↓
[Lintチェック]
    ↓
[ユニットテスト (Jest)]
    ↓
[E2Eテスト (Selenium)]
    ↓
[ビルド]
    ↓
[Vercelへのデプロイ]
```

### 5.2 ワークフローの設計

#### 5.2.1 プルリクエスト時
- Lintチェック
- ユニットテスト（Jest）
- E2Eテスト（Selenium）
- ビルド確認
- プレビューデプロイ（オプション）

#### 5.2.2 メインブランチへのマージ時
- 上記すべてのテスト
- 本番環境へのデプロイ（Vercel）

### 5.3 テスト戦略

1. **ユニットテスト（Jest）**
   - バックエンドAPIのテスト
   - フロントエンドコンポーネントのテスト
   - 各機能の単体テスト

2. **E2Eテスト（Selenium）**
   - 主要なユーザーフローのテスト
   - 認証フローのテスト
   - 書籍登録フローのテスト
   - 進捗記録フローのテスト

3. **統合テスト**
   - APIとデータベースの統合テスト
   - 外部API（Open Library API）のモック

---

## 6. GitHub Actions実装例

### 6.1 基本的なCIワークフロー

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test
        env:
          NODE_ENV: test
      
      - name: Build
        run: npm run build

  e2e-test:
    runs-on: ubuntu-latest
    
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
      
      - name: Install Chrome
        uses: browser-actions/setup-chrome@latest
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
          CHROME_BIN: /usr/bin/google-chrome
```

### 6.2 デプロイワークフロー

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
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
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 6.3 必要なシークレット

GitHubリポジトリのSettings → Secrets and variables → Actionsで以下を設定：

- `VERCEL_TOKEN`: Vercelのアクセストークン
- `VERCEL_ORG_ID`: Vercelの組織ID
- `VERCEL_PROJECT_ID`: VercelのプロジェクトID
- `MONGODB_URI`: MongoDB接続文字列（テスト用）

---

## 7. テスト設定

### 7.1 Jest設定

`jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
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

### 7.2 Selenium設定

`selenium.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.test.js'],
  timeout: 30000,
  selenium: {
    serverUrl: 'http://localhost:4444',
    capabilities: {
      browserName: 'chrome',
      chromeOptions: {
        args: ['--headless', '--no-sandbox'],
      },
    },
  },
};
```

---

## 8. コスト

### 8.1 GitHub Actions

- **無料プラン**: 2000分/月
- **推定使用量**:
  - ユニットテスト: 約5分/回
  - E2Eテスト: 約10分/回
  - ビルド: 約3分/回
  - 合計: 約18分/回
  - 月間100回実行: 約1800分/月（無料プラン内）

### 8.2 合計コスト

**無料プランで運用可能**
- 小規模な開発では無料プランで十分
- 大規模な開発では有料プラン（$4/月）を検討

---

## 9. セキュリティのベストプラクティス

### 9.1 シークレット管理

- ✅ 機密情報はGitHub Secretsで管理
- ✅ 環境変数は適切に設定
- ✅ トークンは定期的にローテーション

### 9.2 コード品質

- ✅ Lintチェックを必須化
- ✅ テストカバレッジの閾値を設定
- ✅ コードレビューを必須化

---

## 10. トラブルシューティング

### 10.1 よくある問題

#### テストがタイムアウトする
- **原因**: E2Eテストの実行時間が長い
- **解決策**: タイムアウト時間を延長、またはテストを最適化

#### Vercelデプロイが失敗する
- **原因**: 環境変数の設定ミス
- **解決策**: Vercelダッシュボードで環境変数を確認

#### 並列実行でリソース不足
- **原因**: 無料プランの制限
- **解決策**: ジョブを順次実行に変更、または有料プランにアップグレード

---

## 11. 結論

この読書管理アプリには**GitHub Actionsを推奨**します。

**主な理由：**
- ✅ GitHubと完全統合
- ✅ 無料プランで十分
- ✅ 設定が簡単
- ✅ Vercelとの連携が容易
- ✅ テスト実行とデプロイの両方に対応

**実装の優先順位：**
1. 基本的なCIワークフロー（Lint、ユニットテスト）
2. E2Eテストの追加
3. 自動デプロイの設定

---

## 12. 参考資料

- [GitHub Actions公式ドキュメント](https://docs.github.com/actions)
- [GitHub Actionsワークフロー例](https://github.com/actions/starter-workflows)
- [Vercel GitHub Actions](https://github.com/amondnet/vercel-action)
- [Jest公式ドキュメント](https://jestjs.io/)
- [Selenium公式ドキュメント](https://www.selenium.dev/documentation/)

---

この手順書に従って、GitHub ActionsでCI/CDを構築していきます。


