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

# Create .env file if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env file..."
    cp /var/www/html/.env.example /var/www/html/.env
    echo "Copied .env.example to .env"
fi
# Ensure .env file has proper ownership and permissions for www-data to write
chown www-data:www-data /var/www/html/.env 2>/dev/null || true
chmod 664 /var/www/html/.env 2>/dev/null || true


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


echo "Waiting for Elasticsearch connection..."
ELASTICSEARCH_HOST="${ELASTICSEARCH_HOST:-http://elasticsearch:9200}"

until curl -f -s "${ELASTICSEARCH_HOST}/_cluster/health" > /dev/null 2>&1; do
    echo "Elasticsearch is unavailable - sleeping"
    sleep 5
done
echo "Elasticsearch is ready!"


chown -R www-data:www-data /var/www/html/vendor 2>/dev/null || true
chown -R www-data:www-data /var/www/html/public/build 2>/dev/null || true
chown -R www-data:www-data /var/www/html/node_modules 2>/dev/null || true

# Ensure package files have proper permissions for npm to write
if [ -f /var/www/html/package.json ]; then
    chown www-data:www-data /var/www/html/package.json 2>/dev/null || true
    chmod 664 /var/www/html/package.json 2>/dev/null || true
fi
if [ -f /var/www/html/package-lock.json ]; then
    chown www-data:www-data /var/www/html/package-lock.json 2>/dev/null || true
    chmod 664 /var/www/html/package-lock.json 2>/dev/null || true
fi
# Ensure composer files have proper permissions
if [ -f /var/www/html/composer.json ]; then
    chown www-data:www-data /var/www/html/composer.json 2>/dev/null || true
    chmod 664 /var/www/html/composer.json 2>/dev/null || true
fi
if [ -f /var/www/html/composer.lock ]; then
    chown www-data:www-data /var/www/html/composer.lock 2>/dev/null || true
    chmod 664 /var/www/html/composer.lock 2>/dev/null || true
fi
# Ensure the root directory is writable for npm/composer to create/update lock files
chown www-data:www-data /var/www/html 2>/dev/null || true
chmod 775 /var/www/html 2>/dev/null || true

echo "Running Composer setup script..."
# Run setup script as www-data user
su-exec www-data composer run-script setup --no-interaction || {
    echo "Warning: Setup script failed, continuing with manual setup..."
    # Fallback to manual setup if script fails
    composer install --no-interaction --prefer-dist --optimize-autoloader
    chown -R www-data:www-data /var/www/html/vendor 2>/dev/null || true
}

# Create storage symlink if it doesn't exist
echo "Creating storage symlink..."
if [ ! -L /var/www/html/public/storage ]; then
    su-exec www-data php artisan storage:link 2>/dev/null || true
else
    echo "Storage symlink already exists"
fi

# Ensure public/storage has correct permissions
if [ -L /var/www/html/public/storage ]; then
    chown -h www-data:www-data /var/www/html/public/storage 2>/dev/null || true
fi

# Switch to www-data user for running the application
exec su-exec www-data "$@"

