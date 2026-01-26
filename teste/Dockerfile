FROM php:8.2-apache

# Install extensions commonly used with MySQL
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache rewrite module
RUN a2enmod rewrite
