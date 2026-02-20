# mabl-crm-web 開発ガイド

## プロジェクト概要

mablのテスト自動化デモ用CRM（顧客管理）Webアプリケーション。
日本の大手企業向けデモを想定しており、業務アプリケーションらしいUIと
安定したREST APIを提供する。

将来的にモバイルネイティブアプリ（mabl-crm-mobile）がこのAPIを利用することを想定し、
APIはWebとモバイル両方から利用可能な設計とする。

## mablデモでの活用目的

- **ブラウザテスト**: ログイン・一覧・詳細・フォームのE2Eテスト
- **APIテスト**: REST APIエンドポイントの単体・シナリオテスト
- **AIアサーション**: 画面上のテキスト・件数・ステータスの自動検証
- **データドリブンテスト**: 複数顧客データを使った繰り返しテスト
- **CI/CD連携**: Cloud Build → Cloud Run へのデプロイパイプライン

## 技術スタック

| レイヤー       | 技術                              |
| -------------- | --------------------------------- |
| フロントエンド | Next.js 14 (App Router)           |
| API            | Next.js Route Handlers (`/api/*`) |
| データベース   | SQLite（Prisma経由）              |
| ORM            | Prisma                            |
| 認証           | JWT（jose）+ Cookie               |
| テスト         | Vitest（ユニット・API）           |
| スタイル       | Tailwind CSS                      |
| コンテナ       | Docker → Google Cloud Run         |
| 言語           | TypeScript（strict モード）       |

## 開発原則

- **テストファースト（TDD）**: 実装前に必ずテストを書く
- Red → Green → Refactor のサイクルを守る
- `any` 型の使用禁止
- APIレスポンスは必ず一貫したJSON構造を返す
- 全インタラクティブ要素に `data-testid` 属性を付与する

## 画面構成とフロー

```
/login          ログイン画面（認証失敗シナリオも対応）
  ↓
/               ダッシュボード（KPIカード表示）
  ↓
/customers      顧客一覧（検索・フィルター・ページネーション）
  ↓
/customers/[id] 顧客詳細・編集
  ↓
/customers/new  新規顧客登録（バリデーションあり）
```

## APIエンドポイント一覧

| メソッド | パス               | 説明                                 |
| -------- | ------------------ | ------------------------------------ |
| POST     | /api/auth/login    | ログイン（JWT発行）                  |
| POST     | /api/auth/logout   | ログアウト                           |
| GET      | /api/auth/me       | 現在のログインユーザー情報           |
| GET      | /api/dashboard     | KPIデータ取得                        |
| GET      | /api/customers     | 顧客一覧（search, status, page対応） |
| POST     | /api/customers     | 顧客新規作成                         |
| GET      | /api/customers/:id | 顧客詳細取得                         |
| PUT      | /api/customers/:id | 顧客情報更新                         |
| DELETE   | /api/customers/:id | 顧客削除                             |

## データモデル

### User

- id, email, password（bcryptハッシュ）, name, role（ADMIN/USER）, createdAt

### Customer

- id, companyName, contactName, email, phone, address, status, assignedTo, notes, createdAt, updatedAt
- status: ACTIVE（取引中）/ INACTIVE（取引停止）/ PROSPECT（見込み）

## シードデータ

- テストユーザー: `admin@demo.com / Admin1234!`（管理者）、`user@demo.com / User1234!`（一般）
- 顧客データ: 日本の実在感のある企業名・担当者名・住所を含む20件以上

## mablデモ設計上の注意点

- フォームの全input/button要素に `data-testid` を付与
- ページネーションはクエリパラメータ `?page=1&limit=10` で制御
- APIエラーレスポンスは `{ error: string, code: string }` 形式で統一
- ログイン失敗時は適切なエラーメッセージを画面に表示

## デプロイ

- Dockerはマルチステージビルド（builder + runner）
- リッスンポート: 3000
- 環境変数: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
- Cloud Build → Cloud Run への自動デプロイ（cloudbuild.yaml）
