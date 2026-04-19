import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

const normalizeComment = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "comment must be a string");
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > 1000) {
    throw new HttpError(400, "comment is too long");
  }

  return normalized;
};

const ensureRating = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new HttpError(400, "rating must be an integer");
  }

  if (value < 1 || value > 5) {
    throw new HttpError(400, "rating must be between 1 and 5");
  }

  return value;
};

const formatReview = (review: {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { id: string; username: string };
  product: { id: string; name: string; imageUrl: string | null };
}) => ({
  id: review.id,
  userId: review.userId,
  productId: review.productId,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  user: {
    id: review.user.id,
    username: review.user.username,
  },
  product: {
    id: review.product.id,
    name: review.product.name,
    image: review.product.imageUrl,
  },
});

const recalculateProductRating = async (productId: string) => {
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
  });

  const average = stats._avg.rating ?? 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Number(average.toFixed(2)),
    },
  });
};

export class ReviewsService {
  static async getByProduct(productId: string) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    return reviews.map(formatReview);
  }

  static async getMine(userId: string) {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    return reviews.map(formatReview);
  }

  static async upsert(userId: string, productId: string, ratingInput: unknown, commentInput: unknown) {
    const rating = ensureRating(ratingInput);
    const comment = normalizeComment(commentInput);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId,
        productId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, username: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    await recalculateProductRating(productId);

    return formatReview(review);
  }

  static async remove(userId: string, reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, productId: true },
    });

    if (!review) {
      throw new HttpError(404, "Review not found");
    }

    if (review.userId !== userId) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.review.delete({ where: { id: reviewId } });
    await recalculateProductRating(review.productId);

    return { message: "Review deleted" };
  }
}
