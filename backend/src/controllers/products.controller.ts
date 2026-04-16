import { Request, Response } from 'express';
import { ProductsService } from '../services/products.service.js';

const productsService = new ProductsService();

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const category = req.query.category as string | undefined;
    const result = await productsService.getAll(page, limit, category);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product id' });
    const product = await productsService.getById(id);
    res.json(product);
  } catch (error: any) {
    const status = error.message === 'Product not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, image, category } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'name and price are required' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative number' });
    }
    const product = await productsService.create({ name, description, price, stock: stock ?? 0, image, category });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product id' });
    const { name, description, price, stock, image, category } = req.body;
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative number' });
    }
    const product = await productsService.update(id, { name, description, price, stock, image, category });
    res.json(product);
  } catch (error: any) {
    const status = error.message === 'Product not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product id' });
    await productsService.delete(id);
    res.json({ message: 'Product deleted' });
  } catch (error: any) {
    const status = error.message === 'Product not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};
