# Git設定手順

Gitリポジトリを作成する前に、Gitのユーザー情報を設定する必要があります。

## 設定方法

### 方法1: このリポジトリのみに設定（推奨）

```bash
cd /home/ymasuda/projects/ReadTracker
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 方法2: グローバルに設定（すべてのリポジトリに適用）

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## GitHubのメールアドレスについて

GitHubでコミットを表示するには、GitHubアカウントに登録されているメールアドレスを使用することを推奨します。

GitHubのメールアドレスを確認する方法：
1. GitHubにログイン
2. Settings → Emails に移動
3. 登録されているメールアドレスを確認

## 設定後の確認

```bash
git config user.name
git config user.email
```

設定が完了したら、以下のコマンドでコミットできます：

```bash
git commit -m "Initial commit: 読書管理アプリの要件定義と技術選定"
```


