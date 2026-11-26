# Hardened, immutable WordPress image for MontaWeb demo and client sites.
# Written after the 2026-11-25 webshell incident (docs/reports/2026-11-25-clinica-webshell-incident.md).
#
# Idea: all PHP (core, plugins, themes, mu-plugins, wp-config.php) is baked into the
# image and owned by root, so the web server user (www-data) cannot create or change
# any PHP file. The only writable path is wp-content/uploads, where PHP never runs.
# Updating WordPress, a plugin or a theme = change the code in the build context and
# rebuild the image; wp-admin cannot install or edit code (DISALLOW_FILE_MODS).
#
# Build context layout (prepared by scripts/wp-site-build.sh):
#   wp-content/        clean plugins/, themes/, mu-plugins/, languages/ (no uploads/)
#   (this Dockerfile, apache-hardening.conf, php-hardening.ini, htaccess, montaweb-hardening.php)

ARG WP_IMAGE=wordpress:php8.2-apache
FROM ${WP_IMAGE}

# 1. Core from the official image, config that reads everything from env (DB, salts).
RUN set -eux; \
    rm -rf /var/www/html/*; \
    cp -a /usr/src/wordpress/. /var/www/html/; \
    cp /usr/src/wordpress/wp-config-docker.php /var/www/html/wp-config.php; \
    rm -rf /var/www/html/wp-content/plugins/akismet /var/www/html/wp-content/plugins/hello.php \
           /var/www/html/readme.html /var/www/html/license.txt /var/www/html/wp-config-sample.php

# 2. Site code (never uploads).
COPY wp-content/ /var/www/html/wp-content/
COPY montaweb-hardening.php /var/www/html/wp-content/mu-plugins/montaweb-hardening.php
COPY htaccess /var/www/html/.htaccess

# 3. Ownership: code is root-owned and read-only for www-data; uploads is the only writable dir.
RUN set -eux; \
    rm -rf /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade; \
    mkdir -p /var/www/html/wp-content/uploads; \
    chown -R root:root /var/www/html; \
    find /var/www/html -type d -exec chmod 755 {} +; \
    find /var/www/html -type f -exec chmod 644 {} +; \
    chown www-data:www-data /var/www/html/wp-content/uploads

# 4. Apache + PHP hardening.
COPY apache-hardening.conf /etc/apache2/conf-available/montaweb-hardening.conf
COPY php-hardening.ini /usr/local/etc/php/conf.d/99-montaweb-hardening.ini
RUN a2enconf montaweb-hardening && a2enmod headers
