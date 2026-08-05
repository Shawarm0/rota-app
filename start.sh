#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  node dist/seed.js
fi

echo "Starting server..."
node dist/server.js
