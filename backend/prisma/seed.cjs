const bcrypt = require('bcrypt');
const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@volt.local';
const DEFAULT_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

const seedProducts = [
  {
    name: 'AeroBook 14',
    description: 'Slim 14-inch ultrabook for daily work and study.',
    price: 499990,
    category: 'laptops',
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200'
  },
  {
    name: 'VOLTPhone X',
    description: 'Flagship smartphone with OLED display and fast charging.',
    price: 389990,
    category: 'smartphones',
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200'
  },
  {
    name: 'Pulse Buds Pro',
    description: 'Wireless earbuds with ANC and transparent mode.',
    price: 69990,
    category: 'audio',
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=1200'
  },
  {
    name: 'Titan 27 2K',
    description: '27-inch 2K IPS monitor with 165Hz refresh rate.',
    price: 159990,
    category: 'monitors',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200'
  },
  {
    name: 'SparkPad 11',
    description: 'Lightweight tablet with stylus support.',
    price: 229990,
    category: 'tablets',
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1200'
  },
  {
    name: 'Nova Watch S',
    description: 'Smartwatch with health tracking and GPS.',
    price: 89990,
    category: 'wearables',
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200'
  }
];

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
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
      select: { id: true }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: product.description,
          price: product.price,
          category: product.category,
          stock: product.stock,
          imageUrl: product.imageUrl
        }
      });
      continue;
    }

    await prisma.product.create({ data: product });
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
