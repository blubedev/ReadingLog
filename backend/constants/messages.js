// 成功メッセージ
const SUCCESS_MESSAGES = {
  // 認証関連
  REGISTER_SUCCESS: 'ユーザー登録が完了しました',
  LOGIN_SUCCESS: 'ログインに成功しました',
  LOGOUT_SUCCESS: 'ログアウトしました',
  TOKEN_REFRESH_SUCCESS: 'トークンを更新しました',
  
  // 本関連
  BOOK_CREATED: '本を登録しました',
  BOOK_UPDATED: '本を更新しました',
  BOOK_DELETED: '本を削除しました',
  PROGRESS_UPDATED: '進捗を更新しました',
  
  // メモ関連
  NOTE_CREATED: 'メモを追加しました',
  NOTE_UPDATED: 'メモを更新しました',
  NOTE_DELETED: 'メモを削除しました',
  
  // その他
  SERVER_RUNNING: 'Server is running'
};

// エラータイプ
const ERROR_TYPES = {
  INPUT_ERROR: '入力エラー',
  AUTH_ERROR: '認証エラー',
  REGISTER_ERROR: '登録エラー',
  SERVER_ERROR: 'サーバーエラー',
  NOT_FOUND: 'Not Found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  AUTH_REQUIRED: '認証が必要です'
};

// バリデーションメッセージ
const VALIDATION_MESSAGES = {
  // 認証関連
  USERNAME_EMAIL_PASSWORD_REQUIRED: 'ユーザー名、メールアドレス、パスワードは必須です',
  EMAIL_PASSWORD_REQUIRED: 'メールアドレスとパスワードは必須です',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  PASSWORD_MIN_LENGTH: 'パスワードは6文字以上で入力してください',
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',
  USERNAME_ALREADY_EXISTS: 'このユーザー名は既に使用されています',
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  USER_NOT_FOUND: 'ログインしているユーザーが存在しません',
  
  // 本関連
  SEARCH_QUERY_REQUIRED: '検索クエリを入力してください',
  TITLE_REQUIRED: 'タイトルは必須です',
  INVALID_STATUS: 'ステータスは「未読」「読書中」「読了」「中断」のいずれかを指定してください',
  INVALID_RATING: '評価は0.5〜5.0の範囲で、0.5刻みで入力してください',
  BOOK_NOT_FOUND: '指定された本は存在しないか、アクセス権限がありません',
  INVALID_BOOK_ID: '無効な本のIDです',
  CURRENT_PAGE_REQUIRED: '現在のページ数を入力してください',
  PAGE_NUMBER_NON_NEGATIVE: 'ページ数は0以上の数値で入力してください',
  
  // メモ関連
  NOTE_CONTENT_REQUIRED: 'メモの内容を入力してください',
  NOTE_NOT_FOUND: '指定されたメモは存在しないか、アクセス権限がありません',
  INVALID_NOTE_ID: '無効なメモのIDです',
  
  // 認証ミドルウェア
  TOKEN_NOT_FOUND: 'アクセストークンが見つかりません',
  TOKEN_EXPIRED: 'トークンの有効期限が切れています',
  TOKEN_EXPIRED_ACTION: '再度ログインしてください',
  INVALID_TOKEN: '無効なトークンです',
  INVALID_TOKEN_ACTION: '正しいトークンで再度お試しください',
  AUTH_PROCESS_ERROR: '認証処理中にエラーが発生しました',
  
  // その他
  ENDPOINT_NOT_FOUND: 'リクエストされたエンドポイントは存在しません',
  INTERNAL_ERROR: 'サーバー内部でエラーが発生しました'
};

// エラーメッセージ（操作別）
const ERROR_MESSAGES = {
  // 認証関連
  REGISTER_ERROR: 'ユーザー登録中にエラーが発生しました',
  LOGIN_ERROR: 'ログイン中にエラーが発生しました',
  USER_INFO_ERROR: 'ユーザー情報の取得中にエラーが発生しました',
  TOKEN_REFRESH_ERROR: 'トークンの更新中にエラーが発生しました',
  
  // 本関連
  BOOK_SEARCH_ERROR: '書籍情報の検索中にエラーが発生しました',
  BOOK_LIST_ERROR: '本の一覧取得中にエラーが発生しました',
  BOOK_DETAIL_ERROR: '本の詳細取得中にエラーが発生しました',
  BOOK_CREATE_ERROR: '本の登録中にエラーが発生しました',
  BOOK_UPDATE_ERROR: '本の更新中にエラーが発生しました',
  BOOK_DELETE_ERROR: '本の削除中にエラーが発生しました',
  PROGRESS_UPDATE_ERROR: '進捗の更新中にエラーが発生しました',
  PROGRESS_HISTORY_ERROR: '進捗履歴の取得中にエラーが発生しました',
  
  // メモ関連
  NOTE_LIST_ERROR: 'メモの取得中にエラーが発生しました',
  NOTE_CREATE_ERROR: 'メモの追加中にエラーが発生しました',
  NOTE_UPDATE_ERROR: 'メモの更新中にエラーが発生しました',
  NOTE_DELETE_ERROR: 'メモの削除中にエラーが発生しました',
  NOTE_DETAIL_ERROR: 'メモの取得中にエラーが発生しました'
};

// ログ用メッセージ（認証関連）
const LOG_MESSAGES = {
  REGISTER_ERROR: 'ユーザー登録エラー:',
  LOGIN_USER_NOT_FOUND: 'ログイン失敗: ユーザーが見つかりません（メールに該当するアカウントなし）',
  LOGIN_PASSWORD_MISMATCH: 'ログイン失敗: パスワードが一致しません',
  LOGIN_ERROR: 'ログインエラー:',
  USER_INFO_ERROR: 'ユーザー情報取得エラー:',
  TOKEN_REFRESH_ERROR: 'トークンリフレッシュエラー:'
};

module.exports = {
  SUCCESS_MESSAGES,
  ERROR_TYPES,
  VALIDATION_MESSAGES,
  ERROR_MESSAGES,
  LOG_MESSAGES
};
