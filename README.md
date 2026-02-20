# mabl-crm-web

顧客情報の登録・管理・検索ができる CRM（顧客管理）Web アプリケーションです。
JWT 認証によるログイン機能と、顧客のステータス管理（取引中・見込み・休眠）に対応しています。

mabl を使ったテスト自動化のデモ・学習用途として設計されています。

---

## 機能

- **認証**: JWT によるログイン・ログアウト、ページの認証保護
- **ダッシュボード**: 総顧客数・アクティブ数・見込み数・今月の新規数を統計表示
- **顧客一覧**: キーワード検索・ステータスフィルター・ページネーション
- **顧客登録**: 顧客名・メール・電話番号・会社名・ステータス・メモの登録
- **顧客編集**: 既存顧客情報の更新
- **顧客削除**: 確認モーダル付きの削除機能

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript（strict モード） |
| DB / ORM | SQLite + Prisma |
| 認証 | JWT（jose）、bcryptjs |
| スタイリング | Tailwind CSS |
| テスト | Vitest、Testing Library |
| コンテナ | Docker（マルチステージビルド） |
| CI/CD | GitHub Actions + Google Cloud Run |

---

## ローカル開発環境のセットアップ

### 前提条件

- Node.js 20 以上
- npm

### 手順

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集して DATABASE_URL と JWT_SECRET を設定

# DB のマイグレーションと初期データ投入
npx prisma migrate dev
npx prisma db seed

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 初期アカウント

| ロール | メールアドレス | パスワード |
|---|---|---|
| 管理者 | admin@demo.com | Mabl@Admin#2024 |
| 一般ユーザー | user@demo.com | Mabl@User#2024 |

---

## Docker での起動

```bash
# docker-compose で起動（DB 永続化あり）
docker compose up -d

# ログの確認
docker compose logs -f

# 停止
docker compose down
```

コンテナ起動時に DB マイグレーションと初期データ（ユーザー 2 件・顧客 25 件）が自動投入されます。
データは Docker ボリューム `crm-data` に永続化されます。

---

## ユニットテストの実行

```bash
# テストを1回実行
npm test

# ウォッチモードで実行
npm run test:watch

# UI モードで実行
npm run test:ui
```

---

## デプロイ（Google Cloud Run）

GitHub Actions による自動デプロイを設定済みです。
`main` ブランチへの push で自動的に Cloud Run へデプロイされます。

セットアップ手順は [docs/deploy.md](docs/deploy.md) を参照してください。

### 本番環境 URL

https://mabl-crm-web-ixi7x7b23a-an.a.run.app

---

## mabl テスト

本アプリケーションは mabl によるテスト自動化に対応しています。

- **テスト仕様**: [docs/mabl-tests.md](docs/mabl-tests.md)
- **Agent プロンプトガイド**: [docs/mabl-agent-prompt-guide.md](docs/mabl-agent-prompt-guide.md)
- **サンプルプロンプト**: [docs/prompts/](docs/prompts/)

### テストシナリオ一覧

| # | テストラベル | 概要 |
|---|---|---|
| 1 | ログイン - 正常系 | 正しい認証情報でログインしダッシュボードへ遷移 |
| 2 | ログイン - 異常系 | 誤ったパスワードでエラーメッセージを確認 |
| 3 | ダッシュボード - 統計表示 | 各統計カードの表示確認 |
| 4 | 顧客一覧 - 検索・フィルター | キーワード検索とステータスフィルターの動作確認 |
| 5 | 顧客 - 新規登録 | フォーム入力から一覧への反映確認 |
| 6 | 顧客 - 情報編集 | ステータスとメモの編集・保存確認 |
| 7 | 顧客 - 削除 | 確認モーダル経由での削除と一覧からの消去確認 |
| 8 | ログアウト - 認証保護 | ログアウト後の認証保護リダイレクト確認 |

### 本番スモークテスト

mabl プラン「mabl-crm-web 本番スモークテスト」として上記 8 シナリオを毎日定期実行しています。

---

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/deploy.md](docs/deploy.md) | GitHub Actions + Cloud Run デプロイ手順 |
| [docs/mabl-tests.md](docs/mabl-tests.md) | mabl テスト仕様（シナリオ・data-testid 一覧） |
| [docs/mabl-agent-prompt-guide.md](docs/mabl-agent-prompt-guide.md) | Test Creation Agent プロンプト作成ガイドライン |
| [docs/prompts/](docs/prompts/) | Test Creation Agent 向けサンプルプロンプト |
