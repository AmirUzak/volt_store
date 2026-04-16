import { Prisma, CartItem, Product } from '@prisma/client';
import prisma from '../utils/prisma.js';

export class OrdersService {
  async getUserOrders(userId: number) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(userId: number, orderId: number, isAdmin: boolean) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!order) throw new Error('Order not found');
    if (!isAdmin && order.userId !== userId) throw new Error('Order not found');
    return order;
  }

  async checkout(userId: number) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new Error(`Not enough stock for product: ${item.product.name}`);
      }
    }

    const total = cart.items.reduce(
      (sum: number, item: CartItem & { product: Product }) => sum + item.product.price * item.quantity,
      0,
    );

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: cart.items.map((item: CartItem & { product: Product }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // Decrement stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return order;
  }

  async updateStatus(orderId: number, status: string) {
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error('Order not found');
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  }
}
