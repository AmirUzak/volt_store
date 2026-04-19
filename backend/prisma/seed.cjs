const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const FALLBACK_ADMIN_PASSWORD = 'Admin123!';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HAS_EXPLICIT_SEED_PASSWORD = typeof process.env.SEED_ADMIN_PASSWORD === 'string' && process.env.SEED_ADMIN_PASSWORD.trim().length > 0;

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

  const productCount = await prisma.product.count();
  if (admin) {
    console.log('[seed] admin:', admin.email, 'role=' + admin.role);
  } else {
    console.log('[seed] admin: skipped');
  }
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
