# Laravel + React (TypeScript) — Docker Compose Starter

This repository provides a clean, minimal setup to run a **Laravel (PHP 8.2) API** and a **React (TypeScript) SPA** side-by-side using **Docker Compose**. It is designed for local development with hot reload and without relying on host PHP/Node versions—you scaffold both apps inside containers.

> ✅ Authentication (register/login/logout) is not included in this initial scaffold. Once the stack runs cleanly, you can add auth (e.g., Laravel Sanctum + React Router) following the Next Steps section.

---

## Prerequisites

- Docker Desktop (or Docker Engine) with Docker Compose
- No processes occupying ports **8000** (Nginx/Laravel) and **5173** (Vite dev server). MySQL maps **3306**.

---

## Directory Structure

```text
laravel-react-docker/
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile
│  ├─ nginx/
│  │  └─ default.conf
│  └─ src/                 # Laravel app will be created here inside the container
└─ frontend/
   ├─ Dockerfile           # React app will be scaffolded here inside the container
   └─                      # empty initially
```

> **Important:** The backend Dockerfile must be at `backend/Dockerfile` (not under `backend/nginx/`).

---

## Files

### `backend/Dockerfile`

```dockerfile
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
    docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd opcache; \
    rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
```

### `backend/nginx/default.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass backend:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### `frontend/Dockerfile` (Development)

```dockerfile
FROM node:20

WORKDIR /app

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: mysql:8.0
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: laravel
      MYSQL_USER: laravel
      MYSQL_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: laravel-api
    restart: unless-stopped
    working_dir: /var/www/html
    volumes:
      - ./backend/src:/var/www/html
    environment:
      APP_ENV: local
      APP_DEBUG: "true"
      APP_URL: http://localhost:8000
      DB_CONNECTION: mysql
      DB_HOST: db
      DB_PORT: 3306
      DB_DATABASE: laravel
      DB_USERNAME: laravel
      DB_PASSWORD: secret
    depends_on:
      - db

  nginx:
    image: nginx:1.25
    container_name: nginx
    restart: unless-stopped
    ports:
      - "8000:80"
    volumes:
      - ./backend/src:/var/www/html
      - ./backend/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: react-spa
    restart: unless-stopped
    working_dir: /app
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    command: ["npm", "run", "dev", "--", "--host"]

volumes:
  db_data:
```

---

## Getting Started (from scratch)

> All commands below are run from the repository root.

### 1) Create folders & files (only if starting from empty directory)

```bash
mkdir -p backend/src backend/nginx frontend
# create files if not present
# touch backend/Dockerfile backend/nginx/default.conf frontend/Dockerfile docker-compose.yml
```

Put the file contents as shown above.

### 2) Build & start the stack

```bash
docker compose up -d --build
```

This starts:
- **mysql** (port 3306)
- **laravel-api** (PHP-FPM, port 9000 internally)
- **nginx** (serving Laravel at http://localhost:8000)
- **react-spa** (will run Vite after you scaffold the app)

### 3) Scaffold Laravel inside the backend container

```bash
# Create the Laravel app skeleton in backend/src
docker exec -it laravel-api bash -lc "composer create-project laravel/laravel ."

# Generate application key
docker exec -it laravel-api bash -lc "php artisan key:generate"

# Ensure DB config in backend/src/.env matches docker-compose
# DB_HOST=db, DB_PORT=3306, DB_DATABASE=laravel, DB_USERNAME=laravel, DB_PASSWORD=secret

# Run migrations (verifies DB connectivity)
docker exec -it laravel-api bash -lc "php artisan migrate"
```

Open **http://localhost:8000** → Laravel welcome page should appear.

### 4) Scaffold React (TypeScript, Vite) inside the frontend container

```bash
# Start a one-off shell even if the service command would fail
docker compose run --rm frontend bash

# Inside the container shell:
pwd   # expect /app
npm create vite@latest . -- --template react-ts
npm install
exit

# Start/restart frontend service
docker compose up -d frontend
```

Open **http://localhost:5173** → Vite React template should appear.

---

## Health Check (API ↔ Frontend)

Add a simple API endpoint in `backend/src/routes/api.php`:

```php
<?php
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'php' => PHP_VERSION,
        'laravel' => app()->version(),
        'time' => now()->toISOString(),
    ]);
});
```

Test:
- API: `http://localhost:8000/api/health`
- Frontend can call `http://localhost:8000/api/health` with `fetch`/`axios`.

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Common Commands

```bash
# Stop & remove containers (keep volumes)
docker compose down

# Full reset: remove containers, networks, volumes (DESTROYS DB DATA)
docker compose down -v

# Clean builder cache (optional)
docker builder prune -f

# Rebuild and start all services
docker compose up -d --build

# Tail logs
docker compose logs --tail=200 -f

# Shell into backend container
docker exec -it laravel-api bash

# One-off shell into frontend service (useful for scaffolding)
docker compose run --rm frontend bash
```

---

## Troubleshooting

- **Internal Server Error: MissingAppKeyException**
  - Ensure `.env` contains a single valid `APP_KEY`. Run inside backend container:
    ```bash
    php artisan key:generate
    php artisan config:clear && php artisan cache:clear && php artisan optimize:clear
    ```
  - Make sure `docker-compose.yml` does **not** set `APP_KEY` to an empty string. Environment variables override `.env`.

- **Frontend container keeps restarting / cannot exec**
  - Use a one-off shell to scaffold before dev server runs:
    ```bash
    docker compose run --rm frontend bash
    npm create vite@latest . -- --template react-ts
    npm install
    exit
    docker compose up -d frontend
    ```

- **`http://localhost:5173` not loading**
  - Confirm port mapping: `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
  - Check logs: `docker compose logs frontend --tail=200 -f`
  - Ensure Vite binds to host: use `--host` flag (already in compose `command`) and/or set in `vite.config.ts`:
    ```ts
    export default defineConfig({ server: { host: true, port: 5173, strictPort: true } })
    ```
  - Verify files exist in `frontend/` (`package.json`, `src/`, `index.html`).

- **Port conflicts**
  - If 8000 or 5173 is in use, change the host mapping in `docker-compose.yml` (e.g., `5174:5173`).

---

## Optional: Makefile

Create a `Makefile` to simplify repetitive tasks:

```makefile
.PHONY: up down rebuild clean fe-shell be-shell logs

up:
	docker compose up -d --build

down:
	docker compose down

rebuild:
	docker compose down
	docker builder prune -f
	docker compose up -d --build

clean:
	docker compose down -v
	docker builder prune -f
	docker image prune -f

fe-shell:
	docker compose run --rm frontend bash

be-shell:
	docker exec -it laravel-api bash

logs:
	docker compose logs --tail=200 -f
```

---

## Next Steps (Authentication, Routing, DX)

- Add **Laravel Sanctum** for token-based auth:
  ```bash
  docker exec -it laravel-api bash -lc "composer require laravel/sanctum"
  docker exec -it laravel-api bash -lc "php artisan vendor:publish --provider='Laravel\\Sanctum\\SanctumServiceProvider'"
  docker exec -it laravel-api bash -lc "php artisan migrate"
  ```
- Configure CORS in `backend/src/config/cors.php` to allow `http://localhost:5173`.
- In React, add **React Router**, **AuthContext**, and **ProtectedRoute**.
- Optionally add ESLint/Prettier, absolute imports, and testing setup.

---

## License

MIT
