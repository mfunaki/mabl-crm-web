#!/bin/sh
set -e

echo "=== Starting CRM Web Application ==="

# Prisma マイグレーションを適用（既存データは保持）
echo "--- Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "--- Seeding initial data..."
node docker-seed.js

echo "--- Migrations complete. Starting server..."
exec node server.js
