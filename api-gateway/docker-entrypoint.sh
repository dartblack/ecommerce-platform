#!/bin/sh

# Create .env from .env.example if .env doesn't exist
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo ".env file created successfully!"
elif [ ! -f .env ]; then
  echo "Warning: .env file does not exist and .env.example is not available"
fi

echo "API Gateway: Waiting for database connection..."

# Wait for PostgreSQL to be ready
set +e
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "postgres" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
set -e

echo "Database is ready!"

# Create api-gateway database if it doesn't exist
echo "Creating database '${DB_DATABASE}' if it doesn't exist..."
set +e
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_DATABASE}'" | grep -q 1
DB_EXISTS=$?
set -e

if [ $DB_EXISTS -ne 0 ]; then
  echo "Creating database '${DB_DATABASE}'..."
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "postgres" -c "CREATE DATABASE \"${DB_DATABASE}\""
  echo "Database '${DB_DATABASE}' created successfully!"
else
  echo "Database '${DB_DATABASE}' already exists!"
fi

# Install dependencies if node_modules doesn't exist or is empty (for development)
if [ "${NODE_ENV}" = "development" ]; then
  if [ ! -d "/app/node_modules" ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "Installing dependencies..."
    npm install
  else
    echo "Dependencies already installed"
  fi
fi

# Run database migrations
echo "Running database migrations..."
set +e
npm run migration:run
MIGRATION_EXIT_CODE=$?
set -e

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo "Migrations completed successfully!"
else
  echo "Warning: Migration run exited with code $MIGRATION_EXIT_CODE"
  echo "Continuing anyway (migrations may have already been applied or may run on app startup)"
fi

# Run the application
echo "Starting application..."
exec "$@"

