import { Request, Response } from 'express';
import { ReviewsService } from '../services/reviews.service.js';

const reviewsService = new ReviewsService();

export const getReviews = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.query.productId as string);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'productId query param is required' });
    }
    const reviews = await reviewsService.getByProduct(productId);
    res.json(reviews);
  } catch (error: any) {
    const status = error.message === 'Product not found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, rating, comment } = req.body;
    if (!productId || typeof productId !== 'number') {
      return res.status(400).json({ error: 'productId is required and must be a number' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }
    const review = await reviewsService.create(userId, productId, rating, comment);
    res.status(201).json(review);
  } catch (error: any) {
    const status = error.message === 'Product not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const reviewId = parseInt(req.params.id);
    if (isNaN(reviewId)) return res.status(400).json({ error: 'Invalid review id' });
    await reviewsService.delete(userId, reviewId, isAdmin);
    res.json({ message: 'Review deleted' });
  } catch (error: any) {
    const status = error.message === 'Review not found' ? 404 : error.message === 'Forbidden' ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};
