# OCRライブラリ選定（ページ数自動認識機能）

## 1. 概要

本のページ番号をカメラで撮影し、OCR（光学文字認識）でページ数を自動認識する機能を実装するためのライブラリ選定です。

### 1.1 要件

- カメラで本のページ番号を撮影
- OCRでページ番号を認識
- 認識したページ数を自動入力
- 認識失敗時は再撮影または手動入力に切り替え可能

---

## 2. 検討したOCRライブラリ

### 2.1 Tesseract.js

#### 概要
- **公式サイト**: https://tesseract.projectnaptha.com/
- **GitHub**: https://github.com/naptha/tesseract.js
- **ライセンス**: Apache 2.0

#### 特徴
- ✅ **クライアント側で動作**（ブラウザ上で実行）
- ✅ **無料で利用可能**
- ✅ **オフライン対応**（インターネット接続不要）
- ✅ **プライバシー保護**（画像が外部サーバーに送信されない）
- ✅ **軽量**（WebAssembly版で高速）
- ✅ **JavaScript/TypeScript対応**
- ✅ **Vue.jsとの統合が容易**
- ⚠️ **認識精度**: 一般的なOCRライブラリと比較してやや低め（ただし、ページ番号のような数字認識は比較的高精度）
- ⚠️ **処理速度**: 初回読み込み時にモデルファイルのダウンロードが必要（約4-5MB）

#### 実装例
```javascript
import { createWorker } from 'tesseract.js';

const worker = await createWorker('eng');
const { data: { text } } = await worker.recognize(imageFile);
await worker.terminate();

// ページ番号を抽出（正規表現で数字を抽出）
const pageNumber = text.match(/\d+/)?.[0];
```

#### コスト
- **無料**（完全無料）

#### 利用制限
- なし（クライアント側で実行されるため）

---

### 2.2 Google Cloud Vision API

#### 概要
- **公式サイト**: https://cloud.google.com/vision
- **ドキュメント**: https://cloud.google.com/vision/docs

#### 特徴
- ✅ **高精度なOCR**（Googleの機械学習モデルを使用）
- ✅ **多言語対応**（日本語、英語など多数の言語に対応）
- ✅ **RESTful API**（サーバー側で処理）
- ✅ **画像の前処理機能**（自動補正など）
- ⚠️ **APIキーが必要**（Google Cloud Platformの登録が必要）
- ⚠️ **有料**（従量課金）
- ⚠️ **インターネット接続必須**
- ⚠️ **プライバシー懸念**（画像がGoogleのサーバーに送信される）
- ⚠️ **レート制限あり**

#### 実装例
```javascript
// サーバー側で実装
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

const [result] = await client.textDetection(imageBuffer);
const detections = result.textAnnotations;
const pageNumber = detections[0]?.description.match(/\d+/)?.[0];
```

#### コスト
- **無料枠**: 最初の1,000リクエスト/月は無料
- **従量課金**: 1,000リクエストあたり $1.50（テキスト検出）
- **月間10,000リクエスト**: 約$13.50/月

#### 利用制限
- リクエスト数による制限
- 1リクエストあたりの画像サイズ制限（20MB）

---

### 2.3 AWS Textract

#### 概要
- **公式サイト**: https://aws.amazon.com/textract/
- **ドキュメント**: https://docs.aws.amazon.com/textract/

#### 特徴
- ✅ **高精度なOCR**（AWSの機械学習モデルを使用）
- ✅ **AWS環境との統合が容易**（既にAWSを使用している場合）
- ✅ **RESTful API**（サーバー側で処理）
- ✅ **多言語対応**
- ⚠️ **AWSアカウントが必要**
- ⚠️ **有料**（従量課金）
- ⚠️ **インターネット接続必須**
- ⚠️ **プライバシー懸念**（画像がAWSのサーバーに送信される）
- ⚠️ **レート制限あり**

#### 実装例
```javascript
// サーバー側で実装
const AWS = require('aws-sdk');
const textract = new AWS.Textract();

const params = {
  Document: { Bytes: imageBuffer }
};

const result = await textract.DetectDocumentText(params).promise();
const pageNumber = result.Blocks
  .filter(block => block.BlockType === 'WORD')
  .map(block => block.Text)
  .join(' ')
  .match(/\d+/)?.[0];
```

