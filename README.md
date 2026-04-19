# Frontend Starter (Next.js)

Минимальная фронтенд-версия проекта на Next.js + TypeScript + TailwindCSS.

## Что внутри

- `app/` — страницы и layout (App Router)
- `components/` — UI-компоненты
- `lib/` — утилиты, типы и данные
- `public/` — статические файлы
- `public/images/products/` — исходные изображения товаров
- `public/products/` — изображения, которые используются в `lib/data/products.json`

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

Из проекта удалены backend, docker/nginx-конфиги и вспомогательные backend-скрипты.
Это чистая фронтенд-база для дальнейшей разработки.
docker compose -p volt up -d --build frontend nginx
docker compose -p volt exec frontend node -e "const p=require('./lib/data/products.json'); console.log(p.length)"

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