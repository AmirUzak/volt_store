import prisma from '../utils/prisma.js';

export class CartService {
  private async ensureCart(userId: number) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  async getCart(userId: number) {
    const cart = await this.ensureCart(userId);
    return prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  async addItem(userId: number, productId: number, quantity: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Not enough stock');

    const cart = await this.ensureCart(userId);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) throw new Error('Not enough stock');
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: true },
      });
    }

    return prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
      include: { product: true },
    });
  }

  async updateItem(userId: number, itemId: number, quantity: number) {
    const cart = await this.ensureCart(userId);
    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) throw new Error('Cart item not found');

    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.stock < quantity) throw new Error('Not enough stock');

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.ensureCart(userId);
    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) throw new Error('Cart item not found');
    await prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(userId: number) {
    const cart = await this.ensureCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
