# backend/Dockerfile
FROM php:8.2-fpm

# Install system dependencies & PHP extensions
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        git \
        zip \
        unzip \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
    ; \
    docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        opcache \
        sockets \
    ; \
    rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Ensure writable dirs for Laravel later
RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
