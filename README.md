# VOLT — магазин электроники и гаджетов

Современный быстрый сайт на Next.js (App Router), TypeScript, TailwindCSS. Корзина на Zustand, бэкенд-скелет на Express.

## Структура проекта

```
├── app/                    # Next.js App Router
│   ├── page.tsx             # Главная (hero, категории, преимущества, товары)
│   ├── products/            # Каталог и страница товара
│   ├── cart/                # Корзина
│   └── checkout/            # Оформление заказа
├── components/              # Navbar, Footer, ProductCard, Filters, CartDrawer
├── lib/                     # types, products, store (Zustand)
├── lib/data/products.json   # Генерируется из .webp в корне
├── scripts/generate-products.js  # Сканирует *.webp → products.json + копирует в public/products
├── public/products/         # Изображения товаров (копии из корня)
├── backend/                 # Express: /api/health, /api/products
├── nginx/nginx.conf         # Reverse proxy (frontend + /api → backend)
├── Dockerfile               # Production build фронтенда
├── docker-compose.yml       # frontend, nginx, backend
└── .env.example
```

## Генерация товаров из .webp

В корне проекта должны лежать файлы `*.webp` (например `iphone15.webp`, `macbookpro16.webp`).

- **Скрипт** `scripts/generate-products.js`:
  1. Сканирует корень проекта на `*.webp`
  2. Группирует по «базовому» имени (файлы вида `name.webp`, `name(2).webp` считаются одним товаром)
  3. Преобразует имя в название (например `galaxy_s24_ultra` → «Galaxy S24 Ultra»)
  4. Назначает категорию по ключевым словам: Laptop, Phone, Smart Watch, Tablet, GPU, Audio, Storage, иначе Accessories
  5. Генерирует цену (разумный диапазон), рейтинг 3.5–5.0, «in stock»
  6. Копирует по одному изображению на товар в `public/products/`
  7. Записывает `lib/data/products.json`

Запуск вручную:

```bash
npm run generate-products
```

Он также вызывается перед `npm run build`.

Если .webp мало — скрипт создаёт минимум 8 товаров, переиспользуя имеющиеся картинки.

## Названия и цены товаров, валюта

### Названия и цены

- **Вручную:** отредактируйте `lib/data/products.json`. Поля у каждого товара: `name`, `price` (число), `description`, `category`, `specs` и др. После изменений перезапустите `npm run dev` или пересоберите проект.
- **Через скрипт:** в `scripts/generate-products.js` можно изменить:
  - функцию `filenameToTitle()` — как из имени файла получается название;
  - `randomInRange(29, 2499, 1)` — диапазон цен при генерации (сейчас 29–2499);
  - категории в `CATEGORY_KEYWORDS`.
  Затем выполните `npm run generate-products` — файл `lib/data/products.json` будет перезаписан.

### Валюта

Символ валюты задаётся переменной окружения:

```bash
# .env или .env.local
NEXT_PUBLIC_CURRENCY_SYMBOL=₽
```

Примеры: `₽` (рубли), `€`, `$`, `Br`, `₴`. Если переменная не задана, используется `$`. Изменения применяются после перезапуска dev-сервера или пересборки.

## Запуск локально

1. Установить зависимости и сгенерировать товары:

```bash
npm install
npm run generate-products
```

2. Запуск фронтенда:

```bash
npm run dev
```

Сайт: [http://localhost:3000](http://localhost:3000).

3. (Опционально) Бэкенд:

```bash
cd backend && npm install && npm run dev
```

API: [http://localhost:4000/api/health](http://localhost:4000/api/health), [http://localhost:4000/api/products](http://localhost:4000/api/products).

## Запуск через Docker

1. Перед первым запуском сгенерировать товары (создаст `lib/data/products.json` и `public/products/`):

```bash
npm install && npm run generate-products
```

2. Собрать и поднять сервисы:

```bash
docker compose up -d --build
```

3. Открыть в браузере: [http://localhost](http://localhost) (порт 80 — nginx).
3. Nginx проксирует `/` на frontend (Next.js), `/api/` на backend.

## Деплой на Ubuntu

1. Установить Docker и Docker Compose:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# выйти и зайти снова или newgrp docker
```

2. Клонировать репозиторий и перейти в папку проекта:

```bash
git clone <url> volt-store && cd volt-store
```

3. При необходимости скопировать `.env.example` в `.env` и задать переменные.

4. Запустить:

```bash
docker compose up -d --build
```

Сайт будет доступен на порту 80. Для HTTPS настроить сертификаты (например Let's Encrypt) и обновить конфиг nginx.
