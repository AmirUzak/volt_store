import { Request, Response } from 'express';
import { OrdersService } from '../services/orders.service.js';

const ordersService = new OrdersService();

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const orders = await ordersService.getUserOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order id' });
    const order = await ordersService.getOrderById(userId, orderId, isAdmin);
    res.json(order);
  } catch (error: any) {
    const status = error.message === 'Order not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const checkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const order = await ordersService.checkout(userId);
    res.status(201).json(order);
  } catch (error: any) {
    const status = error.message === 'Cart is empty' ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order id' });
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const order = await ordersService.updateStatus(orderId, status);
    res.json(order);
  } catch (error: any) {
    const status = error.message === 'Order not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
};
