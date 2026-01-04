# バーコード読み取りライブラリ選定

## 1. 概要

本のバーコード（ISBN）をカメラで読み取る機能を実装するためのライブラリ選定です。

### 1.1 要件

- カメラで本のバーコード（ISBN）を読み取る
- ISBN-10、ISBN-13の両方に対応
- リアルタイムでバーコードをスキャン
- 読み取り成功時に自動で書籍情報を検索
- 読み取り失敗時は再試行または手動入力に切り替え可能
- Vue.jsとの統合が容易

---

## 2. 検討したライブラリ

### 2.1 html5-qrcode

#### 概要
- **公式サイト**: https://github.com/mebjas/html5-qrcode
- **GitHub**: https://github.com/mebjas/html5-qrcode
- **ライセンス**: Apache 2.0
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **QRコードとバーコードの両方に対応**
- ✅ **Vue.jsとの統合が容易**
- ✅ **TypeScript対応**
- ✅ **軽量**（約50KB）
- ✅ **モバイル対応**（iOS、Android）
- ✅ **複数のバーコード形式に対応**（EAN-13、EAN-8、UPC-A、UPC-E、Code-128など）
- ✅ **カスタマイズ性が高い**
- ✅ **アクティブにメンテナンスされている**
- ⚠️ **バーコード読み取りの精度**: QRコードに比べてやや低め（ただし、ISBNバーコードには十分）

#### 実装例
```vue
<template>
  <div class="barcode-scanner">
    <div id="reader" ref="scanner"></div>
    <button @click="stopScanning">停止</button>
  </div>
</template>

<script>
import { Html5Qrcode } from 'html5-qrcode';

export default {
  data() {
    return {
      html5QrCode: null,
    };
  },
  mounted() {
    this.startScanning();
  },
  beforeUnmount() {
    this.stopScanning();
  },
  methods: {
    async startScanning() {
      this.html5QrCode = new Html5Qrcode('reader');
      
      try {
        await this.html5QrCode.start(
          { facingMode: 'environment' }, // バックカメラ
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
          },
          (decodedText, decodedResult) => {
            // バーコード読み取り成功
            this.onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // エラー処理（読み取り失敗は無視）
          }
        );
      } catch (err) {
        console.error('スキャン開始エラー:', err);
      }
    },
    async stopScanning() {
      if (this.html5QrCode) {
        await this.html5QrCode.stop().catch(console.error);
        this.html5QrCode.clear();
      }
    },
    onScanSuccess(isbn) {
      this.stopScanning();
      // ISBNで書籍情報を検索
      this.$emit('barcode-scanned', isbn);
    },
  },
};
</script>
```

#### コスト
- **無料**（完全無料）

#### 利用制限
- なし

---

### 2.2 QuaggaJS

#### 概要
- **公式サイト**: https://serratus.github.io/quaggaJS/
- **GitHub**: https://github.com/serratus/quaggaJS
- **ライセンス**: MIT
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **バーコード専用**（QRコード非対応）
- ✅ **多くのバーコード形式に対応**（EAN、UPC、Code-128、Code-39など）
- ✅ **軽量**（約100KB）
- ✅ **カスタマイズ性が高い**
- ⚠️ **メンテナンス状況**: 最近の更新が少ない（2021年以降）
- ⚠️ **Vue.js統合**: 手動で統合する必要がある
- ⚠️ **モバイル対応**: iOSで一部問題がある可能性

#### 実装例
```vue
<template>
  <div class="barcode-scanner">
    <div id="interactive" ref="scanner"></div>
    <button @click="stopScanning">停止</button>
  </div>
</template>

<script>
import Quagga from 'quagga';

export default {
  mounted() {
    this.startScanning();
  },
  beforeUnmount() {
    this.stopScanning();
  },
  methods: {
    startScanning() {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: this.$refs.scanner,
            constraints: {
              facingMode: 'environment',
            },
          },
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'upc_reader',
              'upc_e_reader',
            ],
          },
        },
        (err) => {
          if (err) {
            console.error('Quagga初期化エラー:', err);
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected((result) => {
        const isbn = result.codeResult.code;
        this.onScanSuccess(isbn);
      });
    },
    stopScanning() {
      Quagga.stop();
    },
    onScanSuccess(isbn) {
      this.stopScanning();
      this.$emit('barcode-scanned', isbn);
    },
  },
};
</script>
```

#### コスト
- **無料**（完全無料）

#### 利用制限
- なし

---

### 2.3 ZXing (Zebra Crossing)

#### 概要
- **公式サイト**: https://github.com/zxing-js/library
- **GitHub**: https://github.com/zxing-js/library
- **ライセンス**: Apache 2.0
- **価格**: 無料（オープンソース）

