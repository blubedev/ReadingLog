<template>
  <div class="barcode-scanner">
    <div v-if="isScanning" class="scanner-container">
      <div id="barcode-reader" ref="scannerRef" class="scanner-viewport"></div>
      <div class="scanner-overlay">
        <div class="scan-frame"></div>
        <p class="scan-hint">本のバーコード（ISBN）を枠内に合わせてください</p>
      </div>
      <div class="scanner-actions">
        <button
          type="button"
          class="btn-stop"
          @click="stopScanning"
        >
          スキャン停止
        </button>
        <button
          type="button"
          class="btn-manual"
          @click="handleSwitchToManual"
        >
          手動入力に切り替え
        </button>
      </div>
      <p v-if="scanError" class="scan-error">{{ scanError }}</p>
    </div>

    <div v-else class="scanner-start">
      <button
        type="button"
        class="btn-start"
        @click="startScanning"
        :disabled="isStarting"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
        バーコードでスキャン
      </button>
      <p class="scan-help">ISBN-10、ISBN-13の両方に対応</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, nextTick } from 'vue';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const emit = defineEmits(['barcode-scanned', 'switch-to-manual']);

const scannerRef = ref(null);
const html5QrCode = ref(null);
const isScanning = ref(false);
const isStarting = ref(false);
const scanError = ref('');

/**
 * ISBN形式の検証（ISBN-10、ISBN-13）
 * - ISBN-10: 9桁 + チェック桁（0-9 または X）
 * - ISBN-13: 13桁
 * - UPC-A: 12桁（先頭に0を付けてISBN-13として検索可能）
 */
const validateISBN = (value) => {
  const cleaned = String(value).replace(/[-\s]/g, '');
  const isbn10Pattern = /^\d{9}[\dXx]$/;
  const isbn13Pattern = /^\d{13}$/;
  const upcPattern = /^\d{12}$/;
  return isbn10Pattern.test(cleaned) || isbn13Pattern.test(cleaned) || upcPattern.test(cleaned);
};

/**
 * 読み取った値をISBNとして正規化（ハイフン除去）
 */
const normalizeISBN = (value) => {
  return String(value).replace(/[-\s]/g, '');
};

const startScanning = async () => {
  if (isStarting.value || isScanning.value) return;

  isStarting.value = true;
  scanError.value = '';
  // 先に isScanning を true にして #barcode-reader を DOM にレンダリングする
  isScanning.value = true;

  // Vue が DOM を更新するまで待つ
  await nextTick();

  try {
    html5QrCode.value = new Html5Qrcode('barcode-reader');

    await html5QrCode.value.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 280, height: 120 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        aspectRatio: 1.0,
      },
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      () => {
        // スキャン失敗時は無視（継続スキャン）
      }
    );
  } catch (err) {
    console.error('スキャン開始エラー:', err);
    scanError.value = 'カメラにアクセスできませんでした。カメラの許可を確認するか、手動入力をご利用ください。';
    isScanning.value = false;
    html5QrCode.value = null;
  } finally {
    isStarting.value = false;
  }
};

const stopScanning = async () => {
  if (html5QrCode.value && isScanning.value) {
    try {
      await html5QrCode.value.stop();
      html5QrCode.value.clear();
    } catch (err) {
      console.error('スキャン停止エラー:', err);
    }
    html5QrCode.value = null;
    isScanning.value = false;
    scanError.value = '';
  }
};

const onScanSuccess = (decodedText) => {
  const isbn = normalizeISBN(decodedText);

  if (validateISBN(isbn)) {
    stopScanning();
    emit('barcode-scanned', isbn);
  }
};

const handleSwitchToManual = () => {
  stopScanning();
  emit('switch-to-manual');
};

onBeforeUnmount(() => {
  stopScanning();
});
</script>

<style scoped>
.barcode-scanner {
  width: 100%;
  max-width: 400px;
}

.scanner-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.scanner-viewport {
  width: 100%;
  min-height: 250px;
}

.scanner-viewport :deep(video) {
  width: 100% !important;
  height: auto !important;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.scan-frame {
  width: 280px;
  height: 120px;
  border: 2px solid rgba(52, 199, 89, 0.8);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
}

.scan-hint {
  margin-top: 1rem;
  color: white;
  font-size: 0.875rem;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.scanner-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #1a1a1a;
}

.btn-stop {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-stop:hover {
  background: #dc2626;
}

.btn-manual {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #34c759;
  background: transparent;
  border: 1px solid #34c759;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-manual:hover {
  background: rgba(52, 199, 89, 0.1);
}

.scan-error {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #ef4444;
  background: #fef2f2;
}

.scanner-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.btn-start {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: white;
  background: #34c759;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-start:hover:not(:disabled) {
  background: #2db34d;
}

.btn-start:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scan-help {
  font-size: 0.75rem;
  color: #6b7280;
}
</style>