#### コスト
- **無料枠**: なし
- **従量課金**: 1,000ページあたり $1.50（テキスト検出）
- **月間10,000リクエスト**: 約$15/月

#### 利用制限
- リクエスト数による制限
- 1リクエストあたりの画像サイズ制限（500MB）

---

## 3. 比較表

| 項目 | Tesseract.js | Google Cloud Vision API | AWS Textract |
|------|-------------|------------------------|--------------|
| **実行場所** | クライアント側（ブラウザ） | サーバー側 | サーバー側 |
| **コスト** | 無料 | 有料（従量課金） | 有料（従量課金） |
| **認識精度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **処理速度** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **オフライン対応** | ✅ | ❌ | ❌ |
| **プライバシー** | ✅（画像が外部に送信されない） | ⚠️（Googleサーバーに送信） | ⚠️（AWSサーバーに送信） |
| **セットアップ** | 簡単（npm installのみ） | 中程度（APIキー設定） | 中程度（AWS認証設定） |
| **インターネット接続** | 不要（初回のみモデルダウンロード） | 必須 | 必須 |
| **APIキー** | 不要 | 必要 | 必要（AWS認証） |
| **レート制限** | なし | あり | あり |
| **Vue.js統合** | ✅ 容易 | ⚠️ サーバー側実装が必要 | ⚠️ サーバー側実装が必要 |

---

## 4. 選定結果

### 推奨: **Tesseract.js**

**選定理由：**

1. **コスト効率**
   - 完全無料で利用可能
   - 従量課金がないため、ユーザー数が増えてもコストが増えない
   - 開発初期からコストを気にせず実装できる

2. **プライバシー保護**
   - 画像が外部サーバーに送信されない
   - ユーザーのプライバシーを保護できる
   - GDPR等の規制にも対応しやすい

3. **オフライン対応**
   - インターネット接続がなくても動作
   - ユーザビリティが向上
   - モバイル環境でも安定して動作

4. **実装の簡潔さ**
   - クライアント側で完結するため、サーバー側の実装が不要
   - Vue.jsとの統合が容易
   - npm installのみで導入可能

5. **スケーラビリティ**
   - サーバー側のリソースを消費しない
   - ユーザー数が増えてもサーバー負荷が増えない
   - レート制限がない

6. **ページ番号認識の精度**
   - ページ番号のような数字認識は比較的高精度
   - シンプルな数字認識であれば十分な精度

**課題と対策：**

1. **認識精度**
   - **課題**: 複雑な文字や手書き文字の認識精度がやや低い
   - **対策**: ページ番号は通常、印刷された数字なので十分な精度が期待できる
   - **対策**: 認識結果をユーザーが確認・修正できるUIを提供

2. **初回読み込み時間**
   - **課題**: 初回読み込み時にモデルファイル（約4-5MB）のダウンロードが必要
   - **対策**: プログレスバーで読み込み状況を表示
   - **対策**: Service Workerでキャッシュして2回目以降は高速化

3. **処理速度**
   - **課題**: サーバー側のAPIと比較してやや遅い
   - **対策**: WebAssembly版を使用して高速化
   - **対策**: 非同期処理でUIをブロックしない

---

## 5. 実装方針

### 5.1 基本的な実装フロー

1. **カメラアクセスの取得**
   - ユーザーにカメラアクセスの許可を要求
   - リアルタイムプレビューを表示

2. **画像のキャプチャ**
   - ユーザーがページ番号を撮影
   - 画像を取得

3. **OCR処理**
   - Tesseract.jsで画像を解析
   - ページ番号を抽出（正規表現で数字を抽出）

4. **結果の表示と確認**
   - 認識したページ番号を表示
   - ユーザーが確認・修正可能

5. **進捗の更新**
   - 確認後、進捗を更新

### 5.2 エラーハンドリング

1. **認識失敗時**
   - エラーメッセージを表示
   - 再撮影ボタンを表示
   - 手動入力に切り替え可能

2. **カメラアクセス拒否時**
   - 手動入力フォームを表示
   - カメラアクセスの許可方法を案内

