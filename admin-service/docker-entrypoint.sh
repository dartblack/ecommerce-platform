#!/bin/sh
set -e

echo "Fixing permissions..."

# Create storage directories if they don't exist
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/framework/cache
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Fix ownership and permissions for storage and cache directories
# Run as root to ensure we can change ownership
chown -R www-data:www-data /var/www/html/storage 2>/dev/null || true
chown -R www-data:www-data /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage 2>/dev/null || true
chmod -R 775 /var/www/html/bootstrap/cache 2>/dev/null || true

# Ensure specific subdirectories have correct permissions
find /var/www/html/storage -type d -exec chmod 775 {} \; 2>/dev/null || true
find /var/www/html/storage -type f -exec chmod 664 {} \; 2>/dev/null || true
find /var/www/html/bootstrap/cache -type d -exec chmod 775 {} \; 2>/dev/null || true
find /var/www/html/bootstrap/cache -type f -exec chmod 664 {} \; 2>/dev/null || true

# Install Composer dependencies if vendor directory is empty or doesn't exist
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
    chown -R www-data:www-data /var/www/html/vendor 2>/dev/null || true
else
    echo "Composer dependencies already installed"
fi

# Install npm dependencies if node_modules doesn't exist or is empty
if [ ! -d /var/www/html/node_modules ] || [ -z "$(ls -A /var/www/html/node_modules 2>/dev/null)" ]; then
    echo "Installing npm dependencies..."
    npm install
    chown -R www-data:www-data /var/www/html/node_modules 2>/dev/null || true
else
    echo "npm dependencies already installed"
fi

# Build assets if manifest doesn't exist or if in development mode
if [ ! -f /var/www/html/public/build/manifest.json ] || [ "${APP_ENV:-production}" = "local" ]; then
    echo "Building assets..."
    npm run build
    chown -R www-data:www-data /var/www/html/public/build 2>/dev/null || true
else
    echo "Assets already built (skipping in production)"
fi

# Create .env file if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env file..."
    cp /var/www/html/.env.example /var/www/html/.env
    echo "Copied .env.example to .env"
    chown www-data:www-data /var/www/html/.env 2>/dev/null || true
else
    echo ".env file already exists"
fi

# Generate application encryption key if not set
echo "Generating application encryption key..."
php artisan key:generate --force

echo "Waiting for database connection..."

# Wait for PostgreSQL to be ready
# Try to connect using artisan tinker or a simple PHP script
until php -r "
try {
    \$pdo = new PDO('pgsql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    exit(0);
} catch (PDOException \$e) {
    exit(1);
}
" 2>/dev/null; do
    echo "Database is unavailable - sleeping"
    sleep 1
done

echo "Database is ready!"

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Seed database if no admin users exist
echo "Seeding database..."
php artisan db:seed --force

# Create storage symlink if it doesn't exist
echo "Creating storage symlink..."
php artisan storage:link --force 2>/dev/null || true

# Ensure public/storage has correct permissions
if [ -L /var/www/html/public/storage ]; then
    chown -h www-data:www-data /var/www/html/public/storage 2>/dev/null || true
fi

# Switch to www-data user for running the application
exec su-exec www-data "$@"

