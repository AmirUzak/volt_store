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
