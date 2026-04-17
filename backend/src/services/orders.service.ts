import { OrderStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

export class OrdersService {
  static async createOrder(userId: string) {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (!cartItems.length) {
      throw new HttpError(400, "Cart is empty");
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: item.product.price
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      await tx.cartItem.deleteMany({ where: { userId } });
      return createdOrder;
    });

    return order;
  }

  static async getMyOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getAllOrders() {
    return prisma.order.findMany({
      include: {
        user: { select: { id: true, email: true, username: true } },
        items: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async updateOrderStatus(orderId: string, status: string) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new HttpError(
        400,
        "Invalid status. Use: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED"
      );
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      throw new HttpError(404, "Order not found");
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        user: { select: { id: true, email: true, username: true } },
        items: { include: { product: true } }
      }
    });
  }
}
