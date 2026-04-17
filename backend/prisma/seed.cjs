const bcrypt = require('bcrypt');
const path = require('path');
const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@volt.local';
const DEFAULT_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const seedProducts = require(path.join(__dirname, 'seed-products.json'));

async function seedAdmin() {
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
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.inStock ? 10 : 0,
      imageUrl: product.image,
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
  console.log('[seed] admin:', admin.email, 'role=' + admin.role);
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
