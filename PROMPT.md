# 開発開始プロンプト

まず CLAUDE.md を読んでから、以下のステップでTDDに従って開発を進めてください。
各ステップ完了後に確認を求めてください。

---

## Step 1: プロジェクト初期化

1. Next.js 14（App Router, TypeScript strict）をセットアップ
2. 以下の依存パッケージをインストール:
   - `prisma`, `@prisma/client`
   - `jose`（JWT）, `bcryptjs`, `@types/bcryptjs`
   - `zod`（バリデーション）
   - `vitest`, `@vitejs/plugin-react`, `@testing-library/react`
3. `vitest.config.ts` を作成（Next.jsと共存する設定）
4. `tsconfig.json` でstrict modeを確認・設定
5. Tailwind CSSのセットアップ確認

Step 1 完了後、ファイル一覧と `npm run test` の実行結果を表示してください。

---

## Step 2: データベース設計（テストファースト）

1. `prisma/schema.prisma` を作成（User, Customer, Statusモデル）
2. `prisma/seed.ts` を作成:
   - テストユーザー2名（admin@demo.com, user@demo.com）
   - 日本語の顧客データ20件以上（ACTIVE/INACTIVE/PROSPECTを混在）
3. マイグレーション実行（`npx prisma migrate dev --name init`）
4. シード実行（`npx prisma db seed`）

---

## Step 3: 認証API（テストファースト）

以下の順でRed→Green→Refactorを実施してください。

### 3-1. POST /api/auth/login
1. `src/app/api/auth/login/route.test.ts` を作成（テスト先行）
   - 正常系: 正しいメールアドレスとパスワードでJWTが返る
   - 異常系: 存在しないメールアドレス → 401
   - 異常系: パスワード不一致 → 401
   - 異常系: 不正なリクエストボディ → 400
2. テストが失敗することを確認（Red）
3. `src/app/api/auth/login/route.ts` を実装
4. テストが通ることを確認（Green）

### 3-2. POST /api/auth/logout
### 3-3. GET /api/auth/me

各エンドポイントで同様にTDDを実施。

---

## Step 4: ダッシュボードAPI（テストファースト）

### GET /api/dashboard
- レスポンス: `{ totalCustomers, activeCustomers, prospects, newThisMonth }`
- 認証必須（JWTなし → 401）

---

## Step 5: 顧客管理API（テストファースト）

以下の順でTDDを実施:
1. GET /api/customers（一覧・検索・フィルター・ページネーション）
2. POST /api/customers（新規作成・バリデーション）
3. GET /api/customers/:id（詳細取得）
4. PUT /api/customers/:id（更新）
5. DELETE /api/customers/:id（削除）

各エンドポイントで正常系・異常系のテストを先に書いてください。

---

## Step 6: フロントエンド実装

以下の画面を順番に実装してください。
全input・button要素に `data-testid` 属性を必ず付与すること。

1. **ログイン画面** (`/login`)
   - メールアドレス・パスワード入力フォーム
   - エラーメッセージ表示エリア
   - ログインボタン

2. **ダッシュボード** (`/`)
   - KPIカード（総顧客数・取引中・見込み・今月の新規）
   - 顧客一覧へのリンク

3. **顧客一覧** (`/customers`)
   - 検索入力・ステータスフィルター
   - ページネーション付きテーブル
   - 各行に詳細リンク・削除ボタン

4. **顧客詳細・編集** (`/customers/[id]`)
   - 顧客情報の表示と編集フォーム
   - 保存・キャンセルボタン

5. **新規顧客登録** (`/customers/new`)
   - 全フィールドのバリデーション付きフォーム

UIは日本の業務システムらしいシンプルで見やすいデザインにすること。

---

## Step 7: Docker・Cloud Run対応

1. マルチステージ `Dockerfile` を作成
2. `.dockerignore` を作成
3. `cloudbuild.yaml` を作成（Cloud Build → Cloud Run）
4. `npm scripts` に追加:
   - `docker:build` → `docker build -t mabl-crm-web .`
   - `docker:run` → `docker run -p 3000:3000 mabl-crm-web`

---

## Step 8: 最終確認

1. `npm run test` → 全テストパス
2. `npm run build` → ビルド成功
3. `npm run docker:build` → イメージビルド成功
4. `npm run docker:run` → localhost:3000 で動作確認
5. 作成したファイルの一覧とテスト結果のサマリーを出力

---

## 補足指示
- 各Stepは必ず確認を求めてから次に進むこと
- テストが通らない状態でStepを終了しないこと
- エラーが発生した場合は原因を説明してから修正すること
```

---

## 初期ディレクトリ構成案
```
mabl-crm-web/
├── CLAUDE.md                          # Claude Code向け開発ガイド
├── PROMPT.md                          # Claude Code向け開発プロンプト
├── README.md                          # プロジェクト概要
├── Dockerfile                         # マルチステージビルド
├── .dockerignore
├── cloudbuild.yaml                    # Cloud Build設定
├── .env                               # ローカル開発用（gitignore）
├── .env.example                       # 環境変数サンプル
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── tailwind.config.ts
├── package.json
│
├── prisma/
│   ├── schema.prisma                  # データモデル定義
│   ├── migrations/                    # マイグレーションファイル
│   └── seed.ts                        # シードデータ（日本語20件+）
│
└── src/
    ├── app/                           # Next.js App Router
    │   ├── layout.tsx
    │   ├── page.tsx                   # ダッシュボード (/)
    │   ├── login/
    │   │   └── page.tsx              # ログイン画面
    │   ├── customers/
    │   │   ├── page.tsx              # 顧客一覧
    │   │   ├── new/
    │   │   │   └── page.tsx          # 新規顧客登録
    │   │   └── [id]/
    │   │       └── page.tsx          # 顧客詳細・編集
    │   └── api/
    │       ├── auth/
    │       │   ├── login/
    │       │   │   ├── route.ts
    │       │   │   └── route.test.ts  # ← テストを実装と同階層に
    │       │   ├── logout/
    │       │   │   ├── route.ts
    │       │   │   └── route.test.ts
    │       │   └── me/
    │       │       ├── route.ts
    │       │       └── route.test.ts
    │       ├── dashboard/
    │       │   ├── route.ts
    │       │   └── route.test.ts
    │       └── customers/
    │           ├── route.ts           # GET(一覧), POST(作成)
    │           ├── route.test.ts
    │           └── [id]/
    │               ├── route.ts       # GET, PUT, DELETE
    │               └── route.test.ts
    │
    ├── lib/
    │   ├── prisma.ts                  # Prismaクライアントシングルトン
    │   ├── auth.ts                    # JWT生成・検証ユーティリティ
    │   └── api-response.ts            # APIレスポンス統一ヘルパー
    │
    ├── types/
    │   └── index.ts                   # 共通型定義（モバイルとも共有想定）
    │
    └── components/
        ├── ui/                        # 汎用UIコンポーネント
        │   ├── Button.tsx
        │   ├── Input.tsx
        │   ├── Card.tsx
        │   └── Table.tsx
        └── layout/
            ├── Header.tsx
            ├── Sidebar.tsx
            └── PageLayout.tsx