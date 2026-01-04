# AWSインフラ構築手順書

## 1. 概要

この読書管理アプリケーションをAWS上に構築するための手順書です。

### 1.1 アーキテクチャ概要

```
[ユーザー]
    ↓
[CloudFront] ← [S3] (Vue.js フロントエンド)
    ↓
[Application Load Balancer]
    ↓
[ECS Fargate / EC2] (Node.js + Express バックエンド)
    ↓
[MongoDB Atlas / DocumentDB] (データベース)
```

### 1.2 使用するAWSサービス

- **フロントエンド**: S3 + CloudFront
- **バックエンド**: ECS Fargate（推奨）または EC2
- **データベース**: MongoDB Atlas（推奨）または Amazon DocumentDB
- **ネットワーク**: VPC, ALB, Route53
- **セキュリティ**: IAM, Security Groups, WAF
- **監視・ログ**: CloudWatch, CloudTrail
- **その他**: Secrets Manager, Parameter Store

---

## 2. 構築フェーズ

### Phase 1: 準備とアカウント設定
### Phase 2: ネットワーク基盤の構築
### Phase 3: データベースの構築
### Phase 4: バックエンドの構築
### Phase 5: フロントエンドの構築
### Phase 6: セキュリティと監視の設定
### Phase 7: CI/CDパイプラインの構築

---

## 3. Phase 1: 準備とアカウント設定

### 3.1 AWSアカウントの作成
- [ ] AWS公式サイトでアカウントを作成
- [ ] 請求アラートの設定（予算超過を防ぐ）
- [ ] 多要素認証（MFA）の有効化

### 3.2 IAMの設定
- [ ] 管理者用IAMユーザーの作成（ルートアカウントは使用しない）
- [ ] IAMグループの作成（開発者、運用者など）
- [ ] 最小権限の原則に基づいたIAMポリシーの設定
- [ ] アクセスキーの作成と安全な保管

### 3.3 AWS CLIの設定
```bash
# AWS CLIのインストール
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 認証情報の設定
aws configure
```

### 3.4 リージョンの選定
- [ ] 最寄りのリージョンを選択（例: ap-northeast-1 (東京)）
- [ ] 複数リージョン展開の場合は、プライマリリージョンを決定

---

## 4. Phase 2: ネットワーク基盤の構築

### 4.1 VPCの作成
- [ ] VPCの作成
  - CIDRブロック: `10.0.0.0/16`（推奨）
  - 名前: `reading-app-vpc`
- [ ] インターネットゲートウェイの作成とアタッチ
- [ ] パブリックサブネットの作成（2つ以上、異なるAZ）
  - サブネット1: `10.0.1.0/24` (ap-northeast-1a)
  - サブネット2: `10.0.2.0/24` (ap-northeast-1c)
- [ ] プライベートサブネットの作成（データベース用）
  - サブネット3: `10.0.3.0/24` (ap-northeast-1a)
  - サブネット4: `10.0.4.0/24` (ap-northeast-1c)

### 4.2 ルートテーブルの設定
- [ ] パブリックサブネット用ルートテーブル
  - インターネットゲートウェイへのルートを追加
- [ ] プライベートサブネット用ルートテーブル
  - 必要に応じてNATゲートウェイを設定

### 4.3 セキュリティグループの作成
- [ ] ALB用セキュリティグループ
  - インバウンド: HTTP (80), HTTPS (443) を許可
- [ ] バックエンド用セキュリティグループ
  - インバウンド: ALBからのみアクセス許可
- [ ] データベース用セキュリティグループ
  - インバウンド: バックエンドからのみアクセス許可（MongoDBポート: 27017）

### 4.4 NATゲートウェイの作成（オプション）
- [ ] プライベートサブネットからインターネットアクセスが必要な場合
- [ ] パブリックサブネットにNATゲートウェイを作成
- [ ] プライベートサブネットのルートテーブルに追加

---

## 5. Phase 3: データベースの構築

### 5.1 MongoDB Atlas（推奨）

#### 5.1.1 MongoDB Atlasアカウントの作成
- [ ] MongoDB Atlasでアカウントを作成
- [ ] クラスターの作成
  - リージョン: AWS (ap-northeast-1)
  - クラスター名: `reading-app-cluster`
  - インスタンスサイズ: M0（無料枠）またはM10以上

#### 5.1.2 ネットワークアクセスの設定
- [ ] IPホワイトリストの設定
  - VPCのCIDRブロックを追加
  - 開発環境のIPアドレスを追加

#### 5.1.3 データベースユーザーの作成
- [ ] データベースユーザーの作成
- [ ] パスワードの安全な保管（Secrets Manager推奨）

