# GitHub Actions による Cloud Run デプロイ手順

## 概要

`main` ブランチへの push または手動実行により、Google Cloud Run へ自動デプロイされます。
認証には **Workload Identity Federation (WIF)** を使用し、サービスアカウントキーファイルは不要です。

---

## 前提条件

- Google Cloud プロジェクトが作成済みであること
- `gcloud` CLI がローカルにインストール・認証済みであること
- GitHub リポジトリが作成済みであること

---

## 1. GCP リソースのセットアップ

### 1-1. Artifact Registry リポジトリの作成

```bash
gcloud artifacts repositories create mabl-crm \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="mabl-crm Docker images"
```

### 1-2. Secret Manager にシークレットを登録

```bash
# JWT 署名用シークレット（初回作成）
echo -n "your-production-jwt-secret" | \
  gcloud secrets create jwt-secret --data-file=-

# SQLite データベース URL（Cloud Run 上のパス）（初回作成）
echo -n "file:/app/data/prod.db" | \
  gcloud secrets create database-url --data-file=-
```

> **シークレットが既に存在する場合**は `create` の代わりに `versions add` で新しいバージョンを追加します。
>
> ```bash
> echo -n "your-production-jwt-secret" | \
>   gcloud secrets versions add jwt-secret --data-file=-
>
> echo -n "file:/app/data/prod.db" | \
>   gcloud secrets versions add database-url --data-file=-
> ```

> **注意:** `database-url` は現在 SQLite を使用しています。本番環境でデータを永続化する場合は Cloud SQL（PostgreSQL）への移行を検討してください。

---

## 2. Workload Identity Federation のセットアップ

> **このプロジェクトではサービスアカウント `github-actions-ci` が既に存在するため、2-1 の作成は不要です。**
> 2-2 のロール付与から開始してください（付与済みのロールは省略可）。

### 2-1. サービスアカウントの作成（初回のみ）

他プロジェクトでまだ作成していない場合のみ実行します。

```bash
PROJECT_ID=$(gcloud config get-value project)

gcloud iam service-accounts create github-actions-ci \
  --display-name="GitHub Actions CI/CD Service Account" \
  --project=${PROJECT_ID}
```

### 2-2. 必要なロールを付与

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="github-actions-ci@${PROJECT_ID}.iam.gserviceaccount.com"

# Artifact Registry への書き込み権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer" \
  --condition=None

# Cloud Run へのデプロイ権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin" \
  --condition=None

# サービスアカウントユーザー権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

# Secret Manager の読み取り権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None
```

### 2-3. Workload Identity Pool の作成

> **このプロジェクトでは Workload Identity Pool `github-pool` が既に存在するため、このステップはスキップしてください。**
> 既存のプールを確認するには以下を実行します。
>
> ```bash
> gcloud iam workload-identity-pools list --location=global
> ```

他プロジェクトでまだ作成していない場合のみ実行します。

```bash
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions Pool"
```

### 2-4. Workload Identity Provider の作成

> **このプロジェクトでは Provider `github-provider` が既に存在するため、このステップはスキップしてください。**
> 既存のプロバイダーを確認するには以下を実行します。
>
> ```bash
> gcloud iam workload-identity-pools providers list \
>   --workload-identity-pool=github-pool \
>   --location=global
> ```
>
> 既存の `github-provider` は `assertion.repository_owner == 'mfunaki'` の条件で設定されており、
> `mfunaki` 配下のすべてのリポジトリ（`mabl-crm-web` を含む）から利用できます。

他プロジェクトでまだ作成していない場合のみ実行します。

```bash
GITHUB_ORG="your-github-username-or-org"   # 例: mfunaki
GITHUB_REPO="mabl-crm-web"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${GITHUB_ORG}/${GITHUB_REPO}'"
```

### 2-5. サービスアカウントへのバインディング

> **注意:** `--member` の `attribute.*` の部分は、Workload Identity Provider の `attribute-condition` 設定に合わせる必要があります。
>
> - Provider の条件が `assertion.repository == 'org/repo'` の場合 → `attribute.repository/org/repo`
> - Provider の条件が `assertion.repository_owner == 'org'` の場合 → `attribute.repository_owner/org`
>
> このプロジェクトの `github-provider` は `assertion.repository_owner == 'mfunaki'` で設定されているため、
> `attribute.repository_owner/mfunaki` を使用します。

```bash
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')

# repository_owner 条件の場合（このプロジェクト）
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-ci@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository_owner/mfunaki"

# repository 条件の場合（2-4 で新規作成した場合）
# gcloud iam service-accounts add-iam-policy-binding \
#   "github-actions-ci@${PROJECT_ID}.iam.gserviceaccount.com" \
#   --role="roles/iam.workloadIdentityUser" \
#   --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}"
```

### 2-6. WIF_PROVIDER の値を確認

```bash
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

---

## 3. GitHub Secrets の設定

GitHub リポジトリの **Settings > Secrets and variables > Actions** に以下を登録します。

| シークレット名 | 値 | 取得方法 |
|---|---|---|
| `GCP_PROJECT_ID` | GCP プロジェクト ID | `gcloud config get-value project` |
| `WIF_PROVIDER` | WIF プロバイダーのリソース名 | 上記 2-6 の出力値 |
| `WIF_SERVICE_ACCOUNT` | `github-actions-ci@{PROJECT_ID}.iam.gserviceaccount.com` | 既存 SA のメールアドレス |

---

## 4. ワークフローの動作確認

### 自動トリガー

`main` ブランチへ push すると自動的にデプロイが開始されます。

```bash
git push origin main
```

### 手動トリガー

GitHub リポジトリの **Actions** タブから「Deploy to Cloud Run」を選択し、「Run workflow」をクリックします。

---

## 5. デプロイの流れ

```
1. Checkout（ソースコード取得）
        ↓
2. Authenticate（WIF で GCP 認証）
        ↓
3. Docker Build（マルチステージビルド）
        ↓
4. Push to Artifact Registry
   asia-northeast1-docker.pkg.dev/{PROJECT_ID}/mabl-crm/mabl-crm-web:{sha}
   asia-northeast1-docker.pkg.dev/{PROJECT_ID}/mabl-crm/mabl-crm-web:latest
        ↓
5. Deploy to Cloud Run
   - 環境変数: NODE_ENV=production
   - シークレット: JWT_SECRET, DATABASE_URL（Secret Manager）
   - リージョン: asia-northeast1
   - メモリ: 512Mi / CPU: 1
   - インスタンス: min 0 / max 10
```

---

## 6. デプロイ後の確認

```bash
# Cloud Run サービスの URL を確認
gcloud run services describe mabl-crm-web \
  --region=asia-northeast1 \
  --format='value(status.url)'

# ログを確認
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=mabl-crm-web" \
  --limit=50
```

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Permission denied` | WIF / SA のロール不足 | 2-2 のロール付与を再確認 |
| `Secret not found` | Secret Manager のシークレット名が不一致 | `jwt-secret`, `database-url` の名前を確認 |
| `Image not found` | Artifact Registry のリポジトリ名が不一致 | `mabl-crm` リポジトリが存在するか確認 |
| コンテナが起動しない | マイグレーションエラー | `gcloud logging read` でコンテナログを確認 |
