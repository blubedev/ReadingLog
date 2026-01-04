# 読書管理アプリ

読書の進捗を管理し、読書記録を効率的に保存・閲覧できるWebアプリケーションです。

## プロジェクト概要

- **目的**: 読書の進捗を管理し、読書記録を効率的に保存・閲覧できるWebアプリケーション
- **対象ユーザー**: 読書習慣を身につけたい人、読んだ本を記録・管理したい人

## 技術スタック

- **フロントエンド**: Vue.js + Tailwind CSS
- **バックエンド**: Node.js + Express
- **データベース**: MongoDB Atlas
- **認証**: JWT (JSON Web Token)
- **デプロイ**: Vercel
- **外部API**: Open Library API (書籍情報取得)
- **OCR**: Tesseract.js (ページ数自動認識)

## 主な機能

- 本の登録（バーコード読み取り対応）
- 読書進捗の記録（カメラでページ数自動認識）
- メモ・感想の記録
- 読書状況の管理
- 検索・フィルタ機能

## ドキュメント

### 要件定義
- [要件定義書](./requirements/requirements.md)
- [将来追加予定の機能](./requirements/future-features.md)

### 技術選定・検討資料
- [認証方式の比較](./requirements/consideration/auth-comparison.md)
- [書籍情報取得API選定](./requirements/consideration/book-api-selection.md)
- [書籍カバー画像取得方法](./requirements/consideration/book-cover-image-guide.md)
- [バーコード読み取りライブラリ選定](./requirements/consideration/barcode-library-selection.md)
- [OCRライブラリ選定](./requirements/consideration/ocr-library-selection.md)
- [CI/CDツール選定](./requirements/consideration/cicd-tool-selection.md)
- [結合テストツール選定](./requirements/consideration/integration-test-tool-selection.md)
- [Vercelデプロイ手順](./requirements/consideration/vercel-deployment-guide.md)
- [AWSインフラ構築手順](./requirements/consideration/aws-infrastructure-setup.md)（参考）

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

## ライセンス

ISC