#### 特徴
- ✅ **QRコードとバーコードの両方に対応**
- ✅ **多くのバーコード形式に対応**
- ✅ **Java版が有名**（JavaScript版も存在）
- ✅ **高精度な読み取り**
- ⚠️ **JavaScript版のメンテナンス**: 活発ではない
- ⚠️ **Vue.js統合**: 手動で統合する必要がある
- ⚠️ **ドキュメント**: JavaScript版のドキュメントが少ない

#### 実装例
```vue
<template>
  <div class="barcode-scanner">
    <video ref="video" autoplay></video>
    <canvas ref="canvas" style="display: none;"></canvas>
    <button @click="stopScanning">停止</button>
  </div>
</template>

<script>
import { BrowserMultiFormatReader } from '@zxing/library';

export default {
  data() {
    return {
      codeReader: null,
      stream: null,
    };
  },
  mounted() {
    this.startScanning();
  },
  beforeUnmount() {
    this.stopScanning();
  },
  methods: {
    async startScanning() {
      this.codeReader = new BrowserMultiFormatReader();
      
      try {
        const videoInputDevices = await this.codeReader.listVideoInputDevices();
        const selectedDeviceId = videoInputDevices.find(
          device => device.label.includes('back') || device.label.includes('environment')
        )?.deviceId || videoInputDevices[0]?.deviceId;

        this.codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          this.$refs.video,
          (result, err) => {
            if (result) {
              const isbn = result.getText();
              this.onScanSuccess(isbn);
            }
          }
        );
      } catch (err) {
        console.error('スキャン開始エラー:', err);
      }
    },
    stopScanning() {
      if (this.codeReader) {
        this.codeReader.reset();
      }
    },
    onScanSuccess(isbn) {
      this.stopScanning();
      this.$emit('barcode-scanned', isbn);
    },
  },
};
</script>
```

#### コスト
- **無料**（完全無料）

#### 利用制限
- なし

---

## 3. 比較表

| 項目 | html5-qrcode | QuaggaJS | ZXing |
|------|-------------|----------|-------|
| **QRコード対応** | ✅ | ❌ | ✅ |
| **バーコード対応** | ✅ | ✅ | ✅ |
| **ISBN対応** | ✅ | ✅ | ✅ |
| **Vue.js統合** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **TypeScript対応** | ✅ | ⚠️ 部分的 | ⚠️ 部分的 |
| **軽量性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **メンテナンス状況** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **ドキュメント** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **モバイル対応** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **カスタマイズ性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **実装の簡潔さ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **コスト** | 無料 | 無料 | 無料 |

---

## 4. 選定結果

### 推奨: **html5-qrcode**

**選定理由：**

1. **Vue.jsとの統合が容易**
   - Vue.jsコンポーネントとして簡単に実装可能
   - TypeScript対応で型安全性が高い

2. **メンテナンス状況**
   - アクティブにメンテナンスされている
   - 定期的なアップデート
   - コミュニティが活発

3. **機能性**
   - QRコードとバーコードの両方に対応
   - ISBNバーコード（EAN-13、UPC-Aなど）に対応
   - 複数のバーコード形式をサポート

4. **実装の簡潔さ**
   - シンプルなAPI
   - 設定が簡単
   - ドキュメントが充実

5. **モバイル対応**
   - iOS、Androidの両方で動作
   - カメラアクセスの処理が容易

6. **軽量**
   - 約50KBと軽量
   - パフォーマンスに優れる

**補完として検討すべき場合：**
- バーコード専用で高精度が必要: QuaggaJS
- より高度なカスタマイズが必要: ZXing

---

## 5. 実装方針

### 5.1 基本的な実装フロー

1. **カメラアクセスの取得**
   - ユーザーにカメラアクセスの許可を要求
   - バックカメラ（environment）を優先

2. **バーコードスキャンの開始**
   - html5-qrcodeでスキャンを開始
   - ISBNバーコード形式（EAN-13、UPC-Aなど）を指定

3. **読み取り成功時の処理**
   - ISBNを取得
   - スキャンを停止
   - 書籍情報を検索（Open Library API）

4. **エラーハンドリング**
   - 読み取り失敗時は継続スキャン
   - カメラアクセス拒否時は手動入力に切り替え

### 5.2 エラーハンドリング

1. **カメラアクセス拒否時**
   - エラーメッセージを表示
   - 手動入力フォームを表示
   - カメラアクセスの許可方法を案内

2. **読み取り失敗時**
   - 継続してスキャン（エラーは無視）
   - タイムアウト設定（例: 30秒）
   - 手動入力ボタンを表示

3. **無効なISBN時**
   - ISBN形式の検証
   - エラーメッセージを表示
   - 再スキャンまたは手動入力

### 5.3 パフォーマンス最適化

1. **スキャン領域の制限**
   - スキャン領域を指定してパフォーマンス向上
   - 不要な領域の処理を削減

2. **FPSの調整**
   - 適切なFPS設定（10fps程度）
   - バッテリー消費を考慮

