import { Request, Response } from "express";
import { ReviewsService } from "../services/reviews.service";
import { HttpError } from "../utils/httpError";

export class ReviewsController {
  static async getByProduct(req: Request, res: Response) {
    try {
      const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
      const rating = typeof req.query.rating === "string" ? Number(req.query.rating) : undefined;

      const reviews = await ReviewsService.getByProduct(req.params.productId, {
        sort: sort as "newest" | "oldest" | "rating_desc" | "rating_asc" | undefined,
        rating: Number.isInteger(rating) ? rating : undefined,
      });
      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getMine(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const reviews = await ReviewsService.getMine(req.user.userId);
      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async upsert(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { productId, rating, comment } = req.body;
      const review = await ReviewsService.upsert(req.user.userId, productId, Number(rating), comment);
      res.status(200).json(review);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const result = await ReviewsService.remove(req.user.userId, req.params.id);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
