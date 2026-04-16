import prisma from '../utils/prisma.js';

export class ProductsService {
  async getAll(page: number, limit: number, category?: string) {
    const skip = (page - 1) * limit;
    const where = category ? { category } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async getById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new Error('Product not found');
    return product;
  }

  async create(data: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    image?: string;
    category?: string;
  }) {
    return prisma.product.create({ data });
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      image?: string;
      category?: string;
    },
  ) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: number) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');
    await prisma.product.delete({ where: { id } });
  }
}