3. **認識結果が不正な場合**
   - 認識結果を表示し、ユーザーが修正可能
   - 数値以外の文字が含まれる場合は警告を表示

### 5.3 パフォーマンス最適化

1. **モデルファイルのキャッシュ**
   - Service Workerでモデルファイルをキャッシュ
   - 2回目以降の読み込みを高速化

2. **画像の前処理**
   - 画像のリサイズ（必要に応じて）
   - コントラストの調整（オプション）

3. **非同期処理**
   - Web WorkerでOCR処理を実行
   - UIをブロックしない

---

## 6. 実装例

### 6.1 Vue.jsコンポーネント例

```vue
<template>
  <div class="page-recognition">
    <video ref="video" v-show="isStreaming" autoplay></video>
    <canvas ref="canvas" style="display: none;"></canvas>
    
    <button @click="startCamera" v-if="!isStreaming">カメラを起動</button>
    <button @click="captureAndRecognize" v-if="isStreaming">撮影して認識</button>
    <button @click="stopCamera" v-if="isStreaming">カメラを停止</button>
    
    <div v-if="recognizedPage">
      <p>認識したページ数: {{ recognizedPage }}</p>
      <input v-model.number="correctedPage" type="number" />
      <button @click="updateProgress">進捗を更新</button>
    </div>
  </div>
</template>

<script>
import { createWorker } from 'tesseract.js';

export default {
  data() {
    return {
      isStreaming: false,
      stream: null,
      recognizedPage: null,
      correctedPage: null,
      worker: null
    };
  },
  async mounted() {
    // Tesseract.jsワーカーの初期化
    this.worker = await createWorker('eng');
  },
  beforeUnmount() {
    this.stopCamera();
    if (this.worker) {
      this.worker.terminate();
    }
  },
  methods: {
    async startCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        this.$refs.video.srcObject = this.stream;
        this.isStreaming = true;
      } catch (error) {
        console.error('カメラアクセスエラー:', error);
        alert('カメラにアクセスできませんでした');
      }
    },
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
        this.isStreaming = false;
      }
    },
    async captureAndRecognize() {
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const context = canvas.getContext('2d');
      
      // キャンバスに画像を描画
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // 画像を取得
      const imageData = canvas.toDataURL('image/png');
      
      try {
        // OCR処理
        const { data: { text } } = await this.worker.recognize(imageData);
        
        // ページ番号を抽出（数字を抽出）
        const pageMatch = text.match(/\d+/);
        if (pageMatch) {
          this.recognizedPage = parseInt(pageMatch[0]);
          this.correctedPage = this.recognizedPage;
        } else {
          alert('ページ番号を認識できませんでした。再撮影してください。');
        }
      } catch (error) {
        console.error('OCRエラー:', error);
        alert('認識中にエラーが発生しました');
      }
    },
    async updateProgress() {
      // 進捗を更新するAPI呼び出し
      try {
        await this.$api.put(`/api/books/${this.bookId}/progress`, {
          page: this.correctedPage
        });
        this.$emit('progress-updated', this.correctedPage);
      } catch (error) {
        console.error('進捗更新エラー:', error);
        alert('進捗の更新に失敗しました');
      }
    }
  }
};
</script>
```

### 6.2 パッケージインストール

```bash
npm install tesseract.js
```

---

## 7. 結論

この読書管理アプリには**Tesseract.jsを推奨**します。

**主な理由：**
- ✅ 完全無料で利用可能
- ✅ プライバシー保護（画像が外部に送信されない）
- ✅ オフライン対応
- ✅ クライアント側で完結するため実装が簡単
- ✅ サーバー負荷がかからない
- ✅ ページ番号のような数字認識には十分な精度

**補完として検討すべき場合：**
- より高精度な認識が必要になった場合: Google Cloud Vision API
- 既にAWS環境を構築している場合: AWS Textract

---

## 8. 参考資料

- [Tesseract.js公式ドキュメント](https://tesseract.projectnaptha.com/)
- [Tesseract.js GitHub](https://github.com/naptha/tesseract.js)
- [Google Cloud Vision API](https://cloud.google.com/vision)
- [AWS Textract](https://aws.amazon.com/textract/)


