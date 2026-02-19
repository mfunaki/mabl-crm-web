import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('シードデータを投入中...')

  // テストユーザーを作成
  const adminPassword = await bcrypt.hash('password123', 10)
  const userPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: adminPassword,
      name: '管理者 太郎',
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      password: userPassword,
      name: '担当者 花子',
      role: 'USER',
    },
  })

  console.log(`ユーザー作成完了: ${admin.email}, ${user.email}`)

  // 既存の顧客データを削除してから再作成
  await prisma.customer.deleteMany({})

  // 日本語顧客データ25件
  const customers = [
    {
      name: '田中 一郎',
      email: 'tanaka.ichiro@example.co.jp',
      phone: '03-1234-5678',
      company: '株式会社田中商事',
      status: 'ACTIVE',
      notes: '定期購入顧客。毎月の発注あり。',
    },
    {
      name: '鈴木 花子',
      email: 'suzuki.hanako@example.co.jp',
      phone: '06-2345-6789',
      company: '鈴木製作所',
      status: 'ACTIVE',
      notes: '大口取引先。年間契約更新済み。',
    },
    {
      name: '山田 次郎',
      email: 'yamada.jiro@example.co.jp',
      phone: '052-3456-7890',
      company: '山田工業株式会社',
      status: 'PROSPECT',
      notes: '先月から商談中。来月デモ予定。',
    },
    {
      name: '佐藤 三郎',
      email: 'sato.saburo@example.co.jp',
      phone: '011-4567-8901',
      company: '佐藤物産',
      status: 'INACTIVE',
      notes: '昨年度より取引なし。再アプローチ検討中。',
    },
    {
      name: '高橋 美咲',
      email: 'takahashi.misaki@example.co.jp',
      phone: '045-5678-9012',
      company: '高橋コンサルティング',
      status: 'ACTIVE',
      notes: 'コンサルティング契約。四半期ごとに打ち合わせ。',
    },
    {
      name: '伊藤 健太',
      email: 'ito.kenta@example.co.jp',
      phone: '022-6789-0123',
      company: '伊藤電気工業',
      status: 'PROSPECT',
      notes: 'ウェブサイトからの問い合わせ。見積もり依頼中。',
    },
    {
      name: '渡辺 由美',
      email: 'watanabe.yumi@example.co.jp',
      phone: '075-7890-1234',
      company: '渡辺デザイン事務所',
      status: 'ACTIVE',
      notes: 'デザイン関連サービスで長期取引中。',
    },
    {
      name: '中村 雅之',
      email: 'nakamura.masayuki@example.co.jp',
      phone: '082-8901-2345',
      company: '中村食品株式会社',
      status: 'INACTIVE',
      notes: '価格交渉決裂。半年間取引なし。',
    },
    {
      name: '小林 紗耶',
      email: 'kobayashi.saya@example.co.jp',
      phone: '092-9012-3456',
      company: '小林医療器具',
      status: 'ACTIVE',
      notes: '医療機器の定期メンテナンス契約。',
    },
    {
      name: '加藤 大輔',
      email: 'kato.daisuke@example.co.jp',
      phone: '048-0123-4567',
      company: '加藤建設',
      status: 'PROSPECT',
      notes: '建設資材の調達先として検討中。',
    },
    {
      name: '吉田 裕子',
      email: 'yoshida.hiroko@example.co.jp',
      phone: '03-1111-2222',
      company: '吉田商店',
      status: 'ACTIVE',
      notes: '地元の老舗取引先。毎週定期注文。',
    },
    {
      name: '山本 浩二',
      email: 'yamamoto.koji@example.co.jp',
      phone: '06-3333-4444',
      company: '山本電機',
      status: 'INACTIVE',
      notes: '担当者交代後、連絡が途絶えた。',
    },
    {
      name: '松本 陽子',
      email: 'matsumoto.yoko@example.co.jp',
      phone: '052-5555-6666',
      company: '松本アパレル',
      status: 'PROSPECT',
      notes: '展示会でコンタクト。フォローアップ中。',
    },
    {
      name: '井上 達也',
      email: 'inoue.tatsuya@example.co.jp',
      phone: '011-7777-8888',
      company: '井上物流',
      status: 'ACTIVE',
      notes: '物流パートナー。週3回の定期配送契約。',
    },
    {
      name: '木村 奈々',
      email: 'kimura.nana@example.co.jp',
      phone: '045-9999-0000',
      company: '木村IT',
      status: 'ACTIVE',
      notes: 'ITシステム導入支援。プロジェクト進行中。',
    },
    {
      name: '林 正男',
      email: 'hayashi.masao@example.co.jp',
      phone: '022-1234-5678',
      company: '林製薬',
      status: 'PROSPECT',
      notes: '医薬品パッケージング案件で商談中。',
    },
    {
      name: '清水 千尋',
      email: 'shimizu.chihiro@example.co.jp',
      phone: '075-2345-6789',
      company: '清水観光',
      status: 'INACTIVE',
      notes: 'コロナ禍以降、取引縮小。現在休眠状態。',
    },
    {
      name: '山崎 恵子',
      email: 'yamazaki.keiko@example.co.jp',
      phone: '082-3456-7890',
      company: '山崎不動産',
      status: 'ACTIVE',
      notes: '不動産管理システムの導入契約。',
    },
    {
      name: '森 慎一',
      email: 'mori.shinichi@example.co.jp',
      phone: '092-4567-8901',
      company: '森機械工業',
      status: 'PROSPECT',
      notes: '製造ラインの自動化について問い合わせ中。',
    },
    {
      name: '池田 理恵',
      email: 'ikeda.rie@example.co.jp',
      phone: '048-5678-9012',
      company: '池田教育研究所',
      status: 'ACTIVE',
      notes: '教育コンテンツのサブスクリプション契約。',
    },
    {
      name: '橋本 龍太',
      email: 'hashimoto.ryuta@example.co.jp',
      phone: '03-6789-0123',
      company: '橋本証券',
      status: 'ACTIVE',
      notes: '金融系システム。セキュリティ要件が高い。',
    },
    {
      name: '石川 幸子',
      email: 'ishikawa.sachiko@example.co.jp',
      phone: '06-7890-1234',
      company: '石川食堂チェーン',
      status: 'INACTIVE',
      notes: '支払い遅延が発生。現在対応協議中。',
    },
    {
      name: '前田 勇太',
      email: 'maeda.yuta@example.co.jp',
      phone: '052-8901-2345',
      company: '前田農業',
      status: 'PROSPECT',
      notes: '農業DX案件。補助金活用を検討中。',
    },
    {
      name: '藤原 みのり',
      email: 'fujiwara.minori@example.co.jp',
      phone: '011-9012-3456',
      company: '藤原印刷',
      status: 'ACTIVE',
      notes: '印刷物の定期発注。月2回のロット。',
    },
    {
      name: '西村 浩',
      email: 'nishimura.hiroshi@example.co.jp',
      phone: '045-0123-4567',
      company: '西村運輸',
      status: 'ACTIVE',
      notes: '輸送委託契約。年間更新。',
    },
  ]

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        ...customer,
        createdById: admin.id,
      },
    })
  }

  console.log(`顧客データ ${customers.length} 件を作成しました。`)
  console.log('シード完了。')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
