# VOLT Store

Полноценный e-commerce проект: Next.js frontend + Node.js/Express backend + PostgreSQL + Redis + Nginx + Docker.

## Что внутри

- `app/` — страницы и layout (App Router)
- `components/` — UI-компоненты
- `backend/` — API (Express + Prisma)
- `jenkins/` + `Jenkinsfile` — CI/CD пайплайн и Jenkins Configuration as Code
- `terraform/` — IaC для Docker-инфраструктуры (network, postgres, redis)
- `ansible/` — автоматизация развёртывания и базового hardening сервера
- `lib/` — утилиты, типы и данные
- `public/` — статические файлы
- `public/images/products/` — исходные изображения товаров
- `public/products/` — изображения, которые используются в `lib/data/products.json`

### Сервер (DigitalOcean Droplet)

| Параметр | Значение |
|---------|---------|
| Провайдер | DigitalOcean |
| Локация | Frankfurt (FRA1) |
| ОС | Ubuntu 24.04 LTS x64 |
| vCPU | 1 |
| RAM | 2 GB |
| Диск | 50 GB SSD |

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть: [http://localhost:3000](http://localhost:3000)

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и при необходимости задайте:

```bash
NEXT_PUBLIC_CURRENCY_SYMBOL=$
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Статус репозитория

Проект работает как fullstack-стек и запускается через Docker Compose.

Полезные команды:

```bash
docker compose -p volt up -d --build frontend nginx
docker compose -p volt exec frontend node -e "const p=require('./lib/data/products.json'); console.log(p.length)"
```

## Changelog (Апрель 2026)

### Каталог и данные

- Фронтенд переведен с локального чтения `lib/data/products.json` на runtime-запросы к backend API.
- Страницы каталога и карточки товара теперь получают данные из API без пересборки фронтенд-образа.
- Детальная страница товара работает динамически по `slug`.

### Админка

- В админ-панели добавлено управление расширенными полями товара:
	- загрузка главного изображения (file upload),
	- дополнительные изображения (галерея),
	- характеристики (`specs`) в удобном текстовом формате.
- Обновление/создание товара отправляется через `FormData`.

### Backend и БД

- Модель `Product` расширена полями: `slug`, `rating`, `images`, `specs`, `stock`.
- Обновлены сервисы/контроллеры товаров: нормализация `images/specs`, генерация уникального `slug`, обработка multipart-запросов.
- Исправлен Docker seed-поток: приоритет источника `/seed/products.json` (полный каталог).
- Выполнена миграция с принудительным reset схемы (`prisma db push --force-reset`) и повторный seed.

### Проверка результата

- После миграции API возвращает полный каталог: `count=43`.
- В API-ответах доступны новые поля: `slug`, `rating`, `images`, `specs`, `stock`.

## Docker modes

Локальная разработка без SSL:

```bash
docker compose -p volt -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Продакшен с SSL и certbot:

```bash
docker compose -p volt --profile prod up -d --build
```

## Security hardening (Fail2Ban + Nginx)

- Nginx now writes security-focused logs to host-mounted files:
	- `logs/nginx/access.log`
	- `logs/nginx/auth_access.log`
	- `logs/nginx/scanners_access.log`
- Auth endpoints are rate-limited at Nginx level.
- Scanner probes are dropped with status `444` and logged separately.

Fail2Ban templates are in:

- `security/fail2ban/filter.d/nginx-auth-bruteforce.conf`
- `security/fail2ban/filter.d/nginx-scanners.conf`
- `security/fail2ban/jail.local.example`
- `security/fail2ban/README.md`

## CI/CD и IaC

### Jenkins

- Pipeline описан в `Jenkinsfile`:
	- checkout ветки `main`,
	- deploy через `docker-compose --profile prod up -d --build backend frontend nginx`,
	- запуск `prisma migrate deploy` после деплоя,
	- post-проверка `docker-compose ps`.
- Jenkins образ и плагины настраиваются в:
	- `jenkins/Dockerfile`,
	- `jenkins/plugins.txt`,
	- `jenkins/casc.yaml`.

### Terraform

- Terraform конфигурация находится в `terraform/`:
	- `main.tf` — Docker provider + ресурсы network/postgres/redis,
	- `variables.tf` — параметры БД,
	- `outputs.tf` — outputs по созданным ресурсам,
	- `README.md` — быстрый старт по `terraform init/plan/apply`.

### Ansible

- Ansible конфигурация находится в `ansible/`:
	- `inventory.ini` — хост `voltstore` (Droplet FRA1),
	- `deploy.yml` — установка docker/git/fail2ban, настройка UFW, деплой проекта, миграции и cron backup.

## Что было сделано (апрель 2026)



### Инфраструктура и деплой

- Добавлены и синхронизированы Docker режимы для dev/prod.
- Для `docker compose` используется явный project name: `-p volt`.
- Прод-настройка использует Nginx + SSL + certbot.

### Каталог и админка

- Каталог переведен на runtime API-запросы вместо статичного чтения JSON на этапе сборки.
- Страницы каталога и товара работают динамически по `slug`.
- Админка поддерживает `FormData`, загрузку главного изображения, галерею и `specs`.

### Backend и БД

- Модель `Product` расширена полями: `slug`, `rating`, `images`, `specs`, `stock`.
- Обновлены сервисы/контроллеры товаров: нормализация данных и генерация уникального `slug`.
- Обновлен seed-поток для приоритетной загрузки каталога из `/seed/products.json`.

### Защита от атак

- В Nginx добавлен security log format и хостовые логи:
	- `logs/nginx/access.log`
	- `logs/nginx/auth_access.log`
	- `logs/nginx/scanners_access.log`
- Добавлен Nginx rate limit на auth-endpoints (`/api/(v1/)?auth/...`).
- Добавлены scanner-trap location (например `wp-admin`, `xmlrpc.php`, `.env`) с ответом `444`.
- Добавлены шаблоны Fail2Ban:
	- фильтр brute-force для auth,
	- фильтр scanner/probe запросов,
	- готовый `jail.local.example` под Linux-host.

### Результат проверки на сервере

- Fail2Ban сервис успешно стартует на Ubuntu 24.04 (`active/running`).
- Jail'ы активны: `nginx-auth-bruteforce`, `nginx-scanners`, `sshd`.
- `nginx-scanners` подтвержден реальным матчингом через `fail2ban-regex`.
- `nginx-auth-bruteforce` настроен на `access.log`; для подтверждения бана требуется серия неудачных логинов (401/403/429).
