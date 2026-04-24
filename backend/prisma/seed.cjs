const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const FALLBACK_ADMIN_PASSWORD = 'Admin123!';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HAS_EXPLICIT_SEED_PASSWORD = typeof process.env.SEED_ADMIN_PASSWORD === 'string' && process.env.SEED_ADMIN_PASSWORD.trim().length > 0;
const TEST_USERS_PASSWORD = 'Test12345!';

const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@volt.local';
const DEFAULT_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD;

if (IS_PRODUCTION && !HAS_EXPLICIT_SEED_PASSWORD) {
  console.warn('[seed] warning: SEED_ADMIN_PASSWORD is not set in production; admin seeding will be skipped');
} else if (DEFAULT_ADMIN_PASSWORD === FALLBACK_ADMIN_PASSWORD) {
  console.warn('[seed] warning: using default admin password; set SEED_ADMIN_PASSWORD for safer setup');
}

function loadSeedProducts() {
  const candidates = [
    process.env.SEED_PRODUCTS_PATH,
    '/seed/products.json',
    path.resolve(__dirname, '..', '..', '..', 'lib', 'data', 'products.json'),
    path.join(__dirname, 'seed-products.json')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return require(candidate);
    }
  }

  throw new Error('No seed products file found');
}

const seedProducts = loadSeedProducts();

function slugify(value) {
  return (value || 'product')
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

function normalizeImages(product) {
  const values = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(values));
}

function normalizeSpecs(product) {
  if (!Array.isArray(product.specs)) {
    return [];
  }

  return product.specs
    .map((spec) => ({
      label: String(spec.label || '').trim(),
      value: String(spec.value || '').trim()
    }))
    .filter((spec) => spec.label && spec.value);
}

function usernameFromName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'user';
}

function loadUsersFromTextFile() {
  const filePath = path.resolve(__dirname, 'testusers.txt');
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const users = [];
  for (const line of lines) {
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length < 4) {
      continue;
    }

    const [fullName, phone, email, city] = parts;
    users.push({
      email,
      username: usernameFromName(fullName),
      phone,
      city,
      country: 'KZ'
    });
  }

  return users;
}

async function seedAdmin() {
  if (IS_PRODUCTION && !HAS_EXPLICIT_SEED_PASSWORD) {
    return null;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash,
      role: Role.ADMIN
    },
    create: {
      email: DEFAULT_ADMIN_EMAIL,
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash,
      role: Role.ADMIN
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true
    }
  });

  return admin;
}

async function seedTestUsers() {
  const predefinedUsers = [
    { email: 'aibek.djaksybekov@example.com', username: 'Айбек_Джаксыбеков', phone: '+77011234567', city: 'Алматы', country: 'KZ' },
    { email: 'nurlan.seitkali@example.com', username: 'Нурлан_Сейткали', phone: '+77017654321', city: 'Астана', country: 'KZ' },
    { email: 'dinara.bekova@example.com', username: 'Динара_Бекова', phone: '+77019876543', city: 'Шымкент', country: 'KZ' },
    { email: 'yerlan.abenov@example.com', username: 'Ерлан_Абенов', phone: '+77012345678', city: 'Астана', country: 'KZ' },
    { email: 'madina.sultanova@example.com', username: 'Мадина_Султанова', phone: '+77015678901', city: 'Алматы', country: 'KZ' },
    { email: 'aleksei.petrov@example.com', username: 'Алексей_Петров', phone: '+77071234567', city: 'Алматы', country: 'KZ' },
    { email: 'marina.volkova@example.com', username: 'Марина_Волкова', phone: '+77077654321', city: 'Алматы', country: 'KZ' },
    { email: 'dmitry.sokolov@example.com', username: 'Дмитрий_Соколов', phone: '+77019876543', city: 'Шымкент', country: 'KZ' },
    { email: 'olga.novikova@example.com', username: 'Ольга_Новикова', phone: '+77082345678', city: 'Астана', country: 'KZ' },
    { email: 'sergei.morozov@example.com', username: 'Сергей_Морозов', phone: '+77085678901', city: 'Астана', country: 'KZ' },
  ];
  const fileUsers = loadUsersFromTextFile();
  const testUsers = [...predefinedUsers, ...fileUsers];

  const created = [];
  try {
    const passwordHash = await bcrypt.hash(TEST_USERS_PASSWORD, SALT_ROUNDS);

    for (const user of testUsers) {
      const result = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          username: user.username,
          passwordHash,
          role: Role.USER,
          phone: user.phone,
          city: user.city,
          country: user.country
        },
        create: {
          email: user.email,
          username: user.username,
          passwordHash,
          role: Role.USER,
          phone: user.phone,
          city: user.city,
          country: user.country
        },
        select: { email: true, username: true }
      });
      created.push(result);
    }
  } catch (error) {
    console.error('[seed] test users error:', error.message);
  }
  return created;
}

async function seedCatalog() {
  for (const product of seedProducts) {
    const images = normalizeImages(product);
    const specs = normalizeSpecs(product);
    const productData = {
      id: product.id,
      slug: product.slug || slugify(product.name),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.inStock ? 10 : 0,
      rating: typeof product.rating === 'number' ? product.rating : 0,
      imageUrl: product.image,
      images,
      specs,
    };

    const existing = await prisma.product.findUnique({
      where: { id: productData.id },
      select: { id: true }
    });

    if (existing) {
      const { id, ...updateData } = productData;
      await prisma.product.update({
        where: { id: existing.id },
        data: updateData
      });
      continue;
    }

    await prisma.product.create({ data: productData });
  }
}

async function main() {
  const admin = await seedAdmin();
  await seedCatalog();
  const testUsers = await seedTestUsers();

  const productCount = await prisma.product.count();
  if (admin) {
    console.log('[seed] admin:', admin.email, 'role=' + admin.role);
  } else {
    console.log('[seed] admin: skipped');
  }
  console.log('[seed] test users:', testUsers.map(u => u.email).join(', '));
  console.log('[seed] products:', productCount);
}

main()
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
