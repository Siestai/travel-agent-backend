#!/bin/bash

# Get the first argument and strip --name= prefix if present
MIGRATION_NAME="${1#--name=}"

# Check if migration name is provided
if [ -z "$MIGRATION_NAME" ]; then
  echo "Error: Migration name is required"
  echo "Usage: pnpm db:migrate:generate <migration-name>"
  echo "Example: pnpm db:migrate:generate create_user_table"
  exit 1
fi

MIGRATION_PATH="src/database/migrations/$MIGRATION_NAME"

dotenv -e .env.local -- ts-node ./node_modules/typeorm/cli migration:generate -d src/config/typeorm.ts "$MIGRATION_PATH"

