# データモデル設計書（MongoDB）

## 1. ユーザー（User）

```javascript
{
  _id: ObjectId,
  username: String (必須, 一意),
  email: String (必須, 一意, インデックス),
  password: String (必須, ハッシュ化),
  createdAt: Date,
  updatedAt: Date
}
```

## 2. 本（Book）

```javascript
{
  _id: ObjectId,
  userId: ObjectId (必須, Userへの参照, インデックス),
  title: String (必須, APIから取得または手動入力),
  author: String (任意, APIから取得または手動入力),
  isbn: String (任意, APIから取得または手動入力),
  publisher: String (任意, APIから取得),
  publishDate: String (任意, APIから取得),
  totalPages: Number (任意, APIから取得),
  currentPage: Number (任意, デフォルト: 0),
  status: String (必須, enum: ['未読', '読書中', '読了', '中断'], デフォルト: '未読'),
  rating: Number (任意, 0.5-5.0, 0.5刻み),
  coverImageUrl: String (任意, APIから取得),
  description: String (任意, APIから取得),
  createdAt: Date,
  updatedAt: Date
}
```

## 3. メモ（Note）

```javascript
{
  _id: ObjectId,
  userId: ObjectId (必須, Userへの参照, インデックス),
  bookId: ObjectId (必須, Bookへの参照, インデックス),
  content: String (必須),
  createdAt: Date,
  updatedAt: Date
}
```

## 4. 進捗履歴（ProgressHistory）（任意）

```javascript
{
  _id: ObjectId,
  userId: ObjectId (必須, Userへの参照, インデックス),
  bookId: ObjectId (必須, Bookへの参照, インデックス),
  page: Number (必須),
  progress: Number (必須, 0-100, %),
  recordedAt: Date (必須)
}
```

## 5. インデックス設計

- User: `email` (ユニークインデックス)
- Book: `userId`, `userId + status`, `userId + title` (複合インデックス)
- Note: `userId`, `bookId`, `userId + bookId` (複合インデックス)
- ProgressHistory: `userId`, `bookId`, `userId + bookId` (複合インデックス)