#### 5.1.4 接続文字列の取得
- [ ] 接続文字列を取得
- [ ] Secrets Managerに保存

### 5.2 Amazon DocumentDB（代替案）

#### 5.2.1 DocumentDBクラスターの作成
- [ ] DocumentDBクラスターの作成
  - インスタンスクラス: db.t3.medium（開発環境）
  - マルチAZ配置: 有効（本番環境）
- [ ] サブネットグループの作成（プライベートサブネット）

#### 5.2.2 セキュリティ設定
- [ ] セキュリティグループの設定
- [ ] 暗号化の有効化

---

## 6. Phase 4: バックエンドの構築

### 6.1 ECS Fargate（推奨）

#### 6.1.1 ECRリポジトリの作成
```bash
# ECRリポジトリの作成
aws ecr create-repository --repository-name reading-app-backend --region ap-northeast-1
```

#### 6.1.2 Dockerfileの作成
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

#### 6.1.3 Dockerイメージのビルドとプッシュ
```bash
# ログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com

# ビルド
docker build -t reading-app-backend .

# タグ付け
docker tag reading-app-backend:latest <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/reading-app-backend:latest

# プッシュ
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/reading-app-backend:latest
```

#### 6.1.4 ECSクラスターの作成
- [ ] ECSクラスターの作成
  - クラスター名: `reading-app-cluster`
  - インフラストラクチャ: AWS Fargate

#### 6.1.5 タスク定義の作成
- [ ] タスク定義の作成
  - CPU: 0.25 vCPU（開発環境）、0.5 vCPU（本番環境）
  - メモリ: 512 MB（開発環境）、1 GB（本番環境）
  - 環境変数の設定（Secrets Managerから取得）

#### 6.1.6 サービスの作成
- [ ] ECSサービスの作成
  - タスク数: 1（開発環境）、2以上（本番環境）
  - ロードバランサー: ALBをアタッチ

### 6.2 EC2（代替案）

#### 6.2.1 EC2インスタンスの起動
- [ ] AMIの選択: Amazon Linux 2023
- [ ] インスタンスタイプ: t3.micro（開発環境）、t3.small以上（本番環境）
- [ ] キーペアの作成とダウンロード
- [ ] セキュリティグループの設定

#### 6.2.2 インスタンスのセットアップ
```bash
# Node.jsのインストール
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# アプリケーションのデプロイ
git clone <repository-url>
cd reading-app
npm install
npm start
```

#### 6.2.3 PM2のインストール（プロセス管理）
```bash
npm install -g pm2
pm2 start index.js --name reading-app
pm2 save
pm2 startup
```

---

## 7. Phase 5: フロントエンドの構築

### 7.1 S3バケットの作成
- [ ] S3バケットの作成
  - バケット名: `reading-app-frontend`（グローバルで一意）
  - リージョン: ap-northeast-1
  - パブリックアクセス: ブロック（CloudFront経由でアクセス）

### 7.2 静的ホスティングの設定
- [ ] バケットポリシーの設定（CloudFrontからのアクセスのみ許可）
- [ ] CORS設定（必要に応じて）

### 7.3 Vue.jsアプリのビルド
```bash
# 本番環境用ビルド
npm run build

# distディレクトリの内容をS3にアップロード
aws s3 sync dist/ s3://reading-app-frontend --delete
```

### 7.4 CloudFrontディストリビューションの作成
- [ ] CloudFrontディストリビューションの作成
  - Origin: S3バケット
  - Viewer Protocol Policy: Redirect HTTP to HTTPS
  - Allowed HTTP Methods: GET, HEAD, OPTIONS
  - Cache Policy: CachingOptimized
  - Default Root Object: index.html

### 7.5 カスタムドメインの設定（オプション）
- [ ] Route53でホストゾーンの作成
- [ ] SSL証明書のリクエスト（ACM）
- [ ] CloudFrontにカスタムドメインとSSL証明書を設定
- [ ] Route53でAレコードの作成（CloudFrontへのエイリアス）

---

## 8. Phase 6: セキュリティと監視の設定

### 8.1 Application Load Balancer (ALB) の作成
- [ ] ALBの作成
  - スキーム: Internet-facing
  - タイプ: Application Load Balancer
  - サブネット: パブリックサブネット（2つ以上）
- [ ] ターゲットグループの作成
  - ターゲットタイプ: IP（Fargate）または Instance（EC2）
  - ヘルスチェックパスの設定: `/api/health`

### 8.2 SSL/TLS証明書の設定
- [ ] ACMでSSL証明書のリクエスト
- [ ] ドメインの所有権確認
- [ ] ALBにSSL証明書を設定
- [ ] HTTPSリスナーの追加（ポート443）

