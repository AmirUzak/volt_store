import { Request, Response } from 'express';
import { CartService } from '../services/cart.service.js';

const cartService = new CartService();

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await cartService.getCart(userId);
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity } = req.body;
    if (!productId || typeof productId !== 'number') {
      return res.status(400).json({ error: 'productId is required and must be a number' });
    }
    const qty = quantity ?? 1;
    if (typeof qty !== 'number' || qty < 1) {
      return res.status(400).json({ error: 'quantity must be a positive number' });
    }
    const item = await cartService.addItem(userId, productId, qty);
    res.status(201).json(item);
  } catch (error: any) {
    const status = error.message === 'Product not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) return res.status(400).json({ error: 'Invalid item id' });
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: 'quantity must be a positive number' });
    }
    const item = await cartService.updateItem(userId, itemId, quantity);
    res.json(item);
  } catch (error: any) {
    const status = error.message === 'Cart item not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
};

export const removeItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) return res.status(400).json({ error: 'Invalid item id' });
    await cartService.removeItem(userId, itemId);
    res.json({ message: 'Item removed' });
  } catch (error: any) {
    const status = error.message === 'Cart item not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await cartService.clearCart(userId);
    res.json({ message: 'Cart cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
