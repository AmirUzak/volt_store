import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { HttpError } from "../utils/httpError";

export class CartController {
  static async getCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cart = await CartService.getCart(req.user.userId);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async addToCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { productId, quantity, product } = req.body;
      const item = await CartService.addToCart(
        req.user.userId,
        productId,
        Number(quantity),
        product
      );
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async updateQuantity(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { quantity } = req.body;
      const item = await CartService.updateQuantity(
        req.user.userId,
        req.params.productId,
        Number(quantity)
      );
      res.status(200).json(item);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async removeFromCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const result = await CartService.removeFromCart(
        req.user.userId,
        req.params.productId
      );
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async clearCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const result = await CartService.clearCart(req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
