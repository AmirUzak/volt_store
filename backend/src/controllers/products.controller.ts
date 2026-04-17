import { Request, Response } from "express";
import { ProductsService } from "../services/products.service";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { HttpError } from "../utils/httpError";

export class ProductsController {
  static async getAll(req: Request, res: Response) {
    try {
      const { category, search, sort } = req.query;
      const products = await ProductsService.getAll({
        category: category as string,
        search: search as string,
        sort: sort as string
      });
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const product = await ProductsService.getById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, description, price, category, stock, imageUrl: imageUrlFromBody } = req.body;
      let imageUrl: string | undefined;

      if (req.file?.buffer) {
        imageUrl = await uploadBufferToCloudinary(req.file.buffer);
      } else if (typeof imageUrlFromBody === "string" && imageUrlFromBody.trim()) {
        imageUrl = imageUrlFromBody.trim();
      }

      const product = await ProductsService.create({
        name,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        imageUrl
      });

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { name, description, price, category, stock, imageUrl: imageUrlFromBody } = req.body;
      let imageUrl: string | undefined;

      if (req.file?.buffer) {
        imageUrl = await uploadBufferToCloudinary(req.file.buffer);
      } else if (typeof imageUrlFromBody === "string" && imageUrlFromBody.trim()) {
        imageUrl = imageUrlFromBody.trim();
      }

      const product = await ProductsService.update(req.params.id, {
        name,
        description,
        category,
        imageUrl,
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(stock !== undefined ? { stock: Number(stock) } : {})
      });

      res.status(200).json(product);
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
      const result = await ProductsService.remove(req.params.id);
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
