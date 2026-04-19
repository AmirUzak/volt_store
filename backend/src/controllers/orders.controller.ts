import { Request, Response } from "express";
import { OrdersService } from "../services/orders.service";
import { EmailService } from "../services/email.service";
import { HttpError } from "../utils/httpError";

export class OrdersController {
  static async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const order = await OrdersService.createOrder(req.user.userId);

      void EmailService.sendOrderCreatedEmail({
        to: order.user.email,
        username: order.user.username,
        orderId: order.id,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder
        }))
      }).catch((error) => {
        console.error("[email] order_created_send_failed", {
          orderId: order.id,
          email: order.user.email,
          error: error instanceof Error ? error.message : "unknown"
        });
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async myOrders(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const orders = await OrdersService.getMyOrders(req.user.userId);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async allOrders(req: Request, res: Response) {
    try {
      const orders = await OrdersService.getAllOrders();
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const order = await OrdersService.updateOrderStatus(req.params.id, status);

      void EmailService.sendOrderStatusUpdatedEmail({
        to: order.user.email,
        username: order.user.username,
        orderId: order.id,
        status: order.status
      }).catch((error) => {
        console.error("[email] order_status_send_failed", {
          orderId: order.id,
          email: order.user.email,
          error: error instanceof Error ? error.message : "unknown"
        });
      });

      res.status(200).json(order);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
