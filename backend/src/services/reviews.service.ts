import prisma from '../utils/prisma.js';

export class ReviewsService {
  async getByProduct(productId: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    return prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: number, productId: number, rating: number, comment?: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const existing = await prisma.review.findFirst({
      where: { userId, productId },
    });
    if (existing) throw new Error('You have already reviewed this product');

    const review = await prisma.review.create({
      data: { userId, productId, rating, comment },
      include: { user: { select: { id: true, username: true } } },
    });

    await this.recalcRating(productId);
    return review;
  }

  async delete(userId: number, reviewId: number, isAdmin: boolean) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found');
    if (!isAdmin && review.userId !== userId) throw new Error('Forbidden');

    await prisma.review.delete({ where: { id: reviewId } });
    await this.recalcRating(review.productId);
  }

  private async recalcRating(productId: number) {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: { rating: result._avg.rating ?? 0 },
    });
  }
}
