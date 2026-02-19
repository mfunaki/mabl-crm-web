'use strict'

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding initial users...')

  const adminHash = await bcrypt.hash('Mabl@Admin#2024', 10)
  const userHash  = await bcrypt.hash('Mabl@User#2024',  10)

  await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      email:    'admin@demo.com',
      password: adminHash,
      name:     '管理者 太郎',
      role:     'ADMIN',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'user@demo.com' },
    update: {},
    create: {
      email:    'user@demo.com',
      password: userHash,
      name:     '担当者 花子',
      role:     'USER',
    },
  })

  console.log('--- Users seeded.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
