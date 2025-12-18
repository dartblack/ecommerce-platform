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
php artisan migrate

# Switch to www-data user for running the application
exec su-exec www-data "$@"