3. **メモリ管理**
   - コンポーネントのアンマウント時にスキャンを停止
   - メモリリークの防止

---

## 6. 実装例

### 6.1 Vue.jsコンポーネント例

```vue
<template>
  <div class="barcode-scanner">
    <div v-if="isScanning" class="scanner-container">
      <div id="barcode-reader" ref="scanner"></div>
      <div class="scanner-overlay">
        <div class="scan-line"></div>
        <p class="scan-hint">バーコードを枠内に合わせてください</p>
      </div>
      <button @click="stopScanning" class="btn-stop">停止</button>
    </div>
    
    <div v-else class="manual-input">
      <button @click="startScanning" class="btn-start">
        カメラでスキャン
      </button>
      <p>または</p>
      <input
        v-model="manualISBN"
        type="text"
        placeholder="ISBNを手動入力"
        @keyup.enter="onManualInput"
      />
      <button @click="onManualInput" class="btn-submit">検索</button>
    </div>
  </div>
</template>

<script>
import { Html5Qrcode } from 'html5-qrcode';
import { Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default {
  data() {
    return {
      html5QrCode: null,
      isScanning: false,
      manualISBN: '',
    };
  },
  beforeUnmount() {
    this.stopScanning();
  },
  methods: {
    async startScanning() {
      try {
        this.html5QrCode = new Html5Qrcode('barcode-reader');
        this.isScanning = true;

        await this.html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
            aspectRatio: 1.0,
          },
          (decodedText, decodedResult) => {
            // バーコード読み取り成功
            this.onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // エラーは無視（継続スキャン）
          }
        );
      } catch (err) {
        console.error('スキャン開始エラー:', err);
        this.isScanning = false;
        alert('カメラにアクセスできませんでした');
      }
    },
    async stopScanning() {
      if (this.html5QrCode && this.isScanning) {
        try {
          await this.html5QrCode.stop();
          this.html5QrCode.clear();
        } catch (err) {
          console.error('スキャン停止エラー:', err);
        }
        this.isScanning = false;
      }
    },
    onScanSuccess(isbn) {
      this.stopScanning();
      // ISBNの検証
      if (this.validateISBN(isbn)) {
        this.$emit('barcode-scanned', isbn);
      } else {
        alert('無効なISBNです。再スキャンしてください。');
        this.startScanning();
      }
    },
    validateISBN(isbn) {
      // ISBN-10またはISBN-13の形式チェック
      const isbn10Pattern = /^\d{9}[\dX]$/;
      const isbn13Pattern = /^\d{13}$/;
      const cleaned = isbn.replace(/[-\s]/g, '');
      return isbn10Pattern.test(cleaned) || isbn13Pattern.test(cleaned);
    },
    onManualInput() {
      if (this.validateISBN(this.manualISBN)) {
        this.$emit('barcode-scanned', this.manualISBN);
        this.manualISBN = '';
      } else {
        alert('無効なISBNです');
      }
    },
  },
};
</script>

<style scoped>
.barcode-scanner {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.scanner-container {
  position: relative;
}

#barcode-reader {
  width: 100%;
  height: 400px;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scan-line {
  width: 300px;
  height: 300px;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.scan-hint {
  margin-top: 20px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.btn-stop,
.btn-start,
.btn-submit {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-stop {
  background-color: #f44336;
}
</style>
```

### 6.2 パッケージインストール

```bash
npm install html5-qrcode
```

---

## 7. コスト

### 7.1 ツールのコスト

- **html5-qrcode**: 無料（完全無料）

### 7.2 追加コスト

- なし

---

## 8. セキュリティのベストプラクティス

### 8.1 カメラアクセス

- ユーザーに明示的に許可を求める
- アクセス拒否時の適切な処理

### 8.2 データの検証

- 読み取ったISBNの形式検証
- 不正なデータの処理

---

## 9. 結論

この読書管理アプリには**html5-qrcodeを推奨**します。

**主な理由：**
- ✅ Vue.jsとの統合が容易
- ✅ アクティブにメンテナンスされている
- ✅ QRコードとバーコードの両方に対応
- ✅ 実装が簡単
- ✅ モバイル対応
- ✅ 完全無料

**実装の優先順位：**
1. html5-qrcodeの導入
2. 基本的なスキャン機能の実装
3. エラーハンドリングの実装
4. UI/UXの改善

---

## 10. 参考資料

- [html5-qrcode公式ドキュメント](https://github.com/mebjas/html5-qrcode)
- [html5-qrcode APIリファレンス](https://scanapp.org/html5-qrcode-docs/docs/apis/)
- [QuaggaJS公式ドキュメント](https://serratus.github.io/quaggaJS/)
- [ZXing公式ドキュメント](https://github.com/zxing-js/library)

---

この手順書に従って、バーコード読み取り機能を実装していきます。

