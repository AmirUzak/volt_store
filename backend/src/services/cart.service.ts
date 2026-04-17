import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

type CartProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string | null;
};

export class CartService {
  static async getCart(userId: string) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" }
    });
  }

  static async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    productData?: CartProductInput
  ) {
    if (!productId || !quantity) {
      throw new HttpError(400, "productId and quantity are required");
    }

    if (quantity <= 0) {
      throw new HttpError(400, "quantity must be greater than 0");
    }

    let product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product && productData) {
      product = await prisma.product.upsert({
        where: { id: productId },
        update: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock: productData.stock,
          imageUrl: productData.imageUrl ?? null,
        },
        create: {
          id: productId,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock: productData.stock,
          imageUrl: productData.imageUrl ?? null,
        },
      });
    }

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: existing.quantity + quantity },
        include: { product: true }
      });
    }

    return prisma.cartItem.create({
      data: { userId, productId, quantity },
      include: { product: true }
    });
  }

  static async updateQuantity(userId: string, productId: string, quantity: number) {
    if (!quantity || quantity <= 0) {
      throw new HttpError(400, "quantity must be greater than 0");
    }

    const item = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });

    if (!item) {
      throw new HttpError(404, "Cart item not found");
    }

    return prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: { product: true }
    });
  }

  static async removeFromCart(userId: string, productId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });

    if (!item) {
      throw new HttpError(404, "Cart item not found");
    }

    await prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } }
    });

    return { message: "Item removed from cart" };
  }

  static async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({ where: { userId } });
    return { message: "Cart cleared" };
  }
}
