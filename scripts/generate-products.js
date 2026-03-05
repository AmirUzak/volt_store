/**
 * Генерирует список товаров из .webp в корне проекта.
 * Сканирует корень, группирует по имени продукта, назначает категорию по ключевым словам,
 * генерирует цену/рейтинг и копирует изображения в public/products/.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_PRODUCTS = path.join(PROJECT_ROOT, 'public', 'products');
const DATA_DIR = path.join(PROJECT_ROOT, 'lib', 'data');
const PRODUCTS_JSON = path.join(DATA_DIR, 'products.json');

const CATEGORY_KEYWORDS = [
  ['Smart Watch', ['watch', 'applewatch']],
  ['Laptop', ['laptop', 'macbook', 'rog', 'tuf', 'gamin', 'notebook']],
  ['Tablet', ['ipad', 'tablet']],
  ['Phone', ['phone', 'iphone', 'galaxy', 'xiaomi', 'honor', 'ultra', 'fold', 'magic']],
  ['GPU', ['rtx', 'gpu', 'video', '4070', '5070', '5080']],
  ['Audio', ['sony', 'wh', 'headphone', 'earphone', 'airpod']],
  ['Storage', ['shield', 'tshield', 'storage', 'tb', 'ssd']],
  ['Accessories', []],
];

function getCategory(filename) {
  const lower = filename.toLowerCase().replace(/\.webp$/, '');
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.length && keywords.some((k) => lower.includes(k))) return category;
  }
  return 'Accessories';
}

function filenameToTitle(filename) {
  const base = filename
    .replace(/\.webp$/i, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim();
  const withSpaces = base.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/[_\-\d]+/g, ' ');
  const words = withSpaces.split(/\s+/).filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getBaseName(filename) {
  return filename
    .replace(/\.webp$/i, '')
    .replace(/\s*\(\d+\)\s*$/i, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** Индекс для сортировки: 0 = основная (без скобок), иначе номер из (2), (3)... */
function getImageIndex(filename) {
  const m = filename.match(/\(\s*(\d+)\s*\)\s*\.webp$/i);
  return m ? parseInt(m[1], 10) : 0;
}

/** Сортировка: основная первой, затем (2), (3)... по возрастанию */
function sortImageFiles(fileList) {
  return [...fileList].sort((a, b) => getImageIndex(a) - getImageIndex(b));
}

function randomInRange(min, max, step = 0.01) {
  const steps = (max - min) / step + 1;
  return min + Math.floor(Math.random() * steps) * step;
}

function main() {
  if (!fs.existsSync(PROJECT_ROOT)) {
    console.error('Project root not found:', PROJECT_ROOT);
    process.exit(1);
  }

  const files = fs.readdirSync(PROJECT_ROOT).filter((f) => /\.webp$/i.test(f));
  const byBase = new Map();

  for (const file of files) {
    const base = getBaseName(file);
    if (!byBase.has(base)) {
      byBase.set(base, []);
    }
    byBase.get(base).push(file);
  }

  if (!fs.existsSync(PUBLIC_PRODUCTS)) {
    fs.mkdirSync(PUBLIC_PRODUCTS, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const products = [];
  const usedTitles = new Set();
  let id = 1;

  for (const [baseName, fileList] of byBase.entries()) {
    const sortedFiles = sortImageFiles(fileList);
    const mainFile = sortedFiles.find((f) => getImageIndex(f) === 0) || sortedFiles[0];
    const title = filenameToTitle(mainFile);
    const uniqueTitle = usedTitles.has(title) ? `${title} ${baseName}` : title;
    usedTitles.add(uniqueTitle);

    const slug = slugify(uniqueTitle) || `product-${id}`;
    const category = getCategory(mainFile);
    const price = Math.round(randomInRange(29, 2499, 1));
    const rating = Number(randomInRange(3.5, 5.0, 0.1).toFixed(1));
    const inStock = true;

    const destName = `${slug}.webp`;
    const images = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const f = sortedFiles[i];
      const idx = getImageIndex(f);
      const d = idx === 0 ? destName : `${slug}-${idx}.webp`;
      const sp = path.join(PROJECT_ROOT, f);
      const dp = path.join(PUBLIC_PRODUCTS, d);
      try {
        fs.copyFileSync(sp, dp);
        images.push(`/products/${d}`);
      } catch (e) {
        if (i === 0) console.warn('Copy skip:', f, e.message);
      }
    }
    if (images.length === 0) {
      try {
        fs.copyFileSync(path.join(PROJECT_ROOT, mainFile), path.join(PUBLIC_PRODUCTS, destName));
        images.push(`/products/${destName}`);
      } catch (_) {}
    }

    products.push({
      id: String(id++),
      slug,
      name: uniqueTitle,
      category,
      price,
      rating,
      inStock,
      image: `/products/${destName}`,
      images: images.length ? images : [`/products/${destName}`],
      description: `High-quality ${uniqueTitle}. Category: ${category}.`,
      specs: [
        { label: 'Category', value: category },
        { label: 'Condition', value: 'New' },
        { label: 'Warranty', value: '12 months' },
      ],
    });
  }

  while (products.length < 8 && byBase.size > 0) {
    const firstBase = byBase.keys().next().value;
    const fileList = byBase.get(firstBase);
    const firstFile = fileList[0];
    const title = filenameToTitle(firstFile) + ' ' + products.length;
    const slug = slugify(title) || `product-${id}`;
    const category = getCategory(firstFile);
    products.push({
      id: String(id++),
      slug,
      name: title,
      category,
      price: Math.round(randomInRange(49, 999, 1)),
      rating: Number(randomInRange(3.8, 5.0, 0.1).toFixed(1)),
      inStock: true,
      image: `/products/${slug}.webp`,
      images: [`/products/${slug}.webp`],
      description: `High-quality ${title}.`,
      specs: [
        { label: 'Category', value: category },
        { label: 'Condition', value: 'New' },
      ],
    });
    const srcPath = path.join(PROJECT_ROOT, firstFile);
    const destPath = path.join(PUBLIC_PRODUCTS, `${slug}.webp`);
    try {
      fs.copyFileSync(srcPath, destPath);
    } catch (_) {}
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf8');
  console.log('Generated', products.length, 'products ->', PRODUCTS_JSON);
  console.log('Images copied to', PUBLIC_PRODUCTS);
}

main();