### 8.3 Secrets Managerの設定
- [ ] MongoDB接続文字列の保存
- [ ] JWT秘密鍵の保存
- [ ] その他の機密情報の保存

### 8.4 CloudWatchの設定
- [ ] ロググループの作成
  - `/ecs/reading-app-backend`
  - `/aws/ecs/reading-app`
- [ ] メトリクスアラームの設定
  - CPU使用率
  - メモリ使用率
  - リクエスト数
  - エラー率
- [ ] ダッシュボードの作成

### 8.5 CloudTrailの設定
- [ ] CloudTrailの有効化
- [ ] S3バケットへのログ保存

### 8.6 WAFの設定（オプション）
- [ ] WAF Web ACLの作成
- [ ] 一般的な攻撃パターンのブロック
- [ ] CloudFrontまたはALBにアタッチ

---

## 9. Phase 7: CI/CDパイプラインの構築

### 9.1 CodePipelineの設定

#### 9.1.1 ソースステージ
- [ ] GitHubまたはCodeCommitリポジトリの接続
- [ ] ブランチの指定（main, developなど）

#### 9.1.2 ビルドステージ（CodeBuild）
- [ ] CodeBuildプロジェクトの作成
- [ ] buildspec.ymlの作成
```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t reading-app-backend:$IMAGE_TAG .
      - docker tag reading-app-backend:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/reading-app-backend:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/reading-app-backend:$IMAGE_TAG
```

#### 9.1.3 デプロイステージ
- [ ] ECSへのデプロイアクションの追加
- [ ] フロントエンドのS3へのデプロイアクションの追加

### 9.2 GitHub Actions（代替案）
- [ ] GitHub Actionsワークフローの作成
- [ ] AWS認証情報の設定（GitHub Secrets）
- [ ] 自動デプロイの設定

---

## 10. 環境変数の設定

### 10.1 バックエンド環境変数
```bash
# ECSタスク定義またはEC2の環境変数
NODE_ENV=production
PORT=3000
MONGODB_URI=<MongoDB接続文字列>
JWT_SECRET=<JWT秘密鍵>
JWT_REFRESH_SECRET=<JWTリフレッシュトークン秘密鍵>
REDIS_URL=<Redis接続URL>（ブラックリスト管理用）
OPEN_LIBRARY_API_URL=https://openlibrary.org
CORS_ORIGIN=https://yourdomain.com
```

### 10.2 フロントエンド環境変数
```bash
# .env.production
VUE_APP_API_URL=https://api.yourdomain.com
VUE_APP_ENV=production
```

---

## 11. コスト最適化

### 11.1 開発環境
- EC2: t3.micro（無料枠利用可能）
- MongoDB Atlas: M0（無料枠）
- S3: 最小限のストレージ
- CloudFront: 必要最小限のキャッシュ

### 11.2 本番環境
- リザーブドインスタンスの検討（EC2使用時）
- スポットインスタンスの検討（開発環境）
- S3ライフサイクルポリシーの設定
- CloudWatchログの保持期間の設定

---

## 12. チェックリスト

### 12.1 セキュリティチェックリスト
- [ ] すべての通信がHTTPS経由
- [ ] セキュリティグループが最小権限で設定されている
- [ ] 機密情報がSecrets Managerに保存されている
- [ ] IAMポリシーが最小権限で設定されている
- [ ] MFAが有効化されている
- [ ] 定期的なセキュリティアップデートの実施

### 12.2 可用性チェックリスト
- [ ] マルチAZ配置
- [ ] ヘルスチェックの設定
- [ ] 自動スケーリングの設定
- [ ] バックアップの設定

### 12.3 監視チェックリスト
- [ ] CloudWatchアラームの設定
- [ ] ログの集約と保存
- [ ] ダッシュボードの作成
- [ ] 通知の設定（SNS）

---

## 13. トラブルシューティング

### 13.1 よくある問題

#### 接続エラー
- セキュリティグループの設定を確認
- VPCのルートテーブルを確認
- ネットワークACLの設定を確認

#### パフォーマンス問題
- CloudWatchメトリクスを確認
- データベースのクエリを最適化
- キャッシュの活用を検討

#### コスト超過
- Cost Explorerでコスト分析
- 未使用リソースの削除
- リザーブドインスタンスの検討

---

## 14. 参考資料

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS セキュリティベストプラクティス](https://aws.amazon.com/security/security-resources/)
- [MongoDB Atlas ドキュメント](https://docs.atlas.mongodb.com/)
- [ECS ベストプラクティス](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)

---

この手順書に従って、段階的にAWSインフラを構築していきます。


