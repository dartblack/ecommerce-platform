FROM php:8.4-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    postgresql-dev \
    oniguruma-dev \
    nodejs \
    npm \
    bash \
    su-exec \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    intl \
    gd \
    zip \
    && docker-php-ext-enable pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files for initial setup (volumes will override in development)
COPY composer.json composer.lock* ./

# Copy package files for initial setup
COPY package.json package-lock.json* ./

# Copy application files (volumes will override in development)
COPY . .

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set proper permissions for storage and cache directories
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Expose port 8000
EXPOSE 8000

# Set entrypoint (will run as root to fix permissions, then switch to www-data)
ENTRYPOINT ["docker-entrypoint.sh"]

# Note: USER is not set here - entrypoint will handle user switching

# Start PHP development server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

